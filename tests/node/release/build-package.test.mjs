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
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );
