#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { getPluginMetadata } from './build-package.mjs';
import { extractZip } from './lib/zip-utils.mjs';
import { findArchive } from './validate-package.mjs';

const HELP = `
Usage:
  node tools/release/smoke-test-package.mjs [archive] [options]
  npm run release:smoke -- [archive] [options]

Extracts a plugin distribution ZIP archive to an isolated sandbox and verifies
that the packaged plugin bootstraps cleanly in a standalone PHP runtime.

Arguments:
  [archive]             Path to the ZIP file. Defaults to latest in dist/.

Options:
  --archive, -a <path>  Explicit ZIP archive path.
  --root <path>         Project root directory. Default: current directory.
  --json                Output structured JSON format.
  -h, --help            Show this help message.
`;

/**
 * Executes standalone PHP bootstrap smoke test on an extracted distribution package.
 *
 * @param {string} archivePath             Path to the ZIP file.
 * @param {Object} [options]               Options.
 * @param {string} [options.root]          Project root directory.
 * @return {Promise<{ success: boolean, archive: string, slug: string, version?: string, output?: string, error?: string, exitCode?: number }>}
 */
export async function smokeTestPackage(
	archivePath,
	{ root = process.cwd() } = {}
) {
	const resolvedArchive = resolve( root, archivePath );
	if ( ! existsSync( resolvedArchive ) ) {
		throw new Error( `Archive does not exist: ${ resolvedArchive }` );
	}

	const meta = await getPluginMetadata( root );
	const tempDir = await mkdtemp( join( tmpdir(), 'airwp-smoke-' ) );

	try {
		await extractZip( resolvedArchive, tempDir );
		const pluginDir = join( tempDir, meta.slug );
		const autoloadPhp = join( pluginDir, 'vendor', 'autoload.php' );
		const mainPhp = join( pluginDir, meta.mainPhpFile );

		if ( ! existsSync( autoloadPhp ) ) {
			return {
				success: false,
				archive: resolvedArchive,
				slug: meta.slug,
				error: `Missing vendor/autoload.php in packaged directory ${ meta.slug }`,
			};
		}

		if ( ! existsSync( mainPhp ) ) {
			return {
				success: false,
				archive: resolvedArchive,
				slug: meta.slug,
				error: `Missing ${ meta.mainPhpFile } in packaged directory ${ meta.slug }`,
			};
		}

		const phpScript = `
define( "ABSPATH", __DIR__ . "/" );
if ( ! function_exists( "plugin_dir_path" ) ) { function plugin_dir_path( $f ) { return dirname( $f ) . "/"; } }
if ( ! function_exists( "plugin_dir_url" ) ) { function plugin_dir_url( $f ) { return "http://example.com/"; } }
if ( ! function_exists( "register_activation_hook" ) ) { function register_activation_hook( $f, $c ) {} }
if ( ! function_exists( "register_deactivation_hook" ) ) { function register_deactivation_hook( $f, $c ) {} }
if ( ! function_exists( "add_action" ) ) { function add_action( $t, $c ) {} }

require_once $argv[1];
require_once $argv[2];

\\AIReady\\WPPluginBoilerplate\\Framework\\Kernel\\Plugin::instance()->boot();
echo "Plugin bootstrap succeeded in standalone production environment\\n";
`;

		const phpResult = spawnSync(
			'php',
			[ '-r', phpScript, autoloadPhp, mainPhp ],
			{
				encoding: 'utf8',
				timeout: 15000,
			}
		);

		if ( phpResult.error ) {
			return {
				success: false,
				archive: resolvedArchive,
				slug: meta.slug,
				error: `PHP execution failed: ${ phpResult.error.message }`,
			};
		}

		if ( phpResult.status !== 0 ) {
			return {
				success: false,
				archive: resolvedArchive,
				slug: meta.slug,
				exitCode: phpResult.status,
				error: phpResult.stderr || phpResult.stdout,
			};
		}

		const passed = phpResult.stdout.includes(
			'Plugin bootstrap succeeded in standalone production environment'
		);

		return {
			success: passed,
			archive: resolvedArchive,
			slug: meta.slug,
			version: meta.version,
			output: phpResult.stdout.trim(),
		};
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
}

/**
 * CLI execution entrypoint.
 */
async function main() {
	const { values, positionals } = parseArgs( {
		options: {
			archive: { type: 'string', short: 'a' },
			root: { type: 'string', default: process.cwd() },
			json: { type: 'boolean', default: false },
			help: { type: 'boolean', short: 'h', default: false },
		},
		allowPositionals: true,
	} );

	if ( values.help ) {
		console.log( HELP );
		process.exit( 0 );
	}

	const root = resolve( values.root );
	let archivePath;
	try {
		archivePath = await findArchive(
			root,
			values.archive || positionals[ 0 ]
		);
	} catch ( err ) {
		console.error( `❌ Error: ${ err.message }` );
		process.exit( 1 );
	}

	const result = await smokeTestPackage( archivePath, { root } );

	if ( values.json ) {
		console.log( JSON.stringify( result, null, 2 ) );
		process.exit( result.success ? 0 : 1 );
	}

	console.log( `\n=== Packaged Plugin Standalone PHP Smoke Test ===` );
	console.log( `Archive: ${ basename( archivePath ) }` );
	console.log( `Slug:    ${ result.slug }\n` );

	if ( result.success ) {
		console.log( `✅ ${ result.output }` );
		console.log( `🎉 Packaged plugin smoke test PASSED!\n` );
		process.exit( 0 );
	} else {
		console.error( `❌ Smoke test failed: ${ result.error }` );
		process.exit( 1 );
	}
}

if (
	process.argv[ 1 ] &&
	resolve( process.argv[ 1 ] ) === resolve( fileURLToPath( import.meta.url ) )
) {
	main().catch( ( err ) => {
		console.error( `❌ Fatal: ${ err.message }` );
		process.exit( 1 );
	} );
}
