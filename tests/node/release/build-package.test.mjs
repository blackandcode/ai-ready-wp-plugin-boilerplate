import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildPackage } from '../../../tools/release/build-package.mjs';
import { validatePackage } from '../../../tools/release/validate-package.mjs';

test( 'buildPackage creates compliant ZIP archive respecting .distignore and packages root {slug}/', async () => {
	const tempDir = await mkdtemp( join( tmpdir(), 'airwp-build-package-' ) );

	try {
		await writeFile(
			join( tempDir, 'package.json' ),
			JSON.stringify(
				{ name: 'sample-plugin', version: '1.4.0' },
				null,
				2
			)
		);

		await writeFile(
			join( tempDir, 'sample-plugin.php' ),
			`<?php
/**
 * Plugin Name: Sample Plugin
 * Version: 1.4.0
 * Text Domain: sample-plugin
 */
define( 'SAMPLE_PLUGIN_VERSION', '1.4.0' );
`
		);

		await writeFile(
			join( tempDir, 'readme.txt' ),
			`=== Sample Plugin ===
Stable tag: 1.4.0
`
		);

		await writeFile(
			join( tempDir, 'uninstall.php' ),
			`<?php
// uninstall routine
`
		);

		await mkdir( join( tempDir, 'src' ), { recursive: true } );
		await writeFile(
			join( tempDir, 'src/Plugin.php' ),
			'<?php class Plugin {}'
		);

		await mkdir( join( tempDir, 'build' ), { recursive: true } );
		await writeFile(
			join( tempDir, 'build/index.js' ),
			'console.log("built");'
		);
		await writeFile(
			join( tempDir, 'build/index.asset.php' ),
			"<?php return array('dependencies' => array('wp-element'), 'version' => '1.0.0');"
		);

		await mkdir( join( tempDir, 'vendor' ), { recursive: true } );
		await writeFile(
			join( tempDir, 'vendor/autoload.php' ),
			'<?php // autoloader'
		);

		// Files that should be IGNORED
		await mkdir( join( tempDir, '.git' ), { recursive: true } );
		await writeFile( join( tempDir, '.git/config' ), '[core]' );

		await mkdir( join( tempDir, 'tests' ), { recursive: true } );
		await writeFile( join( tempDir, 'tests/test.php' ), '<?php' );

		await mkdir( join( tempDir, 'tools' ), { recursive: true } );
		await writeFile( join( tempDir, 'tools/script.mjs' ), '// tool' );

		await writeFile(
			join( tempDir, '.distignore' ),
			`
/.git
/tests
/tools
/package.json
.distignore
*.zip
`
		);

		const result = await buildPackage( {
			root: tempDir,
			outDir: 'dist',
			skipBuild: true,
			skipComposer: true,
		} );

		assert.equal( result.slug, 'sample-plugin' );
		assert.equal( result.version, '1.4.0' );
		assert.equal( typeof result.sha256, 'string' );
		assert.equal( result.sha256.length, 64 );

		// Verify SHA256 checksum file
		const shaContent = await readFile( result.sha256Path, 'utf8' );
		assert.match(
			shaContent,
			new RegExp( `^${ result.sha256 }\\s+sample-plugin-1\\.4\\.0\\.zip` )
		);

		// Validate package contract against the built ZIP
		const validation = await validatePackage( result.zipPath, {
			root: tempDir,
		} );
		assert.equal( validation.valid, true );
		assert.equal(
			validation.checks.every( ( c ) => c.pass ),
			true
		);

		// Verify .files.json release inventory report
		const filesJsonRaw = await readFile( result.filesJsonPath, 'utf8' );
		const filesReport = JSON.parse( filesJsonRaw );
		assert.equal( filesReport.slug, 'sample-plugin' );
		assert.equal( filesReport.version, '1.4.0' );
		assert.equal( filesReport.archive, 'sample-plugin-1.4.0.zip' );
		assert.equal( filesReport.sha256, result.sha256 );
		assert.equal( typeof filesReport.totalFiles, 'number' );
		assert.equal( Array.isArray( filesReport.files ), true );
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );

test( 'buildPackage isolates staging, enforces allowlist, and leaves working tree intact', async () => {
	const tempDir = await mkdtemp( join( tmpdir(), 'airwp-build-isolate-' ) );

	try {
		await writeFile(
			join( tempDir, 'package.json' ),
			JSON.stringify( { name: 'allowlist-plugin', version: '1.0.0' }, null, 2 )
		);

		await writeFile(
			join( tempDir, 'allowlist-plugin.php' ),
			`<?php
/**
 * Plugin Name: Allowlist Plugin
 * Version: 1.0.0
 * Text Domain: allowlist-plugin
 */
`
		);

		await writeFile(
			join( tempDir, 'readme.txt' ),
			'=== Allowlist Plugin ===\nStable tag: 1.0.0\n'
		);
		await writeFile( join( tempDir, 'uninstall.php' ), '<?php\n' );

		await mkdir( join( tempDir, 'src/framework' ), { recursive: true } );
		await writeFile(
			join( tempDir, 'src/framework/Plugin.php' ),
			'<?php class Plugin {}'
		);

		// Development files that must NOT be copied
		await mkdir( join( tempDir, 'src/development/Cli' ), { recursive: true } );
		await writeFile(
			join( tempDir, 'src/development/Cli/DevCommand.php' ),
			'<?php class DevCommand {}'
		);

		await mkdir( join( tempDir, 'src/frontend/react' ), { recursive: true } );
		await writeFile(
			join( tempDir, 'src/frontend/react/App.tsx' ),
			'export const App = () => null;'
		);

		await writeFile(
			join( tempDir, 'redocly.yaml' ),
			'openapi: 3.1.0'
		);

		await mkdir( join( tempDir, 'build' ), { recursive: true } );
		await writeFile(
			join( tempDir, 'build/index.js' ),
			'console.log("built");'
		);
		await writeFile(
			join( tempDir, 'build/index.asset.php' ),
			"<?php return array('dependencies' => array('wp-element'), 'version' => '1.0.0');"
		);

		await mkdir( join( tempDir, 'vendor' ), { recursive: true } );
		await writeFile(
			join( tempDir, 'vendor/autoload.php' ),
			'<?php // autoloader'
		);
		// Sentinel file in local vendor to confirm working tree is undisturbed
		const sentinelPath = join( tempDir, 'vendor/local-dev-sentinel.txt' );
		await writeFile( sentinelPath, 'dev-workspace-intact' );

		const result = await buildPackage( {
			root: tempDir,
			outDir: 'dist',
			skipBuild: true,
			unsafeSkipComposer: true,
		} );

		// Local sentinel must still exist in working tree
		const localSentinel = await readFile( sentinelPath, 'utf8' );
		assert.equal( localSentinel, 'dev-workspace-intact' );

		// Staged directory must be cleaned up
		const stagingDir = join( tempDir, 'dist/.staging' );
		let stagingExists = false;
		try {
			await readFile( join( stagingDir, 'allowlist-plugin/allowlist-plugin.php' ) );
			stagingExists = true;
		} catch {
			stagingExists = false;
		}
		assert.equal( stagingExists, false );

		// Validate package
		const validation = await validatePackage( result.zipPath, { root: tempDir } );
		assert.equal( validation.valid, true );

		// Check .files.json does NOT contain development files
		const filesReport = JSON.parse( await readFile( result.filesJsonPath, 'utf8' ) );
		assert.equal(
			filesReport.files.some( ( f ) => f.includes( 'src/development' ) ),
			false
		);
		assert.equal(
			filesReport.files.some( ( f ) => f.endsWith( '.tsx' ) ),
			false
		);
		assert.equal(
			filesReport.files.some( ( f ) => f.includes( 'redocly.yaml' ) ),
			false
		);
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );
