#!/usr/bin/env node

/**
 * validate-adr.mjs
 *
 * Deterministically validates Architecture Decision Records for structural,
 * lifecycle, semantic, and referential integrity.
 *
 * Checks:
 * 1. Metadata presence: Title, valid Status, valid Date (YYYY-MM-DD), Deciders.
 * 2. Filename consistency: Number in filename matches ADR header number.
 * 3. Required sections: Context, Decision, Consequences, Architectural Constraints, Verification, Reconsider When.
 * 4. Placeholder detection: Flags unedited {{PLACEHOLDERS}} and leftover instructions.
 * 5. Supersession integrity:
 *    - 'superseded' ADRs must specify 'Superseded by'
 *    - Referenced ADR files must exist on disk (no broken links).
 * 6. Index consistency: Verifies index table matches files on disk and their statuses.
 *
 * Zero external dependencies. Exit code 0 on pass, 1 on errors.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { detectAdrConventions } from './detect-adr-conventions.mjs';

function toPosix( p ) {
	return p.split( path.sep ).join( '/' );
}

const VALID_STATUSES = [
	'proposed',
	'accepted',
	'rejected',
	'deprecated',
	'superseded',
];

const REQUIRED_SECTIONS = [
	{ name: 'Context', regex: /##\s+Context/i },
	{ name: 'Decision', regex: /##\s+Decision/i },
	{ name: 'Consequences', regex: /##\s+Consequences/i },
	{
		name: 'Architectural Constraints',
		regex: /##\s+Architectural Constraints/i,
	},
	{ name: 'Verification & Fitness Functions', regex: /##\s+Verification/i },
	{ name: 'Reconsider When', regex: /##\s+Reconsider When/i },
];

function parseArgs( argv ) {
	const args = {
		targetDir: '.',
		dir: null,
		file: null,
		strict: false,
		json: false,
		help: false,
	};

	for ( let i = 2; i < argv.length; i++ ) {
		const arg = argv[ i ];
		if ( arg === '--help' || arg === '-h' ) {
			args.help = true;
		} else if ( arg === '--json' ) {
			args.json = true;
		} else if ( arg === '--strict' ) {
			args.strict = true;
		} else if ( arg === '--file' || arg === '-f' ) {
			args.file = argv[ ++i ];
		} else if ( arg === '--dir' || arg === '-d' ) {
			args.dir = argv[ ++i ];
		} else if ( ! arg.startsWith( '-' ) ) {
			args.targetDir = arg;
		}
	}

	return args;
}

function printHelp() {
	process.stdout
		.write( `Usage: node validate-adr.mjs [options] [target-directory]

Options:
  --file, -f <path>   Validate a single ADR file
  --dir, -d <path>    ADR directory to validate (default: auto-detected)
  --strict            Treat warnings (placeholders, unedited notes) as fatal errors
  --json              Output validation results as formatted JSON
  --help, -h          Show this help message
` );
}

function validateSingleAdr( filePath, absAdrDir, options = {} ) {
	const errors = [];
	const warnings = [];
	const fileName = path.basename( filePath );

	if ( ! fs.existsSync( filePath ) ) {
		return {
			fileName,
			filePath,
			valid: false,
			errors: [ `File does not exist: ${ filePath }` ],
			warnings: [],
		};
	}

	const content = fs.readFileSync( filePath, 'utf8' );

	// 1. Header and Title check
	const titleMatch = content.match( /^#\s+(?:ADR-?(\d+)[:\s]+)?(.+)$/m );
	if ( ! titleMatch ) {
		errors.push(
			'Missing top-level level 1 heading (e.g. # ADR-0001: Decision Title).'
		);
	} else {
		const headerNumStr = titleMatch[ 1 ];
		const fileNumMatch = fileName.match( /^(\d+)-/ );

		if ( fileNumMatch && headerNumStr ) {
			if (
				parseInt( fileNumMatch[ 1 ], 10 ) !==
				parseInt( headerNumStr, 10 )
			) {
				errors.push(
					`Header sequence number (ADR-${ headerNumStr }) does not match filename prefix (${ fileNumMatch[ 1 ] }).`
				);
			}
		}
	}

	// 2. Status check
	const statusMatch = content.match(
		/(?:-\s+\*\*Status:\*\*|\bStatus:)\s*([a-zA-Z]+)/i
	);
	let status = null;
	if ( ! statusMatch ) {
		errors.push( 'Missing Status metadata (e.g. - **Status:** accepted).' );
	} else {
		status = statusMatch[ 1 ].toLowerCase().trim();
		if ( ! VALID_STATUSES.includes( status ) ) {
			errors.push(
				`Invalid status '${ status }'. Must be one of: ${ VALID_STATUSES.join(
					', '
				) }.`
			);
		}
	}

	// 3. Date check
	const dateMatch = content.match(
		/(?:-\s+\*\*Date:\*\*|\bDate:)\s*(\d{4}-\d{2}-\d{2})/i
	);
	if ( ! dateMatch ) {
		errors.push(
			'Missing or invalid Date metadata (expected YYYY-MM-DD).'
		);
	}

	// 4. Required sections
	for ( const sec of REQUIRED_SECTIONS ) {
		if ( ! sec.regex.test( content ) ) {
			errors.push(
				`Missing required architectural section: '${ sec.name }'.`
			);
		}
	}

	// 5. Template placeholders
	const placeholderMatches = content.match( /\{\{[A-Z0-9_]+\}\}/g );
	if ( placeholderMatches ) {
		const unique = [ ...new Set( placeholderMatches ) ];
		const msg = `Unreplaced template placeholders found: ${ unique.join(
			', '
		) }`;
		if ( options.strict ) {
			errors.push( msg );
		} else {
			warnings.push( msg );
		}
	}

	// 6. Leftover template HTML comments
	if (
		content.includes( '<!-- Describe the technical' ) ||
		content.includes( '<!-- What is the problem' )
	) {
		const msg =
			'Template instructional comments have not been replaced with actual rationale.';
		if ( options.strict ) {
			errors.push( msg );
		} else {
			warnings.push( msg );
		}
	}

	// 7. Supersession integrity
	if ( status === 'superseded' ) {
		const supByMatch = content.match(
			/(?:-\s+\*\*Superseded by:\*\*|\bSuperseded by:\s*)([^\r\n]+)/i
		);
		const rawSupBy = supByMatch ? supByMatch[ 1 ] : '';
		const cleanSupBy = rawSupBy.replace( /<!--[\s\S]*?-->/g, '' ).trim();

		if (
			! cleanSupBy ||
			cleanSupBy.toLowerCase() === 'none' ||
			cleanSupBy === '—'
		) {
			errors.push(
				"ADR has status 'superseded' but 'Superseded by:' link is missing or set to None."
			);
		} else {
			// Check link target
			const fileLinkMatch = cleanSupBy.match( /\]\(([^)]+\.md)\)/ );
			if ( fileLinkMatch && absAdrDir ) {
				const targetPath = path.resolve(
					absAdrDir,
					fileLinkMatch[ 1 ]
				);
				if ( ! fs.existsSync( targetPath ) ) {
					errors.push(
						`Broken supersession link: target file '${ fileLinkMatch[ 1 ] }' does not exist.`
					);
				}
			}
		}
	}

	// Check 'Supersedes' link target if present
	const supMatch = content.match(
		/(?:-\s+\*\*Supersedes:\*\*|\bSupersedes:\s*)([^\r\n]+)/i
	);
	if ( supMatch ) {
		const rawSup = supMatch[ 1 ];
		const cleanSup = rawSup.replace( /<!--[\s\S]*?-->/g, '' ).trim();

		if (
			cleanSup &&
			cleanSup.toLowerCase() !== 'none' &&
			cleanSup !== '—'
		) {
			const fileLinkMatch = cleanSup.match( /\]\(([^)]+\.md)\)/ );
			if ( fileLinkMatch && absAdrDir ) {
				const targetPath = path.resolve(
					absAdrDir,
					fileLinkMatch[ 1 ]
				);
				if ( ! fs.existsSync( targetPath ) ) {
					errors.push(
						`Broken supersedes link: prior file '${ fileLinkMatch[ 1 ] }' does not exist.`
					);
				}
			}
		}
	}

	return {
		fileName,
		filePath: toPosix( filePath ),
		valid: errors.length === 0,
		status,
		errors,
		warnings,
	};
}

function validateIndexConsistency( absIndexFile, adrResults ) {
	const indexIssues = [];
	if ( ! fs.existsSync( absIndexFile ) ) {
		return indexIssues;
	}

	const content = fs.readFileSync( absIndexFile, 'utf8' );

	for ( const adr of adrResults ) {
		const baseName = path.basename( adr.filePath );
		if ( ! content.includes( baseName ) ) {
			indexIssues.push(
				`ADR file '${ baseName }' is missing from the index table in ${ path.basename(
					absIndexFile
				) }.`
			);
		} else if ( adr.status ) {
			// Check if status matches in row
			const capStatus =
				adr.status.charAt( 0 ).toUpperCase() + adr.status.slice( 1 );
			const rowPattern = new RegExp(
				`\\[ADR-[^\\]]+\\]\\(${ baseName }\\)[^\\n]*\\|\\s*([a-zA-Z]+)\\s*\\|`,
				'i'
			);
			const rowMatch = content.match( rowPattern );
			if ( rowMatch ) {
				const indexStatus = rowMatch[ 1 ].toLowerCase().trim();
				if ( indexStatus !== adr.status ) {
					indexIssues.push(
						`Status mismatch for '${ baseName }': file status is '${ adr.status }', but index table records '${ indexStatus }'.`
					);
				}
			}
		}
	}

	return indexIssues;
}

export function validateAdrs( targetDir = '.', options = {} ) {
	const absRoot = path.resolve( targetDir );

	if ( options.file ) {
		const absFile = path.resolve( absRoot, options.file );
		const absAdrDir = path.dirname( absFile );
		const res = validateSingleAdr( absFile, absAdrDir, options );
		return {
			valid: res.valid,
			totalChecked: 1,
			passed: res.valid ? 1 : 0,
			failed: res.valid ? 0 : 1,
			files: [ res ],
			indexIssues: [],
		};
	}

	const conventions = detectAdrConventions( absRoot, options.dir );
	if ( ! conventions.hasAdrDirectory ) {
		return {
			valid: false,
			totalChecked: 0,
			passed: 0,
			failed: 0,
			error: 'No ADR directory found to validate. Run bootstrap-adrs.mjs first.',
			files: [],
			indexIssues: [],
		};
	}

	const absAdrDir = path.join( absRoot, conventions.adrDirectory );
	const rawEntries = fs.readdirSync( absAdrDir, { withFileTypes: true } );

	const fileResults = [];
	for ( const entry of rawEntries ) {
		if ( ! entry.isFile() || ! entry.name.endsWith( '.md' ) ) {
			continue;
		}
		if (
			conventions.indexFile &&
			entry.name.toLowerCase() ===
				path.basename( conventions.indexFile ).toLowerCase()
		) {
			continue;
		}
		const full = path.join( absAdrDir, entry.name );
		fileResults.push( validateSingleAdr( full, absAdrDir, options ) );
	}

	let indexIssues = [];
	if ( conventions.indexFile ) {
		const absIndex = path.join( absRoot, conventions.indexFile );
		indexIssues = validateIndexConsistency( absIndex, fileResults );
	}

	const allPassed =
		fileResults.every( ( r ) => r.valid ) && indexIssues.length === 0;

	return {
		valid: allPassed,
		totalChecked: fileResults.length,
		passed: fileResults.filter( ( r ) => r.valid ).length,
		failed: fileResults.filter( ( r ) => ! r.valid ).length,
		files: fileResults,
		indexIssues,
	};
}

function main() {
	const args = parseArgs( process.argv );
	if ( args.help ) {
		printHelp();
		process.exit( 0 );
	}

	const result = validateAdrs( args.targetDir, {
		file: args.file,
		dir: args.dir,
		strict: args.strict,
	} );

	if ( args.json ) {
		process.stdout.write( JSON.stringify( result, null, 2 ) + '\n' );
	} else {
		process.stdout.write( `=== ADR Validation Report ===\n` );
		if ( result.error ) {
			process.stderr.write( `ERROR: ${ result.error }\n` );
			process.exit( 1 );
		}

		process.stdout.write(
			`Total records checked: ${ result.totalChecked } (Passed: ${ result.passed }, Failed: ${ result.failed })\n\n`
		);

		for ( const f of result.files ) {
			const icon = f.valid ? '✅' : '❌';
			process.stdout.write(
				`${ icon } ${ f.fileName } (${ f.status || 'unknown' })\n`
			);
			for ( const err of f.errors ) {
				process.stdout.write( `   - ERROR: ${ err }\n` );
			}
			for ( const warn of f.warnings ) {
				process.stdout.write( `   - WARN: ${ warn }\n` );
			}
		}

		if ( result.indexIssues.length > 0 ) {
			process.stdout.write( `\n❌ Index Consistency Errors:\n` );
			for ( const issue of result.indexIssues ) {
				process.stdout.write( `   - ${ issue }\n` );
			}
		}

		process.stdout.write(
			`\nOverall Result: ${ result.valid ? 'PASS' : 'FAIL' }\n`
		);
	}

	if ( ! result.valid ) {
		process.exit( 1 );
	}
}

if (
	process.argv[ 1 ] &&
	path.resolve( process.argv[ 1 ] ) ===
		path.resolve( new URL( import.meta.url ).pathname )
) {
	main();
}
