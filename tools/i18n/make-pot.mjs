#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

const HELP = `
Usage: node tools/i18n/make-pot.mjs [options]

Extracts translatable strings from PHP and React/TypeScript source files
and generates gettext catalog files (.pot, .po, .mo) in languages/.

Options:
  --root <path>     Project root directory (defaults to current working directory)
  --slug <string>   Override plugin slug / text domain
  --name <string>   Override plugin display name
  --help, -h        Show this help message
`;

/**
 * Encodes messages array into GNU MO binary format.
 *
 * @param {Array<{msgid: string, msgstr: string}>} messages Sorted messages
 * @return {Buffer} MO binary buffer
 */
export function buildMoBuffer( messages ) {
	const numStrings = messages.length;
	const origTableOffset = 28;
	const transTableOffset = origTableOffset + numStrings * 8;
	let stringOffset = transTableOffset + numStrings * 8;

	const origTable = [];
	const transTable = [];
	const stringBuffers = [];

	for ( const item of messages ) {
		const origBuf = Buffer.from( item.msgid, 'utf8' );
		origTable.push( { length: origBuf.length, offset: stringOffset } );
		stringBuffers.push( origBuf, Buffer.from( [ 0 ] ) );
		stringOffset += origBuf.length + 1;
	}

	for ( const item of messages ) {
		const transBuf = Buffer.from( item.msgstr, 'utf8' );
		transTable.push( { length: transBuf.length, offset: stringOffset } );
		stringBuffers.push( transBuf, Buffer.from( [ 0 ] ) );
		stringOffset += transBuf.length + 1;
	}

	const header = Buffer.alloc( 28 );
	header.writeUInt32LE( 0x950412de, 0 ); // Magic number
	header.writeUInt32LE( 0, 4 ); // Format revision
	header.writeUInt32LE( numStrings, 8 ); // Number of strings
	header.writeUInt32LE( origTableOffset, 12 ); // Offset of originals table
	header.writeUInt32LE( transTableOffset, 16 ); // Offset of translations table
	header.writeUInt32LE( 0, 20 ); // Size of hash table
	header.writeUInt32LE( 0, 24 ); // Offset of hash table

	const origTableBuf = Buffer.alloc( numStrings * 8 );
	for ( let i = 0; i < numStrings; i++ ) {
		origTableBuf.writeUInt32LE( origTable[ i ].length, i * 8 );
		origTableBuf.writeUInt32LE( origTable[ i ].offset, i * 8 + 4 );
	}

	const transTableBuf = Buffer.alloc( numStrings * 8 );
	for ( let i = 0; i < numStrings; i++ ) {
		transTableBuf.writeUInt32LE( transTable[ i ].length, i * 8 );
		transTableBuf.writeUInt32LE( transTable[ i ].offset, i * 8 + 4 );
	}

	return Buffer.concat( [
		header,
		origTableBuf,
		transTableBuf,
		...stringBuffers,
	] );
}

/**
 * Discovers the main plugin file and extracts slug and name.
 *
 * @param {string} root Project root
 * @return {Promise<{slug: string, name: string}>} Metadata
 */
async function detectMetadata( root ) {
	const entries = await readdir( root, { withFileTypes: true } );
	let slug = 'wp-ai-ready-plugin-boilerplate';
	let name = 'WP AI Ready Plugin Boilerplate';

	for ( const entry of entries ) {
		if ( entry.isFile() && entry.name.endsWith( '.php' ) ) {
			const content = await readFile( join( root, entry.name ), 'utf8' );
			if ( content.includes( 'Plugin Name:' ) ) {
				const nameMatch = content.match( /Plugin Name:\s*([^\r\n*]+)/ );
				if ( nameMatch ) {
					name = nameMatch[ 1 ].trim();
				}
				const textDomainMatch = content.match(
					/Text Domain:\s*([^\r\n*]+)/
				);
				if ( textDomainMatch ) {
					slug = textDomainMatch[ 1 ].trim();
				} else {
					slug = entry.name.replace( /\.php$/, '' );
				}
				break;
			}
		}
	}

	return { slug, name };
}

/**
 * Extracts translatable strings from text content.
 *
 * @param {string} content  Source file content
 * @param {string} filePath Relative file path
 * @return {Array<{msgid: string, file: string, line: number}>} Extracted items
 */
