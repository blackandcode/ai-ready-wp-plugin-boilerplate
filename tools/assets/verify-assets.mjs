#!/usr/bin/env node
/**
 * Automated Asset Externalization and Dependency Verification.
 *
 * Verifies that production build assets:
 * 1. Generate valid .asset.php metadata files for every entrypoint.
 * 2. Externalize all WordPress runtime dependencies into .asset.php dependencies array.
 * 3. Do not accidentally bundle @wordpress/* packages into compiled JavaScript bundles.
 *
 * @package AIReady\WPPluginBoilerplate
 */

import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

const HELP = `
Usage:
  node tools/assets/verify-assets.mjs [options]
  npm run assets:verify -- [options]

Options:
  --root <path>        Project root directory. Default: current directory.
  --json               Output structured JSON format.
  -h, --help           Show this help message.
`;

/**
 * Expected build entrypoints and their required externalized WordPress dependencies.
 */
export const EXPECTED_ENTRYPOINTS = [
	{
		name: 'admin/settings/index',
		jsPath: 'build/admin/settings/index.js',
		assetPath: 'build/admin/settings/index.asset.php',
		requiredDeps: [
			'wp-element',
			'wp-components',
			'wp-i18n',
			'wp-api-fetch',
		],
	},
	{
		name: 'admin/developer/index',
		jsPath: 'build/admin/developer/index.js',
		assetPath: 'build/admin/developer/index.asset.php',
		requiredDeps: [
			'wp-element',
			'wp-components',
			'wp-i18n',
			'wp-api-fetch',
		],
	},
	{
		name: 'blocks/hello-world/index',
		jsPath: 'build/blocks/hello-world/index.js',
		assetPath: 'build/blocks/hello-world/index.asset.php',
		requiredDeps: [
			'wp-block-editor',
			'wp-blocks',
		],
	},
	{
		name: 'blocks/hello-world/view',
		jsPath: 'build/blocks/hello-world/view.js',
		assetPath: 'build/blocks/hello-world/view.asset.php',
		requiredDeps: [
			'wp-interactivity',
		],
	},
];

/**
 * Parses PHP asset definition string into structured dependencies and version.
 *
 * @param {string} phpContent Content of the .asset.php file.
 * @return {{ dependencies: string[], version: string }} Parsed asset metadata.
 */
export function parseAssetPhp( phpContent ) {
	const depsMatch = phpContent.match(
		/'dependencies'\s*=>\s*array\(\s*([^)]*)\s*\)/
	);
	const versionMatch = phpContent.match(
		/'version'\s*=>\s*'([^']*)'/
	);

	if ( ! depsMatch || ! versionMatch ) {
		throw new Error(
			'Invalid asset.php format: missing dependencies or version array'
		);
	}

	const depsRaw = depsMatch[ 1 ].trim();
	const dependencies = depsRaw.length > 0
		? depsRaw
				.split( ',' )
				.map( ( d ) => d.trim().replace( /^'|'$/g, '' ) )
				.filter( Boolean )
		: [];

	return {
		dependencies,
		version: versionMatch[ 1 ],
	};
}

/**
 * Validates generated production assets and externalization contract.
 *
 * @param {string} [root=process.cwd()] Project root directory.
 * @return {Promise<{ valid: boolean, checks: Array<{ name: string, pass: boolean, detail: string }>, entrypoints: Array<Object> }>}
 */
export async function verifyAssets( root = process.cwd() ) {
	const checks = [];
	const entrypoints = [];
	const buildDir = join( root, 'build' );

	if ( ! existsSync( buildDir ) ) {
		checks.push( {
			name: 'Build directory exists (build/)',
			pass: false,
			detail: `Directory "${ buildDir }" does not exist. Run "npm run build" first.`,
		} );
		return { valid: false, checks, entrypoints };
	}

	checks.push( {
		name: 'Build directory exists (build/)',
		pass: true,
		detail: `Build directory found at "${ buildDir }"`,
	} );

	for ( const entry of EXPECTED_ENTRYPOINTS ) {
		const fullJsPath = join( root, entry.jsPath );
		const fullAssetPath = join( root, entry.assetPath );

		// 1. Verify JS file existence
		const jsExists = existsSync( fullJsPath );
		checks.push( {
			name: `Compiled JS bundle exists: ${ entry.jsPath }`,
			pass: jsExists,
			detail: jsExists
				? `Found ${ entry.jsPath }`
				: `Missing compiled JS bundle at ${ entry.jsPath }`,
		} );

		// 2. Verify .asset.php file existence
		const assetExists = existsSync( fullAssetPath );
		checks.push( {
			name: `Asset metadata exists: ${ entry.assetPath }`,
			pass: assetExists,
			detail: assetExists
				? `Found ${ entry.assetPath }`
				: `Missing .asset.php metadata at ${ entry.assetPath }`,
		} );

		if ( ! jsExists || ! assetExists ) {
			continue;
		}

		// 3. Parse and validate .asset.php contents
		try {
			const phpContent = await readFile( fullAssetPath, 'utf8' );
			const parsed = parseAssetPhp( phpContent );

			checks.push( {
				name: `Valid PHP metadata structure: ${ entry.assetPath }`,
				pass: Boolean( parsed.version ),
				detail: `Version: ${ parsed.version }, Dependencies: [${ parsed.dependencies.join( ', ' ) }]`,
			} );

			// 4. Verify required external dependencies are present
			const missingDeps = entry.requiredDeps.filter(
				( dep ) => ! parsed.dependencies.includes( dep )
			);

			checks.push( {
				name: `External dependencies declared in ${ entry.assetPath }`,
				pass: missingDeps.length === 0,
				detail:
					missingDeps.length === 0
						? `All required external dependencies present (${ entry.requiredDeps.join( ', ' ) })`
						: `Missing external dependencies: ${ missingDeps.join( ', ' ) }`,
			} );

			// 5. Verify externalization in JS bundle (packages accessed via global wp rather than bundled)
			const jsContent = await readFile( fullJsPath, 'utf8' );
			const bundledWordPressModules = jsContent.includes(
				'node_modules/@wordpress/'
			);

			checks.push( {
				name: `No internal @wordpress/* module bundling in ${ entry.jsPath }`,
				pass: ! bundledWordPressModules,
				detail: ! bundledWordPressModules
					? 'WordPress runtime packages correctly externalized'
					: `Potential module leak: found "node_modules/@wordpress/" in ${ entry.jsPath }`,
			} );

			entrypoints.push( {
				name: entry.name,
				jsPath: entry.jsPath,
				assetPath: entry.assetPath,
				dependencies: parsed.dependencies,
				version: parsed.version,
			} );
		} catch ( err ) {
			checks.push( {
				name: `Parse asset metadata: ${ entry.assetPath }`,
				pass: false,
				detail: `Failed to parse ${ entry.assetPath }: ${ err.message }`,
			} );
		}
	}

	const allPassed = checks.length > 0 && checks.every( ( c ) => c.pass );
	return {
		valid: allPassed,
		checks,
		entrypoints,
	};
}

/**
 * CLI execution entrypoint.
 */
async function main() {
	const { values } = parseArgs( {
		options: {
			root: { type: 'string', default: process.cwd() },
			json: { type: 'boolean', default: false },
			help: { type: 'boolean', short: 'h', default: false },
		},
	} );

	if ( values.help ) {
		console.log( HELP );
		process.exit( 0 );
	}

	const root = resolve( values.root );
	const result = await verifyAssets( root );

	if ( values.json ) {
		console.log( JSON.stringify( result, null, 2 ) );
		process.exit( result.valid ? 0 : 1 );
	}

	console.log( '\n📦 WordPress Runtime Asset Externalization Verification\n' );
	for ( const check of result.checks ) {
		const icon = check.pass ? '✅' : '❌';
		console.log( `  ${ icon } ${ check.name }` );
		console.log( `     ${ check.detail }` );
	}
	console.log( '' );

	if ( result.valid ) {
		console.log(
			'✨ All production build assets verified and WordPress dependencies correctly externalized!\n'
		);
		process.exit( 0 );
	} else {
		console.error(
			'🚫 Asset externalization verification failed. Inspect errors above.\n'
		);
		process.exit( 1 );
	}
}

const isDirectExecution =
	import.meta.url === `file://${ process.argv[ 1 ] }` ||
	process.argv[ 1 ]?.endsWith( 'verify-assets.mjs' );

if ( isDirectExecution ) {
	main().catch( ( err ) => {
		console.error( 'Fatal error during asset verification:', err );
		process.exit( 1 );
	} );
}
