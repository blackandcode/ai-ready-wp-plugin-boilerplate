#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

const HELP = `
Usage:
  node tools/release/extract-release-notes.mjs [version] [options]
  npm run release:notes -- [version] [options]

Extracts markdown release notes for a specified version from CHANGELOG.md.

Arguments:
  [version]                    Target semantic version (e.g. 1.1.1).

Options:
  -v, --version <X.Y.Z>        Target version (flag form).
  -f, --file <path>            Path to CHANGELOG.md. Default: CHANGELOG.md.
  -o, --output <path>          Write notes to specified file path instead of stdout.
  --json                       Output structured JSON format.
  -h, --help                   Show this help message.
`;

/**
 * Extracts release notes for a target version from changelog content.
 *
 * @param {string} changelogSource Raw CHANGELOG.md content
 * @param {string} targetVersion   Semantic version string (e.g. "1.1.1")
 * @return {{ version: string, date: string, notes: string }} Extracted notes
 */
export function extractReleaseNotes( changelogSource, targetVersion ) {
	if ( ! targetVersion ) {
		throw new Error(
			'Target version is required to extract release notes.'
		);
	}

	const versionPattern = new RegExp(
		`##\\s*\\[${ targetVersion.replace(
			/[.*+?^${}()|[\\]\\]/g,
			'\\$&'
		) }\\](?:\\s*-\\s*([0-9]{4}-[0-9]{2}-[0-9]{2}))?`,
		'm'
	);

	const match = versionPattern.exec( changelogSource );
	if ( ! match ) {
		throw new Error(
			`Version [${ targetVersion }] not found in CHANGELOG.md.`
		);
	}

	const date = match[ 1 ] || '';
	const startIndex = match.index + match[ 0 ].length;
	const remainder = changelogSource.slice( startIndex );

	// Stop at next version heading "## ["
	const nextReleaseMatch = remainder.match( /\n##\s*\[/ );
	const endIndex = nextReleaseMatch
		? startIndex + nextReleaseMatch.index
		: changelogSource.length;

	const notes = changelogSource.slice( startIndex, endIndex ).trim();

	if ( ! notes ) {
		throw new Error(
			`Release entry for [${ targetVersion }] is empty in CHANGELOG.md.`
		);
	}

	return {
		version: targetVersion,
		date,
		notes,
	};
}

// CLI execution
if (
	process.argv[ 1 ] &&
	resolve( process.argv[ 1 ] ) ===
		resolve( new URL( import.meta.url ).pathname )
) {
	const { values, positionals } = parseArgs( {
		options: {
			version: { type: 'string', short: 'v' },
			file: { type: 'string', short: 'f', default: 'CHANGELOG.md' },
			output: { type: 'string', short: 'o' },
			json: { type: 'boolean', default: false },
			help: { type: 'boolean', short: 'h', default: false },
		},
		allowPositionals: true,
		strict: true,
	} );

	if ( values.help ) {
		console.log( HELP.trim() );
		process.exit( 0 );
	}

	const version = values.version || positionals[ 0 ];

	if ( ! version ) {
		console.error(
			'Error: Target version is required. Provide as positional argument or --version <X.Y.Z>.'
		);
		console.error( 'Run with --help for usage details.' );
		process.exit( 1 );
	}

	try {
		const filePath = resolve( process.cwd(), values.file );
		const source = await readFile( filePath, 'utf8' );
		const result = extractReleaseNotes( source, version );

		if ( values.output ) {
			const outputPath = resolve( process.cwd(), values.output );
			await writeFile( outputPath, result.notes + '\n', 'utf8' );
			console.log(
				`Release notes for v${ result.version } written to ${ values.output }`
			);
		} else if ( values.json ) {
			console.log( JSON.stringify( result, null, 2 ) );
		} else {
			console.log( result.notes );
		}
	} catch ( error ) {
		console.error( `Error: ${ error.message }` );
		process.exit( 1 );
	}
}