function extractStrings( content, filePath ) {
	const results = [];
	const lines = content.split( '\n' );

	const regexes = [
		// __("text", "domain") or esc_html__("text", "domain") or esc_attr__("text", "domain")
		/(?:__|_e|esc_html__|esc_attr__|esc_html_e|esc_attr_e)\s*\(\s*(['"])((?:\\.|(?!\1).)*)\1/g,
		// _x("text", "context", "domain")
		/_x\s*\(\s*(['"])((?:\\.|(?!\1).)*)\1\s*,\s*(['"])((?:\\.|(?!\3).)*)\3/g,
	];

	for ( let lineNum = 0; lineNum < lines.length; lineNum++ ) {
		const line = lines[ lineNum ];
		for ( const regex of regexes ) {
			regex.lastIndex = 0;
			let match;
			while ( ( match = regex.exec( line ) ) !== null ) {
				const raw = match[ 2 ];
				// Unescape
				const unescaped = raw.replace( /\\(['"])/g, '$1' );
				if ( unescaped.trim().length > 0 ) {
					results.push( {
						msgid: unescaped,
						file: filePath,
						line: lineNum + 1,
					} );
				}
			}
		}
	}

	return results;
}

/**
 * Recursively collects translatable files.
 *
 * @param {string} dir Current directory
 * @return {Promise<string[]>} File paths
 */
async function collectFiles( dir ) {
	const files = [];
	const entries = await readdir( dir, { withFileTypes: true } );

	for ( const entry of entries ) {
		const full = join( dir, entry.name );
		if ( entry.isDirectory() ) {
			if (
				entry.name === 'node_modules' ||
				entry.name === 'vendor' ||
				entry.name === 'build' ||
				entry.name === 'dist' ||
				entry.name === 'coverage' ||
				entry.name === 'tests' ||
				entry.name === '.git'
			) {
				continue;
			}
			files.push( ...( await collectFiles( full ) ) );
		} else if ( entry.isFile() ) {
			if (
				entry.name.endsWith( '.php' ) ||
				entry.name.endsWith( '.ts' ) ||
				entry.name.endsWith( '.tsx' ) ||
				entry.name.endsWith( '.js' )
			) {
				files.push( full );
			}
		}
	}

	return files;
}

/**
 * Formats strings into POT catalog format.
 *
 * @param {string}                                                    name
 * @param {string}                                                    slug
 * @param {Map<string, Array<{file: string, line: number}>>} stringMap
 * @return {string} POT content
 */
function generatePotContent( name, slug, stringMap ) {
	const dateStr = new Date()
		.toISOString()
		.replace( 'T', ' ' )
		.replace( /\..+/, '+0000' );

	let pot = `# Copyright (C) 2026 ${ name }
# This file is distributed under the same license as the ${ name } package.
msgid ""
msgstr ""
"Project-Id-Version: ${ name }\\n"
"Report-Msgid-Bugs-To: \\n"
"POT-Creation-Date: ${ dateStr }\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"PO-Revision-Date: 2026-MO-DA HO:MI+ZONE\\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"
"Language-Team: LANGUAGE <LL@li.org>\\n"
"Language: en\\n"
"X-Domain: ${ slug }\\n"

`;

	for ( const [ msgid, references ] of stringMap.entries() ) {
		const refLine = references
			.map( ( r ) => `#: ${ r.file }:${ r.line }` )
			.join( '\n' );
		const escapedMsgid = msgid.replace( /"/g, '\\"' ).replace( /\n/g, '\\n' );
		pot += `${ refLine }\nmsgid "${ escapedMsgid }"\nmsgstr ""\n\n`;
	}

	return pot;
}

/**
 * Formats strings into PO catalog format for en_US.
 *
 * @param {string}                                                    name
 * @param {string}                                                    slug
 * @param {Map<string, Array<{file: string, line: number}>>} stringMap
 * @return {string} PO content
 */
function generatePoContent( name, slug, stringMap ) {
	const dateStr = new Date()
		.toISOString()
		.replace( 'T', ' ' )
		.replace( /\..+/, '+0000' );

	let po = `# English translations for ${ name }
# Copyright (C) 2026 ${ name }
msgid ""
msgstr ""
"Project-Id-Version: ${ name }\\n"
"Report-Msgid-Bugs-To: \\n"
"POT-Creation-Date: ${ dateStr }\\n"
"PO-Revision-Date: ${ dateStr }\\n"
"Last-Translator: \\n"
"Language-Team: English\\n"
"Language: en_US\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\\n"
"X-Domain: ${ slug }\\n"

`;

	for ( const [ msgid, references ] of stringMap.entries() ) {
		const refLine = references
			.map( ( r ) => `#: ${ r.file }:${ r.line }` )
			.join( '\n' );
		const escaped = msgid.replace( /"/g, '\\"' ).replace( /\n/g, '\\n' );
		po += `${ refLine }\nmsgid "${ escaped }"\nmsgstr "${ escaped }"\n\n`;
	}

	return po;
}

/**
 * Generates POT, PO, and MO files.
 *
 * @param {Object} options      Options
 * @param {string} options.root Root directory
 * @param {string} options.slug Slug / textdomain
 * @param {string} options.name Plugin display name
 * @return {Promise<{potPath: string, poPath: string, moPath: string, totalStrings: number}>} Summary
 */
export async function makePot( { root = process.cwd(), slug, name } = {} ) {
	const detected = await detectMetadata( root );
	const targetSlug = slug || detected.slug;
	const targetName = name || detected.name;

	const allFiles = await collectFiles( root );
	const stringMap = new Map();

	for ( const filePath of allFiles ) {
		const rel = relative( root, filePath ).replace( /\\/g, '/' );
		const content = await readFile( filePath, 'utf8' );
		const extracted = extractStrings( content, rel );

		for ( const item of extracted ) {
			if ( ! stringMap.has( item.msgid ) ) {
				stringMap.set( item.msgid, [] );
			}
			stringMap.get( item.msgid ).push( {
				file: item.file,
				line: item.line,
			} );
		}
	}

	const languagesDir = join( root, 'languages' );
	await mkdir( languagesDir, { recursive: true } );

	const potContent = generatePotContent( targetName, targetSlug, stringMap );
	const potPath = join( languagesDir, `${ targetSlug }.pot` );
	await writeFile( potPath, potContent, 'utf8' );

	const poContent = generatePoContent( targetName, targetSlug, stringMap );
	const poPath = join( languagesDir, `${ targetSlug }-en_US.po` );
	await writeFile( poPath, poContent, 'utf8' );

	// Build MO
	const sortedMsgids = Array.from( stringMap.keys() ).sort();
	const dateStr = new Date()
		.toISOString()
		.replace( 'T', ' ' )
		.replace( /\..+/, '+0000' );
	const headerTrans =
		`Project-Id-Version: ${ targetName }\n` +
		`Report-Msgid-Bugs-To: \n` +
		`POT-Creation-Date: ${ dateStr }\n` +
		`PO-Revision-Date: ${ dateStr }\n` +
		`Last-Translator: \n` +
		`Language-Team: English\n` +
		`Language: en_US\n` +
		`MIME-Version: 1.0\n` +
		`Content-Type: text/plain; charset=UTF-8\n` +
		`Content-Transfer-Encoding: 8bit\n` +
		`Plural-Forms: nplurals=2; plural=(n != 1);\n` +
		`X-Domain: ${ targetSlug }\n`;

	const moMessages = [
		{ msgid: '', msgstr: headerTrans },
		...sortedMsgids.map( ( id ) => ( { msgid: id, msgstr: id } ) ),
	];

	const moBuffer = buildMoBuffer( moMessages );
	const moPath = join( languagesDir, `${ targetSlug }-en_US.mo` );
	await writeFile( moPath, moBuffer );

	return {
		potPath,
		poPath,
		moPath,
		totalStrings: stringMap.size,
	};
}

// CLI execution
if (
	process.argv[ 1 ] &&
	resolve( process.argv[ 1 ] ) ===
		resolve( new URL( import.meta.url ).pathname )
) {
	const { values } = parseArgs( {
		options: {
			root: { type: 'string', default: process.cwd() },
			slug: { type: 'string' },
			name: { type: 'string' },
			help: { type: 'boolean', short: 'h', default: false },
		},
		strict: true,
	} );

	if ( values.help ) {
		console.log( HELP.trim() );
		process.exit( 0 );
	}

	makePot( {
		root: resolve( values.root ),
		slug: values.slug,
		name: values.name,
	} )
		.then( ( result ) => {
			console.log(
				`\n✅ Extracted ${ result.totalStrings } unique translation strings.`
			);
			console.log( `   POT template: ${ result.potPath }` );
			console.log( `   PO catalog:   ${ result.poPath }` );
			console.log( `   MO binary:    ${ result.moPath }\n` );
		} )
		.catch( ( err ) => {
			console.error( `Error: ${ err.message }` );
			process.exit( 1 );
		} );
}
