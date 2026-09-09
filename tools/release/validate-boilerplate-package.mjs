#!/usr/bin/env node
import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';
import { getPluginMetadata } from './build-package.mjs';
import { listZip } from './lib/zip-utils.mjs';

const HELP = `
Usage:
  node tools/release/validate-boilerplate-package.mjs [options]
  npm run boilerplate:validate -- [options]

Validates that a Boilerplate Starter ZIP archive meets the full starter
template contract:
  - Resides within top-level {plugin-slug}/ directory
  - Contains working runtime files (main PHP, vendor/autoload.php, build/ assets)
  - Contains full developer template source (src/development, .cursor/, tests, tools, docs)
  - Strictly excludes node_modules/, .git/, and local secret/cache files

Options:
  --archive <path>      Path to ZIP archive. Defaults to first dist/*-starter-*.zip found.
  --root <path>         Project root directory. Default: current directory.
  --json                Output structured JSON format.
  -h, --help            Show this help message.
`;

const FORBIDDEN_BOILERPLATE_PATTERNS = [
	{
		name: 'Node modules (node_modules/)',
		pattern: /(?:^|\/)node_modules\//,
	},
	{
		name: 'Git repository files (.git/)',
		pattern: /(?:^|\/)\.git\//,
	},
	{
		name: 'Environment secrets (.env*)',
		pattern: /(?:^|\/)\.env(?:$|\.(?!example$).*)/,
	},
	{
		name: 'PHPUnit test cache (.phpunit.cache/)',
		pattern: /(?:^|\/)\.phpunit\.cache\//,
	},
	{
		name: 'Browser test reports (playwright-report/ or test-results/)',
		pattern: /(?:^|\/)(?:playwright-report|test-results)\//,
	},
	{
		name: 'Code coverage reports (coverage/)',
		pattern: /(?:^|\/)coverage\//,
	},
	{
		name: 'Bruno REST API reports (bruno/reports/)',
		pattern: /(?:^|\/)bruno\/reports\//,
	},
	{
		name: 'Nested archive files (*.zip, *.tar.gz, *.tgz)',
		pattern: /\.(?:zip|tar\.gz|tgz)$/,
	},
	{
		name: 'OS hidden files (.DS_Store, Thumbs.db)',
		pattern: /(?:^|\/)(?:\.DS_Store|Thumbs\.db)$/,
	},
];

/**
 * Discovers the boilerplate distribution archive to validate.
 *
 * @param {string} root              Project root
 * @param {string} [explicitArchive] Optional archive path
 * @return {Promise<string>} Resolved ZIP archive path
 */
export async function findBoilerplateArchive( root, explicitArchive ) {
	if ( explicitArchive ) {
		return resolve( root, explicitArchive );
	}

	const distDir = join( root, 'dist' );
	let files = [];
	try {
		files = await readdir( distDir );
	} catch {
		throw new Error(
			`Directory "${ distDir }" does not exist. Run "npm run boilerplate:build" first.`
		);
	}

	const starterZipFiles = files.filter(
		( f ) => f.includes( '-starter-' ) && f.endsWith( '.zip' )
	);
	if ( starterZipFiles.length === 0 ) {
		throw new Error(
			`No *-starter-*.zip archives found in ${ distDir }. Run "npm run boilerplate:build" first.`
		);
	}

	return join( distDir, starterZipFiles[ 0 ] );
}

/**
 * Validates the contents of a Boilerplate Starter ZIP archive.
 *
 * @param {string} archivePath Path to the ZIP file
 * @param {Object} [options]
 * @param          options.root
 * @return {Promise<{ valid: boolean, archive: string, slug: string, version: string, checks: Array<{ name: string, pass: boolean, detail: string }>, totalEntries: number }>}
 */
