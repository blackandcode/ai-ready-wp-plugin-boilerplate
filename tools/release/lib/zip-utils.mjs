import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { crc32, deflateRawSync, inflateRawSync } from 'node:zlib';

/**
 * Converts a JS Date into DOS time and date (uint16 pair).
 *
 * @param {Date} [date] Date instance (defaults to current date)
 * @return {{ dosTime: number, dosDate: number }} DOS time and date
 */
export function toDosDateTime( date = new Date() ) {
	const year = Math.max( 1980, date.getFullYear() );
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const seconds = date.getSeconds();

	const dosTime = ( ( hours << 11 ) | ( minutes << 5 ) | ( seconds >> 1 ) ) & 0xffff;
	const dosDate = ( ( ( year - 1980 ) << 9 ) | ( month << 5 ) | day ) & 0xffff;

	return { dosTime, dosDate };
}

/**
 * Creates a standard PKZIP archive from a list of entries with zero external dependencies.
 *
 * @param {Array<{ path: string, data: Buffer|string, mtime?: Date }>} entries File entries to pack
 * @param {string} outputPath Target ZIP file path
 * @return {Promise<{ zipPath: string, size: number, sha256: string, totalEntries: number }>} Archive details
 */
export async function createZip( entries, outputPath ) {
	const localParts = [];
	const centralParts = [];
	let currentOffset = 0;

	// Sort entries alphabetically for deterministic, reproducible ZIP builds
	const sortedEntries = [ ...entries ].sort( ( a, b ) => a.path.localeCompare( b.path ) );

	for ( const entry of sortedEntries ) {
		const normPath = entry.path.replace( /\\/g, '/' );
		const isDir = normPath.endsWith( '/' );
		const filenameBuf = Buffer.from( normPath, 'utf8' );

		let rawData = Buffer.isBuffer( entry.data )
			? entry.data
			: Buffer.from( entry.data || '' );

		if ( isDir ) {
			rawData = Buffer.alloc( 0 );
		}

		const dataCrc = isDir ? 0 : crc32( rawData );
		const uncompressedSize = rawData.length;

		let method = 8; // Deflate
		let compressedData = isDir ? Buffer.alloc( 0 ) : deflateRawSync( rawData );

		// If compression didn't save bytes, store uncompressed
		if ( ! isDir && compressedData.length >= uncompressedSize ) {
			method = 0; // Stored
			compressedData = rawData;
		}

		const compressedSize = compressedData.length;
		const { dosTime, dosDate } = toDosDateTime( entry.mtime );

		// Local Header (30 bytes + filename)
		const lh = Buffer.alloc( 30 + filenameBuf.length );
		lh.writeUInt32LE( 0x04034b50, 0 ); // signature
		lh.writeUInt16LE( 20, 4 ); // version needed
		lh.writeUInt16LE( 0x0800, 6 ); // flags (UTF-8)
		lh.writeUInt16LE( method, 8 ); // compression method
		lh.writeUInt16LE( dosTime, 10 );
		lh.writeUInt16LE( dosDate, 12 );
		lh.writeUInt32LE( dataCrc, 14 );
		lh.writeUInt32LE( compressedSize, 18 );
		lh.writeUInt32LE( uncompressedSize, 22 );
		lh.writeUInt16LE( filenameBuf.length, 26 );
		lh.writeUInt16LE( 0, 28 ); // extra field length
		filenameBuf.copy( lh, 30 );

		// Central Directory Header (46 bytes + filename)
		const cdh = Buffer.alloc( 46 + filenameBuf.length );
		cdh.writeUInt32LE( 0x02014b50, 0 ); // signature
		cdh.writeUInt16LE( 20, 4 ); // version made by
		cdh.writeUInt16LE( 20, 6 ); // version needed
		cdh.writeUInt16LE( 0x0800, 8 ); // flags (UTF-8)
		cdh.writeUInt16LE( method, 10 ); // method
		cdh.writeUInt16LE( dosTime, 12 );
		cdh.writeUInt16LE( dosDate, 14 );
		cdh.writeUInt32LE( dataCrc, 16 );
		cdh.writeUInt32LE( compressedSize, 20 );
		cdh.writeUInt32LE( uncompressedSize, 24 );
		cdh.writeUInt16LE( filenameBuf.length, 28 );
		cdh.writeUInt16LE( 0, 30 ); // extra field length
		cdh.writeUInt16LE( 0, 32 ); // file comment length
		cdh.writeUInt16LE( 0, 34 ); // disk number start
		cdh.writeUInt16LE( 0, 36 ); // internal file attributes
		const externalAttr = isDir ? ( ( 0o040755 << 16 ) >>> 0 ) : ( ( 0o100644 << 16 ) >>> 0 );
		cdh.writeUInt32LE( externalAttr, 38 ); // external file attributes
		cdh.writeUInt32LE( currentOffset, 42 ); // relative offset of local header
		filenameBuf.copy( cdh, 46 );

		localParts.push( lh, compressedData );
		centralParts.push( cdh );
		currentOffset += lh.length + compressedData.length;
	}

	const cdOffset = currentOffset;
	const centralDirBuf = Buffer.concat( centralParts );
	const cdSize = centralDirBuf.length;

	// End of Central Directory Record (22 bytes)
	const eocd = Buffer.alloc( 22 );
	eocd.writeUInt32LE( 0x06054b50, 0 ); // signature
	eocd.writeUInt16LE( 0, 4 ); // disk number
	eocd.writeUInt16LE( 0, 6 ); // start disk
	eocd.writeUInt16LE( sortedEntries.length, 8 ); // records on disk
	eocd.writeUInt16LE( sortedEntries.length, 10 ); // total records
	eocd.writeUInt32LE( cdSize, 12 ); // CD size
	eocd.writeUInt32LE( cdOffset, 16 ); // CD offset
	eocd.writeUInt16LE( 0, 20 ); // comment length

	const fullArchive = Buffer.concat( [ ...localParts, centralDirBuf, eocd ] );

	await mkdir( dirname( outputPath ), { recursive: true } );
	await writeFile( outputPath, fullArchive );

	const sha256 = createHash( 'sha256' ).update( fullArchive ).digest( 'hex' );

	return {
		zipPath: outputPath,
		size: fullArchive.length,
		sha256,
		totalEntries: sortedEntries.length,
	};
}

/**
 * Lists all file and directory entries inside a ZIP archive.
 *
 * @param {string} zipPath Path to the ZIP file
 * @return {Promise<Array<{ filename: string, compressedSize: number, uncompressedSize: number, method: number, isDirectory: boolean, crc32: number, localHeaderOffset: number }>>} Entries
 */
export async function listZip( zipPath ) {
	const buf = await readFile( zipPath );
	const eocdSignature = Buffer.from( [ 0x50, 0x4b, 0x05, 0x06 ] );
	const eocdIdx = buf.lastIndexOf( eocdSignature );

	if ( eocdIdx === -1 ) {
		throw new Error( `Invalid ZIP archive: End of Central Directory record not found in ${ zipPath }` );
	}

	const totalEntries = buf.readUInt16LE( eocdIdx + 10 );
	const cdOffset = buf.readUInt32LE( eocdIdx + 16 );

	const entries = [];
	let pos = cdOffset;

	for ( let i = 0; i < totalEntries; i++ ) {
		const sig = buf.readUInt32LE( pos );
		if ( sig !== 0x02014b50 ) {
			throw new Error( `Corrupt Central Directory header at offset ${ pos } in ${ zipPath }` );
		}

		const method = buf.readUInt16LE( pos + 10 );
		const dataCrc = buf.readUInt32LE( pos + 16 );
		const compressedSize = buf.readUInt32LE( pos + 20 );
		const uncompressedSize = buf.readUInt32LE( pos + 24 );
		const nameLen = buf.readUInt16LE( pos + 28 );
		const extraLen = buf.readUInt16LE( pos + 30 );
		const commentLen = buf.readUInt16LE( pos + 32 );
		const localOffset = buf.readUInt32LE( pos + 42 );

		const filename = buf.toString( 'utf8', pos + 46, pos + 46 + nameLen );
		const isDirectory = filename.endsWith( '/' );

		entries.push( {
			filename,
			compressedSize,
			uncompressedSize,
			method,
			crc32: dataCrc,
			isDirectory,
			localHeaderOffset: localOffset,
		} );

		pos += 46 + nameLen + extraLen + commentLen;
	}

	return entries;
}

/**
 * Extracts all files from a ZIP archive into a target directory.
 *
 * @param {string} zipPath Path to the ZIP file
 * @param {string} targetDir Destination directory
 * @return {Promise<Array<string>>} List of extracted relative file paths
 */
export async function extractZip( zipPath, targetDir ) {
	const buf = await readFile( zipPath );
	const entries = await listZip( zipPath );
	const extractedPaths = [];

	for ( const entry of entries ) {
		const outPath = join( targetDir, entry.filename );

		if ( entry.isDirectory ) {
			await mkdir( outPath, { recursive: true } );
			continue;
		}

		await mkdir( dirname( outPath ), { recursive: true } );

		const localOffset = entry.localHeaderOffset;
		const localNameLen = buf.readUInt16LE( localOffset + 26 );
		const localExtraLen = buf.readUInt16LE( localOffset + 28 );
		const dataOffset = localOffset + 30 + localNameLen + localExtraLen;

		const rawData = buf.subarray( dataOffset, dataOffset + entry.compressedSize );
		let uncompressedData;

		if ( entry.method === 8 ) {
			uncompressedData = inflateRawSync( rawData );
		} else if ( entry.method === 0 ) {
			uncompressedData = rawData;
		} else {
			throw new Error( `Unsupported ZIP compression method ${ entry.method } for ${ entry.filename }` );
		}

		await writeFile( outPath, uncompressedData );
		extractedPaths.push( entry.filename );
	}

	return extractedPaths;
}
