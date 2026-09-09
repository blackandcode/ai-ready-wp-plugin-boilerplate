#!/usr/bin/env node

/**
 * detect-project.mjs
 *
 * Deterministically analyzes a target directory to identify:
 * - WordPress plugin structure and main plugin file
 * - PHP namespaces, Composer dependencies, PHP version constraints
 * - Node tooling and @wordpress/scripts
 * - Testing suites (PHPUnit, Playwright, Bruno, Jest)
 * - WordPress architectural characteristics (Custom tables, Action Scheduler, WP-Cron, Gutenberg, WooCommerce)
 * - Existing ADR directory and conventions
 *
 * Output: Structured JSON to stdout (or human-readable summary).
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
			args.targetDir = argv[ ++i ] || '.';
		} else if ( ! arg.startsWith( '-' ) ) {
			args.targetDir = arg;
		}
	}

	return args;
}

function printHelp() {
	process.stdout
		.write( `Usage: node detect-project.mjs [options] [target-directory]

Options:
  --dir, -d <path>   Target repository directory (default: current directory)
  --json             Output results as formatted JSON
  --help, -h         Show this help message
` );
}

function readFileSafe( filePath, maxBytes = 128 * 1024 ) {
	try {
		const fd = fs.openSync( filePath, 'r' );
		const buffer = Buffer.alloc( maxBytes );
		const bytesRead = fs.readSync( fd, buffer, 0, maxBytes, 0 );
		fs.closeSync( fd );
		return buffer.subarray( 0, bytesRead ).toString( 'utf8' );
	} catch {
		return null;
	}
}

function findFiles( dir, filterFn, maxDepth = 4, currentDepth = 0 ) {
	if ( currentDepth > maxDepth || ! fs.existsSync( dir ) ) {
		return [];
	}
	const results = [];
	try {
		const entries = fs.readdirSync( dir, { withFileTypes: true } );
		for ( const entry of entries ) {
			if (
				[
					'node_modules',
					'vendor',
					'.git',
					'build',
					'dist',
					'coverage',
				].includes( entry.name )
			) {
				continue;
			}
			const fullPath = path.join( dir, entry.name );
			if ( entry.isDirectory() ) {
				results.push(
					...findFiles(
						fullPath,
						filterFn,
						maxDepth,
						currentDepth + 1
					)
				);
			} else if ( entry.isFile() && filterFn( entry.name, fullPath ) ) {
				results.push( fullPath );
			}
		}
	} catch {
		// Ignore unreadable directories
	}
	return results;
}

function detectPluginHeader( content ) {
	if ( ! content ) {
		return null;
	}
	const match = content.match(
		/\/\*[\s\S]*?Plugin Name:\s*([^\r\n]+)[\s\S]*?\*\//i
	);
	if ( ! match ) {
		return null;
	}

	const getHeaderField = ( field ) => {
		const m = content.match(
			new RegExp( `${ field }:\\s*([^\\r\\n]+)`, 'i' )
		);
		return m ? m[ 1 ].trim() : null;
	};

	return {
		name: match[ 1 ].trim(),
		version: getHeaderField( 'Version' ),
		description: getHeaderField( 'Description' ),
		author: getHeaderField( 'Author' ),
		textDomain: getHeaderField( 'Text Domain' ),
		domainPath: getHeaderField( 'Domain Path' ),
		requiresAtLeast: getHeaderField( 'Requires at least' ),
		requiresPhp: getHeaderField( 'Requires PHP' ),
	};
}

function detectWordPressPlugin( targetDir ) {
	// Scan for PHP files with Plugin Name in root or 1 level down
	const phpFiles = findFiles(
		targetDir,
		( name ) => name.endsWith( '.php' ),
		1
	);
	let mainPlugin = null;

	for ( const phpFile of phpFiles ) {
		const content = readFileSafe( phpFile, 32 * 1024 );
		const header = detectPluginHeader( content );
		if ( header ) {
			mainPlugin = {
				filePath: toPosix( path.relative( targetDir, phpFile ) ),
				...header,
			};
			break;
		}
	}

	return mainPlugin;
}

function analyzeComposer( targetDir ) {
	const composerPath = path.join( targetDir, 'composer.json' );
	if ( ! fs.existsSync( composerPath ) ) {
		return null;
	}

	try {
		const raw = fs.readFileSync( composerPath, 'utf8' );
		const json = JSON.parse( raw );
		return {
			name: json.name || null,
			type: json.type || null,
			phpConstraint: json.require?.php || null,
			autoloadPsr4: json.autoload?.[ 'psr-4' ] || null,
			hasPhpstan: Boolean(
				json[ 'require-dev' ]?.[ 'phpstan/phpstan' ] ||
					json[ 'require-dev' ]?.[ 'szepeviktor/phpstan-wordpress' ]
			),
			hasPhpcs: Boolean(
				json[ 'require-dev' ]?.[ 'squizlabs/php_codesniffer' ] ||
					json[ 'require-dev' ]?.[ 'wp-coding-standards/wpcs' ]
			),
			hasPhpunit: Boolean( json[ 'require-dev' ]?.[ 'phpunit/phpunit' ] ),
			dependencies: Object.keys( json.require || {} ).filter(
				( k ) => k !== 'php'
			),
			devDependencies: Object.keys( json[ 'require-dev' ] || {} ),
		};
	} catch {
		return { error: 'Failed to parse composer.json' };
	}
}

function analyzePackageJson( targetDir ) {
	const pkgPath = path.join( targetDir, 'package.json' );
	if ( ! fs.existsSync( pkgPath ) ) {
		return null;
	}

	try {
		const raw = fs.readFileSync( pkgPath, 'utf8' );
		const json = JSON.parse( raw );
		return {
			name: json.name || null,
			version: json.version || null,
			hasWpScripts: Boolean(
				json.dependencies?.[ '@wordpress/scripts' ] ||
					json.devDependencies?.[ '@wordpress/scripts' ]
			),
			hasPlaywright: Boolean(
				json.dependencies?.[ '@playwright/test' ] ||
					json.devDependencies?.[ '@playwright/test' ]
			),
			scripts: Object.keys( json.scripts || {} ),
		};
	} catch {
		return { error: 'Failed to parse package.json' };
	}
}

function detectArchitecturalCharacteristics( targetDir ) {
	const characteristics = {
		hasCustomTables: false,
		hasActionScheduler: false,
		hasWpCron: false,
		hasRestApi: false,
		hasGutenbergBlocks: false,
		hasWooCommerce: false,
		hasCustomPostTypes: false,
		hasDependencyInjection: false,
	};

	const phpFiles = findFiles(
		targetDir,
		( name ) => name.endsWith( '.php' ),
		4
	);
	for ( const file of phpFiles ) {
		const content = readFileSafe( file, 64 * 1024 );
		if ( ! content ) {
			continue;
		}

		if (
			! characteristics.hasCustomTables &&
			( content.includes( 'dbDelta(' ) ||
				content.includes( 'CREATE TABLE' ) )
		) {
			characteristics.hasCustomTables = true;
		}
		if (
			! characteristics.hasActionScheduler &&
			( content.includes( 'as_schedule_' ) ||
				content.includes( 'as_enqueue_' ) ||
				content.includes( 'ActionScheduler' ) )
		) {
			characteristics.hasActionScheduler = true;
		}
		if (
			! characteristics.hasWpCron &&
			( content.includes( 'wp_schedule_event' ) ||
				content.includes( 'wp_next_scheduled' ) )
		) {
			characteristics.hasWpCron = true;
		}
		if (
			! characteristics.hasRestApi &&
			( content.includes( 'register_rest_route' ) ||
				content.includes( 'WP_REST_Controller' ) )
		) {
			characteristics.hasRestApi = true;
		}
		if (
			! characteristics.hasWooCommerce &&
			( content.includes( 'woocommerce_' ) ||
				content.includes( 'WC_' ) ||
				content.includes( 'Automattic\\WooCommerce' ) )
		) {
			characteristics.hasWooCommerce = true;
		}
		if (
			! characteristics.hasCustomPostTypes &&
			( content.includes( 'register_post_type' ) ||
				content.includes( 'register_taxonomy' ) )
		) {
			characteristics.hasCustomPostTypes = true;
		}
		if (
			! characteristics.hasDependencyInjection &&
			( content.includes( 'Container' ) ||
				content.includes( 'ServiceProvider' ) ||
				content.includes( 'DependencyInjection' ) )
		) {
			characteristics.hasDependencyInjection = true;
		}
	}

	// Check for blocks
	const blockJsonFiles = findFiles(
		targetDir,
		( name ) => name === 'block.json',
		3
	);
	if ( blockJsonFiles.length > 0 ) {
		characteristics.hasGutenbergBlocks = true;
	}

	return characteristics;
}

function detectExistingAdrs( targetDir ) {
	const candidateDirs = [
		'docs/adr',
		'docs/decisions',
		'adr',
		'decisions',
		'.adr',
	];
	let foundDir = null;
	let adrFiles = [];

	for ( const cand of candidateDirs ) {
		const full = path.join( targetDir, cand );
		if ( fs.existsSync( full ) && fs.statSync( full ).isDirectory() ) {
			foundDir = cand;
			adrFiles = fs
				.readdirSync( full )
				.filter(
					( f ) =>
						f.endsWith( '.md' ) &&
						! f.toLowerCase().includes( 'readme' )
				);
			break;
		}
	}

	return {
		hasAdrs: foundDir !== null && adrFiles.length > 0,
		adrDirectory: foundDir,
		adrCount: adrFiles.length,
		sampleFiles: adrFiles.slice( 0, 5 ),
	};
}

export function detectProject( targetDir = '.' ) {
	const absRoot = path.resolve( targetDir );
	const wpPlugin = detectWordPressPlugin( absRoot );
	const composer = analyzeComposer( absRoot );
	const packageJson = analyzePackageJson( absRoot );
	const architecture = detectArchitecturalCharacteristics( absRoot );
	const adrs = detectExistingAdrs( absRoot );

	return {
		rootPath: toPosix( absRoot ),
		isWordPressPlugin: Boolean( wpPlugin ),
		pluginHeader: wpPlugin,
		composer,
		packageJson,
		architecture,
		adrs,
		timestamp: new Date().toISOString(),
	};
}

function main() {
	const args = parseArgs( process.argv );
	if ( args.help ) {
		printHelp();
		process.exit( 0 );
	}

	const result = detectProject( args.targetDir );

	if ( args.json ) {
		process.stdout.write( JSON.stringify( result, null, 2 ) + '\n' );
	} else {
		process.stdout.write( `=== WordPress Project Detection Report ===\n` );
		process.stdout.write( `Root: ${ result.rootPath }\n` );
		process.stdout.write(
			`WordPress Plugin: ${ result.isWordPressPlugin ? 'YES' : 'NO' }\n`
		);
		if ( result.pluginHeader ) {
			process.stdout.write( `  Name: ${ result.pluginHeader.name }\n` );
			process.stdout.write(
				`  Entry File: ${ result.pluginHeader.filePath }\n`
			);
			process.stdout.write(
				`  Version: ${ result.pluginHeader.version || 'unknown' }\n`
			);
			process.stdout.write(
				`  Requires PHP: ${
					result.pluginHeader.requiresPhp || 'unknown'
				}\n`
			);
			process.stdout.write(
				`  Requires WP: ${
					result.pluginHeader.requiresAtLeast || 'unknown'
				}\n`
			);
		}
		if ( result.composer ) {
			process.stdout.write(
				`Composer: YES (PHP ${
					result.composer.phpConstraint || 'unspecified'
				})\n`
			);
			process.stdout.write(
				`  Dependencies: ${
					result.composer.dependencies.join( ', ' ) || 'none'
				}\n`
			);
		}
		process.stdout.write( `Architecture Signals:\n` );
		for ( const [ key, val ] of Object.entries( result.architecture ) ) {
			if ( val ) {
				process.stdout.write( `  - ${ key }: detected\n` );
			}
		}
		process.stdout.write( `Existing ADRs:\n` );
		process.stdout.write(
			`  Has ADRs: ${ result.adrs.hasAdrs ? 'YES' : 'NO' }\n`
		);
		if ( result.adrs.adrDirectory ) {
			process.stdout.write(
				`  Directory: ${ result.adrs.adrDirectory } (${ result.adrs.adrCount } records)\n`
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