export async function validateBoilerplatePackage(
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
				: `Found ${ nonPrefixed.length } entries outside "${ prefix }": ${ nonPrefixed.slice( 0, 3 ).join( ', ' ) }`,
	} );

	// 2. Working runtime plugin requirements
	const expectedMainPhp = `${ prefix }${ meta.mainPhpFile }`;
	const hasMainPhp = filenames.includes( expectedMainPhp );
	checks.push( {
		name: `Main plugin file present (${ meta.mainPhpFile })`,
		pass: hasMainPhp,
		detail: hasMainPhp
			? `Found ${ expectedMainPhp }`
			: `Missing required main file ${ expectedMainPhp }`,
	} );

	const expectedVendorAutoload = `${ prefix }vendor/autoload.php`;
	const hasVendorAutoload = filenames.includes( expectedVendorAutoload );
	checks.push( {
		name: 'Composer production autoloader present (vendor/autoload.php)',
		pass: hasVendorAutoload,
		detail: hasVendorAutoload
			? `Found ${ expectedVendorAutoload }`
			: `Missing required autoloader ${ expectedVendorAutoload }`,
	} );

	const expectedBlocksManifest = `${ prefix }build/blocks-manifest.php`;
	const hasBlocksManifest = filenames.includes( expectedBlocksManifest );
	checks.push( {
		name: 'Blocks manifest present (build/blocks-manifest.php)',
		pass: hasBlocksManifest,
		detail: hasBlocksManifest
			? `Found ${ expectedBlocksManifest }`
			: `Missing ${ expectedBlocksManifest }`,
	} );

	const expectedSettingsJs = `${ prefix }build/admin/settings/index.js`;
	const hasSettingsJs = filenames.includes( expectedSettingsJs );
	checks.push( {
		name: 'Compiled settings bundle present (build/admin/settings/index.js)',
		pass: hasSettingsJs,
		detail: hasSettingsJs
			? `Found ${ expectedSettingsJs }`
			: `Missing ${ expectedSettingsJs }`,
	} );

	const expectedBlockJson = `${ prefix }build/blocks/hello-world/block.json`;
	const hasBlockJson = filenames.includes( expectedBlockJson );
	checks.push( {
		name: 'Compiled block metadata present (build/blocks/hello-world/block.json)',
		pass: hasBlockJson,
		detail: hasBlockJson
			? `Found ${ expectedBlockJson }`
			: `Missing ${ expectedBlockJson }`,
	} );

	const expectedReadme = `${ prefix }readme.txt`;
	const hasReadme = filenames.includes( expectedReadme );
	checks.push( {
		name: 'WordPress readme.txt present',
		pass: hasReadme,
		detail: hasReadme ? `Found ${ expectedReadme }` : `Missing ${ expectedReadme }`,
	} );

	const expectedUninstall = `${ prefix }uninstall.php`;
	const hasUninstall = filenames.includes( expectedUninstall );
	checks.push( {
		name: 'Plugin uninstall handler present (uninstall.php)',
		pass: hasUninstall,
		detail: hasUninstall
			? `Found ${ expectedUninstall }`
			: `Missing ${ expectedUninstall }`,
	} );

	// 3. Boilerplate developer assets
	const expectedPackageJson = `${ prefix }package.json`;
	const hasPackageJson = filenames.includes( expectedPackageJson );
	checks.push( {
		name: 'npm manifest present (package.json)',
		pass: hasPackageJson,
		detail: hasPackageJson
			? `Found ${ expectedPackageJson }`
			: `Missing ${ expectedPackageJson }`,
	} );

	const expectedComposerJson = `${ prefix }composer.json`;
	const hasComposerJson = filenames.includes( expectedComposerJson );
	checks.push( {
		name: 'Composer manifest present (composer.json)',
		pass: hasComposerJson,
		detail: hasComposerJson
			? `Found ${ expectedComposerJson }`
			: `Missing ${ expectedComposerJson }`,
	} );

	const hasCursorRules = filenames.some( ( f ) =>
		f.startsWith( `${ prefix }.cursor/rules/` )
	);
	checks.push( {
		name: 'AI coding agent rules present (.cursor/rules/)',
		pass: hasCursorRules,
		detail: hasCursorRules
			? 'Found rules in .cursor/rules/'
			: 'Missing rules in .cursor/rules/',
	} );

	const hasDevelopmentSubsystem = filenames.some( ( f ) =>
		f.startsWith( `${ prefix }src/development/` )
	);
	checks.push( {
		name: 'Development subsystem source present (src/development/)',
		pass: hasDevelopmentSubsystem,
		detail: hasDevelopmentSubsystem
			? 'Found development subsystem classes'
			: 'Missing src/development/',
	} );

	const hasFrontendSource = filenames.some(
		( f ) =>
			f.startsWith( `${ prefix }src/frontend/` ) &&
			( f.endsWith( '.ts' ) || f.endsWith( '.tsx' ) )
	);
	checks.push( {
		name: 'Uncompiled frontend TypeScript sources present (src/frontend/)',
		pass: hasFrontendSource,
		detail: hasFrontendSource
			? 'Found raw TypeScript sources'
			: 'Missing TypeScript sources in src/frontend/',
	} );

	const hasTests = filenames.some( ( f ) =>
		f.startsWith( `${ prefix }tests/` )
	);
	checks.push( {
		name: 'Testing suites present (tests/)',
		pass: hasTests,
		detail: hasTests ? 'Found tests in tests/' : 'Missing test suites in tests/',
	} );

	const hasScaffoldTool = filenames.includes(
		`${ prefix }tools/scaffolding/scaffold-plugin.mjs`
	);
	checks.push( {
		name: 'Scaffolding CLI tool present (tools/scaffolding/scaffold-plugin.mjs)',
		pass: hasScaffoldTool,
		detail: hasScaffoldTool
			? 'Found scaffold-plugin.mjs'
			: 'Missing scaffold-plugin.mjs',
	} );

	const hasDocs = filenames.some( ( f ) => f.startsWith( `${ prefix }docs/` ) );
	checks.push( {
		name: 'Documentation hub present (docs/)',
		pass: hasDocs ? true : false,
		detail: hasDocs ? 'Found documentation in docs/' : 'Missing docs/',
	} );

	const expectedReadmeMd = `${ prefix }README.md`;
	const hasReadmeMd = filenames.includes( expectedReadmeMd );
	checks.push( {
		name: 'Project README.md present',
		pass: hasReadmeMd,
		detail: hasReadmeMd
			? `Found ${ expectedReadmeMd }`
			: `Missing ${ expectedReadmeMd }`,
	} );

	// 4. Forbidden artifacts
	for ( const forbidden of FORBIDDEN_BOILERPLATE_PATTERNS ) {
		const matchedFiles = filenames.filter( ( f ) =>
			forbidden.pattern.test( f )
		);
		checks.push( {
			name: `Excludes forbidden: ${ forbidden.name }`,
			pass: matchedFiles.length === 0,
			detail:
				matchedFiles.length === 0
					? 'None found'
					: `Leaked into archive: ${ matchedFiles.slice( 0, 3 ).join( ', ' ) }`,
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
	const { values } = parseArgs( {
		options: {
			archive: { type: 'string' },
			root: { type: 'string', default: process.cwd() },
			json: { type: 'boolean', default: false },
			help: { type: 'boolean', short: 'h', default: false },
		},
		strict: true,
	} );

	if ( values.help ) {
		console.log( HELP.trim() );
		process.exit( 0 );
	}

	try {
		const archivePath = await findBoilerplateArchive(
			values.root,
			values.archive
		);
		const result = await validateBoilerplatePackage( archivePath, {
			root: values.root,
		} );

		if ( values.json ) {
			console.log( JSON.stringify( result, null, 2 ) );
		} else {
			const filename = archivePath.split( /[/\\]/ ).pop();
			console.log( `\n=== Boilerplate Starter Package Contract: ${ filename } ===\n` );

			for ( const check of result.checks ) {
				const icon = check.pass ? '✅' : '❌';
				console.log( `${ icon } ${ check.name }` );
				if ( ! check.pass ) {
					console.log( `   ⚠️  ${ check.detail }` );
				}
			}

			console.log( `\nTotal archive entries: ${ result.totalEntries }` );

			if ( result.valid ) {
				console.log(
					'🎉 Boilerplate Starter contract validation PASSED! The archive is ready for distribution.\n'
				);
			} else {
				console.error(
					'🚫 Boilerplate Starter contract validation FAILED. Correct issues above.\n'
				);
				process.exit( 1 );
			}
		}
	} catch ( err ) {
		console.error( `Error: ${ err.message }` );
		process.exit( 1 );
	}
}
