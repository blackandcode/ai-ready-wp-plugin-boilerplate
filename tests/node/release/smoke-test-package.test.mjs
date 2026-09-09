import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { smokeTestPackage } from '../../../tools/release/smoke-test-package.mjs';
import { createZip } from '../../../tools/release/lib/zip-utils.mjs';

test( 'smokeTestPackage executes PHP bootstrap on extracted archive and reports success', async () => {
	const tempDir = await mkdtemp(
		join( tmpdir(), 'airwp-smoke-test-pkg-' )
	);
	const zipPath = join( tempDir, 'sample-1.0.0.zip' );

	try {
		await writeFile(
			join( tempDir, 'package.json' ),
			JSON.stringify( { name: 'sample-plugin', version: '1.0.0' }, null, 2 )
		);

		await writeFile(
			join( tempDir, 'sample-plugin.php' ),
			`<?php
/**
 * Plugin Name: Sample Plugin
 * Text Domain: sample-plugin
 */
`
		);

		const mockMainPhp = `<?php
namespace AIReady\\WPPluginBoilerplate\\Framework\\Kernel;
class Plugin {
	private static $instance = null;
	public static function instance() {
		if ( self::$instance === null ) { self::$instance = new self(); }
		return self::$instance;
	}
	public function boot() { return true; }
}
`;

		const entries = [
			{ path: 'sample-plugin/sample-plugin.php', data: mockMainPhp },
			{ path: 'sample-plugin/vendor/autoload.php', data: '<?php // autoloader' },
		];

		await createZip( entries, zipPath );

		const result = await smokeTestPackage( zipPath, { root: tempDir } );
		assert.equal( result.success, true );
		assert.equal( result.slug, 'sample-plugin' );
		assert.match( result.output, /Plugin bootstrap succeeded/ );
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );

test( 'smokeTestPackage fails gracefully when required files are missing in archive', async () => {
	const tempDir = await mkdtemp(
		join( tmpdir(), 'airwp-smoke-test-missing-' )
	);
	const zipPath = join( tempDir, 'broken-1.0.0.zip' );

	try {
		await writeFile(
			join( tempDir, 'package.json' ),
			JSON.stringify( { name: 'broken-plugin', version: '1.0.0' }, null, 2 )
		);

		await writeFile(
			join( tempDir, 'broken-plugin.php' ),
			`<?php
/**
 * Plugin Name: Broken Plugin
 * Text Domain: broken-plugin
 */
`
		);

		// Archive missing vendor/autoload.php
		const entries = [
			{ path: 'broken-plugin/broken-plugin.php', data: '<?php' },
		];

		await createZip( entries, zipPath );

		const result = await smokeTestPackage( zipPath, { root: tempDir } );
		assert.equal( result.success, false );
		assert.match( result.error, /Missing vendor\/autoload\.php/ );
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );
