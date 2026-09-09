#!/usr/bin/env node
import { readdir } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';
import { getPluginMetadata } from './build-package.mjs';
import { listZip } from './lib/zip-utils.mjs';

const HELP = `
Usage:
  node tools/release/validate-package.mjs [archive] [options]
  npm run release:validate -- [archive] [options]

Validates that a plugin distribution ZIP archive adheres to the strict
package contract (top-level directory prefix, required production files,
and zero leaked tests, dotfiles, or dev tooling).

Arguments:
  [archive]             Path to the ZIP file. Defaults to latest in dist/.

Options:
  --archive, -a <path>  Explicit ZIP archive path.
  --root <path>         Project root directory. Default: current directory.
  --json                Output structured JSON format.
  -h, --help            Show this help message.
`;

const FORBIDDEN_PATTERNS = [
	{ name: 'Git repository files (.git/)', pattern: /(?:^|\/)\.git\// },
	{
		name: 'Git hooks directory (.githooks/)',
		pattern: /(?:^|\/)\.githooks\//,
	},
	{ name: 'GitHub workflow files (.github/)', pattern: /(?:^|\/)\.github\// },
	{
		name: 'Cursor AI configuration (.cursor/)',
		pattern: /(?:^|\/)\.cursor\//,
	},
	{
		name: 'Agent configuration (.agents/ or .codex/)',
		pattern: /(?:^|\/)\.(agents|codex)\//,
	},
	{ name: 'Node modules (node_modules/)', pattern: /(?:^|\/)node_modules\// },
	{ name: 'Test suites and fixtures (tests/)', pattern: /(?:^|\/)tests\// },
	{
		name: 'Development and release tools (tools/)',
		pattern: /(?:^|\/)tools\//,
	},
	{ name: 'Documentation files (docs/)', pattern: /(?:^|\/)docs\// },
	{
		name: 'Environment secrets and files (.env*)',
		pattern: /(?:^|\/)\.env(?:$|\..*)/,
	},
	{
		name: 'WordPress environment orchestration (.wp-env*)',
		pattern: /(?:^|\/)\.wp-env(?:\.json|\/|$)/,
	},
	{ name: 'PHPUnit configuration (phpunit.xml*)', pattern: /phpunit\.xml/ },
	{ name: 'PHPCS configuration (phpcs.xml*)', pattern: /phpcs\.xml/ },
	{ name: 'PHPStan configuration (phpstan.neon*)', pattern: /phpstan\.neon/ },
	{ name: 'Jest configuration (jest.config*)', pattern: /jest\.config/ },
	{
		name: 'Playwright configuration (playwright.config*)',
		pattern: /playwright\.config/,
	},
	{
		name: 'TypeScript configuration (tsconfig.json)',
		pattern: /tsconfig\.json$/,
	},
	{
		name: 'Webpack configuration (webpack.config.js)',
		pattern: /webpack\.config\.js$/,
	},
	{
		name: 'Redocly OpenAPI configuration (redocly.yaml)',
		pattern: /redocly\.ya?ml$/,
	},
	{
		name: 'WordPress Playground blueprint (blueprint.json)',
		pattern: /blueprint\.json$/,
	},
	{
		name: 'WP-CLI environment configuration (wp-cli.yml)',
		pattern: /wp-cli\.ya?ml$/,
	},
	{
		name: 'npm package manifests (package.json / package-lock.json)',
		pattern: /package(?:-lock)?\.json$/,
	},
	{
		name: 'Composer package manifests (composer.json / composer.lock)',
		pattern: /composer\.(json|lock)$/,
	},
	{
		name: 'Agent instruction and repository files (AGENTS.md / MANIFEST.md)',
		pattern: /(?:AGENTS|MANIFEST)\.md$/,
	},
	{
		name: 'Repository documentation (README.md / CHANGELOG.md)',
		pattern: /(?:README|CHANGELOG)\.md$/,
	},
	{ name: 'Distignore file (.distignore)', pattern: /\.distignore$/ },
	{
		name: 'Development subsystem (src/development/)',
		pattern: /(?:^|\/)src\/development\//,
	},
	{
		name: 'Developer admin build assets (build/admin/developer/)',
		pattern: /(?:^|\/)build\/admin\/developer\//,
	},
	{
		name: 'Raw TypeScript / TSX source files (*.ts, *.tsx)',
		pattern: /\.(?:ts|tsx)$/,
	},
	{
		name: 'JavaScript / CSS source maps (*.map)',
		pattern: /\.map$/,
	},
	{
		name: 'Test files or fixtures (*.test.*, *.spec.*)',
		pattern: /\.(?:test|spec)\.[a-zA-Z0-9]+$/,
	},
	{
		name: 'Composer binaries directory (vendor/bin/)',
		pattern: /(?:^|\/)vendor\/bin\//,
	},
	{
		name: 'Leaked Composer development packages (require-dev)',
		pattern: /(?:^|\/)vendor\/(?:phpunit|phpstan|wp-coding-standards|dealerdirect|yoast|php-stubs|symfony)\//,
	},
];

/**
 * Discovers the distribution archive to validate.
 *
 * @param {string} root              Project root
 * @param {string} [explicitArchive] Optional archive path
 * @return {Promise<string>} Resolved ZIP archive path
 */
export async function findArchive( root, explicitArchive ) {
	if ( explicitArchive ) {
		return resolve( root, explicitArchive );
	}

	const distDir = join( root, 'dist' );
	let files = [];
	try {
		files = await readdir( distDir );
	} catch {
		throw new Error(
			`Directory "${ distDir }" does not exist. Run "npm run release:build" first.`
		);
	}

	const zipFiles = files.filter( ( f ) => f.endsWith( '.zip' ) );
	if ( zipFiles.length === 0 ) {
		throw new Error(
			`No .zip archives found in ${ distDir }. Run "npm run release:build" first.`
		);
	}

	// Pick the first or most recently modified
	return join( distDir, zipFiles[ 0 ] );
}

/**
 * Validates the contents of a ZIP archive against the package contract.
 *
 * @param {string} archivePath  Path to the ZIP file
 * @param {Object} [options]
 * @param          options.root
 * @return {Promise<{ valid: boolean, archive: string, slug: string, version: string, checks: Array<{ name: string, pass: boolean, detail: string }>, totalEntries: number }>}
 */
export async function validatePackage(
	archivePath,
	{ root = process.cwd() } = {}
) {
	const meta = await getPluginMetadata( root );
	const entries = await listZip( archivePath );
	const filenames = entries.map( ( e ) => e.filename.replace( /\\/g, '/' ) );

	const checks = [];
	const prefix = `${ meta.slug }/`;

	// 1. Top-level prefix check: every entry must reside in {slug}/
	const nonPrefixed = filenames.filter( ( f ) => ! f.startsWith( prefix ) );
	checks.push( {
		name: `All entries reside within top-level "${ meta.slug }/" directory`,
		pass: nonPrefixed.length === 0,
		detail:
			nonPrefixed.length === 0
				? `All ${ filenames.length } entries start with "${ prefix }"`
				: `Found ${
						nonPrefixed.length
				  } entries outside "${ prefix }": ${ nonPrefixed
						.slice( 0, 3 )
						.join( ', ' ) }`,
	} );

	// 1b. Allowlist conformance check: every entry must belong to an approved runtime path
	function isApprovedRuntimePath( relPath, mainPhpFile ) {
		if (
			relPath === mainPhpFile ||
			relPath === 'uninstall.php' ||
			relPath === 'readme.txt' ||
			relPath === 'LICENSE' ||
			relPath === 'LICENSE.txt' ||
			relPath === 'LICENSE.md'
		) {
			return true;
		}
		if (
			relPath.startsWith( 'languages/' ) ||
			relPath.startsWith( 'src/framework/' ) ||
			relPath.startsWith( 'src/backend/' ) ||
			relPath.startsWith( 'src/frontend/Bridge/' ) ||
			relPath.startsWith( 'src/frontend/patterns/' ) ||
			relPath.startsWith( 'src/frontend/templates/' ) ||
			/^src\/frontend\/apps\/[^/]+\/templates\//.test( relPath ) ||
			/^src\/[^/]+\.php$/.test( relPath ) ||
			relPath.startsWith( 'build/' ) ||
			relPath.startsWith( 'vendor/' )
		) {
			return true;
		}
		return false;
	}

	const unapprovedEntries = filenames
		.filter( ( f ) => f.startsWith( prefix ) )
		.map( ( f ) => f.slice( prefix.length ) )
		.filter( ( rel ) => ! isApprovedRuntimePath( rel, meta.mainPhpFile ) );

	checks.push( {
		name: 'All package entries conform to production allowlist',
		pass: unapprovedEntries.length === 0,
		detail:
			unapprovedEntries.length === 0
				? 'All entries match approved production paths'
				: `Found unapproved production entries: ${ unapprovedEntries
						.slice( 0, 5 )
						.join( ', ' ) }`,
	} );

	// 2. Required file: Main PHP file
	const expectedMainPhp = `${ prefix }${ meta.mainPhpFile }`;
	const hasMainPhp = filenames.includes( expectedMainPhp );
	checks.push( {
		name: `Main plugin file present (${ meta.mainPhpFile })`,
		pass: hasMainPhp,
		detail: hasMainPhp
			? `Found ${ expectedMainPhp }`
			: `Missing required main file ${ expectedMainPhp }`,
	} );

	// 3. Required file: vendor/autoload.php
	const expectedVendorAutoload = `${ prefix }vendor/autoload.php`;
	const hasVendorAutoload = filenames.includes( expectedVendorAutoload );
	checks.push( {
		name: 'Composer autoloader present (vendor/autoload.php)',
		pass: hasVendorAutoload,
		detail: hasVendorAutoload
			? `Found ${ expectedVendorAutoload }`
			: `Missing required autoloader ${ expectedVendorAutoload }`,
	} );

	// 4. Required directory: build/ with compiled assets
	const hasBuildAssets = filenames.some(
		( f ) => f.startsWith( `${ prefix }build/` ) && ! f.endsWith( '/' )
	);
	checks.push( {
		name: 'Compiled production assets present (build/)',
		pass: hasBuildAssets,
		detail: hasBuildAssets
			? `Found compiled assets under ${ prefix }build/`
			: `Missing compiled assets under ${ prefix }build/`,
	} );

	// 4b. Required asset metadata: build/*.asset.php present
	const hasAssetMetadata = filenames.some(
		( f ) =>
			f.startsWith( `${ prefix }build/` ) && f.endsWith( '.asset.php' )
	);
	checks.push( {
		name: 'Asset dependency metadata present (build/*.asset.php)',
		pass: hasAssetMetadata,
		detail: hasAssetMetadata
			? `Found asset metadata (.asset.php) under ${ prefix }build/`
			: `Missing asset metadata (.asset.php) under ${ prefix }build/`,
	} );

	// 5. Required directory: src/ with PHP runtime sources
	const hasSrcFiles = filenames.some(
		( f ) => f.startsWith( `${ prefix }src/` ) && f.endsWith( '.php' )
	);
	checks.push( {
		name: 'PHP source classes present (src/)',
		pass: hasSrcFiles,
		detail: hasSrcFiles
			? `Found PHP classes under ${ prefix }src/`
			: `Missing PHP sources under ${ prefix }src/`,
	} );

	// 6. Required file: uninstall.php
	const expectedUninstall = `${ prefix }uninstall.php`;
	const hasUninstall = filenames.includes( expectedUninstall );
	checks.push( {
		name: 'Plugin uninstall handler present (uninstall.php)',
		pass: hasUninstall,
		detail: hasUninstall
			? `Found ${ expectedUninstall }`
			: `Missing ${ expectedUninstall }`,
	} );

	// 7. Required file: readme.txt
	const expectedReadme = `${ prefix }readme.txt`;
	const hasReadme = filenames.includes( expectedReadme );
	checks.push( {
		name: 'WordPress readme.txt present',
		pass: hasReadme,
		detail: hasReadme
			? `Found ${ expectedReadme }`
			: `Missing ${ expectedReadme }`,
	} );

	// 8. Forbidden files and patterns
	for ( const forbidden of FORBIDDEN_PATTERNS ) {
		const matchedFiles = filenames.filter( ( f ) =>
			forbidden.pattern.test( f )
		);
		checks.push( {
			name: `Excludes forbidden: ${ forbidden.name }`,
			pass: matchedFiles.length === 0,
			detail:
				matchedFiles.length === 0
					? 'None found'
					: `Leaked into archive: ${ matchedFiles
							.slice( 0, 3 )
							.join( ', ' ) }`,
		} );
	}

	const allPassed = checks.every( ( c ) => c.pass );

	return {
		valid: allPassed,
		archive: archivePath,
		slug: meta.slug,
		version: meta.version,
		totalEntries: filenames.length,
		checks,
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
			archive: { type: 'string', short: 'a' },
			root: { type: 'string', default: process.cwd() },
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

	const explicitArchive = values.archive || positionals[ 0 ];

	try {
		const root = resolve( values.root );
		const archivePath = await findArchive( root, explicitArchive );
		const result = await validatePackage( archivePath, { root } );

		if ( values.json ) {
			console.log( JSON.stringify( result, null, 2 ) );
		} else {
			console.log(
				`\n=== Package Contract Validation: ${ basename(
					archivePath
				) } ===\n`
			);
			for ( const check of result.checks ) {
				const symbol = check.pass ? '✅' : '❌';
				console.log( `${ symbol } ${ check.name }` );
				if ( ! check.pass ) {
					console.log( `   ⚠️  ${ check.detail }` );
				}
			}
			console.log( `\nTotal archive entries: ${ result.totalEntries }` );
			if ( result.valid ) {
				console.log(
					'🎉 Package contract validation PASSED! The ZIP is production-ready.\n'
				);
			} else {
				console.error(
					'🚫 Package contract validation FAILED. Do not distribute this archive.\n'
				);
				process.exit( 1 );
			}
		}
	} catch ( error ) {
		console.error( `Error: ${ error.message }` );
		process.exit( 1 );
	}
}
