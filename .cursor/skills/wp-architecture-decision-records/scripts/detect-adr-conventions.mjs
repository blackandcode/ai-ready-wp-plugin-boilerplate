#!/usr/bin/env node

/**
 * detect-adr-conventions.mjs
 *
 * Scans a target repository to detect established ADR conventions:
 * - ADR storage directory (docs/adr, docs/decisions, adr, decisions, etc.)
 * - Index/registry file (README.md, index.md)
 * - Numbering strategy (0001- vs 001- vs unnumbered) and pad length
 * - Highest existing sequence number and next available number
 * - Status convention (header list vs YAML frontmatter)
 * - Template style currently predominant (simple vs madr)
 * - Status breakdown (proposed, accepted, superseded, rejected, deprecated)
 *
 * Zero external dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function toPosix( p ) {
	return p.split( path.sep ).join( '/' );
}

function parseArgs( argv ) {
	const args = {
		targetDir: '.',
		customAdrDir: null,
		json: false,
		help: false,
	};

	for ( let i = 2; i < argv.length; i++ ) {
		const arg = argv[ i ];
		if ( arg === '--help' || arg === '-h' ) {
			args.help = true;
		} else if ( arg === '--json' ) {
			args.json = true;
		} else if ( arg === '--dir' || arg === '-d' ) {
			args.customAdrDir = argv[ ++i ];
		} else if ( ! arg.startsWith( '-' ) ) {
			args.targetDir = arg;
		}
	}

	return args;
}

function printHelp() {
	process.stdout
		.write( `Usage: node detect-adr-conventions.mjs [options] [target-directory]

Options:
  --dir, -d <path>   Explicit ADR directory to inspect (e.g., docs/adr)
  --json             Output results as formatted JSON
  --help, -h         Show this help message
` );
}

function findAdrDirectory( repoRoot, customDir = null ) {
	if ( customDir ) {
		const full = path.resolve( repoRoot, customDir );
		if ( fs.existsSync( full ) && fs.statSync( full ).isDirectory() ) {
			return toPosix( path.relative( repoRoot, full ) ) || '.';
		}
		return null;
	}

	const candidates = [
		'docs/adr',
		'docs/decisions',
		'adr',
		'decisions',
		'docs/architecture/decisions',
		'.adr',
	];

	for ( const cand of candidates ) {
		const full = path.join( repoRoot, cand );
		if ( fs.existsSync( full ) && fs.statSync( full ).isDirectory() ) {
			return cand;
		}
	}

	return null;
}

function findIndexFile( absAdrDir ) {
	const candidates = [ 'README.md', 'readme.md', 'index.md', 'INDEX.md' ];
	for ( const cand of candidates ) {
		const full = path.join( absAdrDir, cand );
		if ( fs.existsSync( full ) && fs.statSync( full ).isFile() ) {
			return cand;
		}
	}
	return null;
}

function parseAdrMetadata( content ) {
	let status = 'unknown';
	let title = 'Untitled';
	let date = null;
	let supersedes = null;
	let supersededBy = null;

	// Title: # ADR-XXXX: Title OR # Title
	const titleMatch = content.match( /^#\s+(?:ADR-?\d+[:\s]+)?(.+)$/m );
	if ( titleMatch ) {
		title = titleMatch[ 1 ].trim();
	}

	// Status
	const statusMatch = content.match(
		/(?:-\s+\*\*Status:\*\*|\bStatus:)\s*([a-zA-Z]+)/i
	);
	if ( statusMatch ) {
		status = statusMatch[ 1 ].toLowerCase().trim();
	}

	// Date
	const dateMatch = content.match(
		/(?:-\s+\*\*Date:\*\*|\bDate:)\s*(\d{4}-\d{2}-\d{2})/i
	);
	if ( dateMatch ) {
		date = dateMatch[ 1 ].trim();
	}

	// Supersedes
	const supersedesMatch = content.match( /Supersedes:\s*([^\r\n]+)/i );
	if ( supersedesMatch ) {
		supersedes = supersedesMatch[ 1 ].trim();
	}

	// Superseded by
	const supersededByMatch = content.match( /Superseded by:\s*([^\r\n]+)/i );
	if ( supersededByMatch ) {
		supersededBy = supersededByMatch[ 1 ].trim();
	}

	// Template heuristic
	const hasOptions =
		content.includes( '## Considered Options' ) ||
		content.includes( '## Decision Drivers' );
	const templateStyle = hasOptions ? 'madr' : 'simple';

	return {
		title,
		status,
		date,
		supersedes,
		supersededBy,
		templateStyle,
	};
}

export function detectAdrConventions( targetDir = '.', customDir = null ) {
	const absRoot = path.resolve( targetDir );
	const relAdrDir = findAdrDirectory( absRoot, customDir );

	if ( ! relAdrDir ) {
		return {
			hasAdrDirectory: false,
			recommendedDirectory: 'docs/adr',
			recommendedNumbering: 'numeric-4',
			recommendedPadLength: 4,
			nextNumber: 1,
			nextFormattedNumber: '0001',
			indexFile: null,
			files: [],
			stats: {
				total: 0,
				proposed: 0,
				accepted: 0,
				rejected: 0,
				deprecated: 0,
				superseded: 0,
				unknown: 0,
			},
		};
	}

	const absAdrDir = path.join( absRoot, relAdrDir );
	const indexFile = findIndexFile( absAdrDir );
	const rawEntries = fs.readdirSync( absAdrDir, { withFileTypes: true } );

	const adrFiles = [];
	const numbers = [];
	let detectedPadLength = 4;
	let numberingStyle = 'numeric-4'; // numeric-3 | numeric-4 | slug-only | unnumbered

	for ( const entry of rawEntries ) {
		if ( ! entry.isFile() || ! entry.name.endsWith( '.md' ) ) {
			continue;
		}
		if (
			indexFile &&
			entry.name.toLowerCase() === indexFile.toLowerCase()
		) {
			continue;
		}

		const numMatch = entry.name.match( /^(\d+)-/ );
		if ( numMatch ) {
			const numStr = numMatch[ 1 ];
			const parsedNum = parseInt( numStr, 10 );
			numbers.push( parsedNum );
			if ( numStr.length === 3 ) {
				detectedPadLength = 3;
			} else if ( numStr.length === 4 ) {
				detectedPadLength = 4;
			}
		}

		const content = fs.readFileSync(
			path.join( absAdrDir, entry.name ),
			'utf8'
		);
		const meta = parseAdrMetadata( content );

		adrFiles.push( {
			fileName: entry.name,
			filePath: toPosix( path.join( relAdrDir, entry.name ) ),
			number: numMatch ? parseInt( numMatch[ 1 ], 10 ) : null,
			...meta,
		} );
	}

	if ( numbers.length > 0 ) {
		numberingStyle = detectedPadLength === 3 ? 'numeric-3' : 'numeric-4';
	} else if ( adrFiles.length > 0 ) {
		numberingStyle = 'slug-only';
	}

	const highestNumber = numbers.length > 0 ? Math.max( ...numbers ) : 0;
	const nextNumber = highestNumber + 1;
	const nextFormattedNumber = String( nextNumber ).padStart(
		detectedPadLength,
		'0'
	);

	const stats = {
		total: adrFiles.length,
		proposed: adrFiles.filter( ( f ) => f.status === 'proposed' ).length,
		accepted: adrFiles.filter( ( f ) => f.status === 'accepted' ).length,
		rejected: adrFiles.filter( ( f ) => f.status === 'rejected' ).length,
		deprecated: adrFiles.filter( ( f ) => f.status === 'deprecated' )
			.length,
		superseded: adrFiles.filter( ( f ) => f.status === 'superseded' )
			.length,
		unknown: adrFiles.filter(
			( f ) =>
				! [
					'proposed',
					'accepted',
					'rejected',
					'deprecated',
					'superseded',
				].includes( f.status )
		).length,
	};

	return {
		hasAdrDirectory: true,
		adrDirectory: relAdrDir,
		indexFile: indexFile
			? toPosix( path.join( relAdrDir, indexFile ) )
			: null,
		numberingStyle,
		detectedPadLength,
		highestNumber,
		nextNumber,
		nextFormattedNumber,
		stats,
		files: adrFiles.sort(
			( a, b ) => ( a.number || 0 ) - ( b.number || 0 )
		),
	};
}

function main() {
	const args = parseArgs( process.argv );
	if ( args.help ) {
		printHelp();
		process.exit( 0 );
	}

	const result = detectAdrConventions( args.targetDir, args.customAdrDir );

	if ( args.json ) {
		process.stdout.write( JSON.stringify( result, null, 2 ) + '\n' );
	} else {
		process.stdout.write( `=== ADR Conventions Detection Report ===\n` );
		process.stdout.write(
			`ADR Directory Exists: ${ result.hasAdrDirectory ? 'YES' : 'NO' }\n`
		);
		if ( result.hasAdrDirectory ) {
			process.stdout.write( `Directory: ${ result.adrDirectory }\n` );
			process.stdout.write(
				`Index File: ${ result.indexFile || 'none' }\n`
			);
			process.stdout.write(
				`Numbering Style: ${ result.numberingStyle } (padding: ${ result.detectedPadLength })\n`
			);
			process.stdout.write(
				`Highest Sequence: ${ result.highestNumber }\n`
			);
			process.stdout.write(
				`Next Sequence: ${ result.nextFormattedNumber } (${ result.nextNumber })\n`
			);
			process.stdout.write( `Total Records: ${ result.stats.total }\n` );
			process.stdout.write( `  Accepted: ${ result.stats.accepted }\n` );
			process.stdout.write( `  Proposed: ${ result.stats.proposed }\n` );
			process.stdout.write(
				`  Superseded: ${ result.stats.superseded }\n`
			);
			process.stdout.write(
				`  Deprecated: ${ result.stats.deprecated }\n`
			);
			process.stdout.write( `  Rejected: ${ result.stats.rejected }\n` );
		} else {
			process.stdout.write(
				`Recommended Directory: ${ result.recommendedDirectory }\n`
			);
			process.stdout.write(
				`Recommended Next Sequence: ${ result.nextFormattedNumber }\n`
			);
		}
	}
}

if (
	process.argv[ 1 ] &&
	path.resolve( process.argv[ 1 ] ) ===
		path.resolve( new URL( import.meta.url ).pathname )
) {
	main();
}
