import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validatePackage } from '../../../tools/release/validate-package.mjs';
import { createZip } from '../../../tools/release/lib/zip-utils.mjs';

test( 'validatePackage accepts compliant distribution package', async () => {
	const tempDir = await mkdtemp(
		join( tmpdir(), 'airwp-validate-package-' )
	);
	const zipPath = join( tempDir, 'dist/test-plugin-1.0.0.zip' );

	try {
		await writeFile(
			join( tempDir, 'package.json' ),
			JSON.stringify( { name: 'test-plugin', version: '1.0.0' }, null, 2 )
		);

		await writeFile(
			join( tempDir, 'test-plugin.php' ),
			`<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.0.0
 * Text Domain: test-plugin
 */
`
		);

		const entries = [
			{ path: 'test-plugin/test-plugin.php', data: '<?php' },
			{
				path: 'test-plugin/readme.txt',
				data: '=== Test ===\nStable tag: 1.0.0',
			},
			{ path: 'test-plugin/uninstall.php', data: '<?php' },
			{ path: 'test-plugin/vendor/autoload.php', data: '<?php' },
			{ path: 'test-plugin/src/Plugin.php', data: '<?php' },
			{ path: 'test-plugin/build/app.js', data: 'console.log();' },
		];

		await createZip( entries, zipPath );

		const result = await validatePackage( zipPath, { root: tempDir } );
		assert.equal( result.valid, true );
		assert.equal(
			result.checks.every( ( c ) => c.pass ),
			true
		);
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );

test( 'validatePackage flags missing required files and forbidden development files', async () => {
	const tempDir = await mkdtemp(
		join( tmpdir(), 'airwp-validate-package-bad-' )
	);
	const zipPath = join( tempDir, 'dist/test-plugin-1.0.0.zip' );

	try {
		await writeFile(
			join( tempDir, 'package.json' ),
			JSON.stringify( { name: 'test-plugin', version: '1.0.0' }, null, 2 )
		);

		await writeFile(
			join( tempDir, 'test-plugin.php' ),
			`<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.0.0
 * Text Domain: test-plugin
 */
`
		);

		// Missing vendor/autoload.php, missing uninstall.php, and includes forbidden .git and tests/
		const entries = [
			{ path: 'test-plugin/test-plugin.php', data: '<?php' },
			{
				path: 'test-plugin/readme.txt',
				data: '=== Test ===\nStable tag: 1.0.0',
			},
			{ path: 'test-plugin/src/Plugin.php', data: '<?php' },
			{ path: 'test-plugin/build/app.js', data: 'console.log();' },
			{ path: 'test-plugin/.git/HEAD', data: 'ref: refs/heads/main' },
			{ path: 'test-plugin/tests/sample.test.php', data: '<?php' },
			{ path: 'test-plugin/package.json', data: '{}' },
		];

		await createZip( entries, zipPath );

		const result = await validatePackage( zipPath, { root: tempDir } );
		assert.equal( result.valid, false );

		const failed = result.checks.filter( ( c ) => ! c.pass );
		assert.equal( failed.length >= 4, true );
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );
