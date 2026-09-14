import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileExists, normalizePath } from './detect.mjs';

/**
 * Synchronizes MANIFEST.md with renamed and deleted files.
 *
 * @param {Object} options
 * @param {string} options.root
 * @param {Set<string>} options.deletedFiles Relative paths of deleted files
 * @param {Array<{ from: string, to: string, relativeFrom: string, relativeTo: string }>} options.renamedFiles
 * @return {Promise<Object|null>}
 */
export async function syncManifest( { root, deletedFiles, renamedFiles } ) {
	const manifestPath = join( root, 'MANIFEST.md' );
	if ( ! ( await fileExists( manifestPath ) ) ) {
		return null;
	}

	const source = await readFile( manifestPath, 'utf8' );
	const lines = source.split( '\n' );
	const updatedLines = [];

	const deletedSet = new Set(
		Array.from( deletedFiles ).map( ( p ) => p.replace( /^\/+/, '' ) )
	);
	const renameMap = new Map();
	for ( const r of renamedFiles ) {
		const fromRel = ( r.relativeFrom || r.from ).replace( /^\/+/, '' );
		const toRel = ( r.relativeTo || r.to ).replace( /^\/+/, '' );
		renameMap.set( fromRel, toRel );
	}

	for ( const line of lines ) {
		// Check if line is a table row with a file path: `| \`path\` | ...`
		const match = line.match( /\|\s*`([^`]+)`\s*\|/ );
		if ( match ) {
			const filePath = match[ 1 ].replace( /^\/+/, '' );

			// Check if this file was deleted
			if ( deletedSet.has( filePath ) ) {
				continue;
			}

			// Check if this file was renamed
			if ( renameMap.has( filePath ) ) {
				const newPath = renameMap.get( filePath );
				updatedLines.push( line.replace( `\`${ match[ 1 ] }\``, `\`${ newPath }\`` ) );
				continue;
			}
		}

		updatedLines.push( line );
	}

	const updated = updatedLines.join( '\n' );
	if ( updated === source ) {
		return null;
	}

	return {
		path: manifestPath,
		relativePath: normalizePath( root, manifestPath ),
		before: source,
		after: updated,
	};
}
