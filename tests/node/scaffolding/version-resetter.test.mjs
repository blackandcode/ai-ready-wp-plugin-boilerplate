import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { resetProjectVersion } from '../../../tools/scaffolding/lib/version-resetter.mjs';

test( 'resetProjectVersion resets package manifests, constants, and block manifests to 1.0.0', async () => {
	const dir = await mkdtemp( join( tmpdir(), 'version-resetter-test-' ) );
	try {
		// package.json
		await writeFile(
			join( dir, 'package.json' ),
			JSON.stringify( { name: 'my-plugin', version: '2.5.0' }, null, 2 ) + '\n',
			'utf8'
		);

		// package-lock.json
		await writeFile(
			join( dir, 'package-lock.json' ),
			JSON.stringify(
				{
					name: 'my-plugin',
					version: '2.5.0',
					packages: { '': { version: '2.5.0' } },
				},
				null,
				2
			) + '\n',
			'utf8'
		);

		// composer.json
		await writeFile(
			join( dir, 'composer.json' ),
			JSON.stringify( { name: 'vendor/my-plugin', version: '2.5.0' }, null, 2 ) + '\n',
			'utf8'
		);

		// Main PHP file
		await writeFile(
			join( dir, 'my-plugin.php' ),
			`<?php
/**
 * Plugin Name: My Plugin
 * Version: 2.5.0
 */
define( 'MY_PLUGIN_VERSION', '2.5.0' );
`,
			'utf8'
		);

		// Plugin.php
		await mkdir( join( dir, 'src/framework/Kernel' ), { recursive: true } );
		await writeFile(
			join( dir, 'src/framework/Kernel/Plugin.php' ),
			`<?php
namespace Vendor\\Plugin;
class Plugin {
	public const VERSION = '2.5.0';
}
`,
			'utf8'
		);

		// block.json
		await mkdir( join( dir, 'src/frontend/apps/hello-world' ), { recursive: true } );
		await writeFile(
			join( dir, 'src/frontend/apps/hello-world/block.json' ),
			JSON.stringify( { name: 'vendor/block', version: '2.5.0' }, null, 2 ) + '\n',
			'utf8'
		);

		// readme.txt
		await writeFile(
			join( dir, 'readme.txt' ),
			`=== My Plugin ===
Stable tag: 2.5.0
`,
			'utf8'
		);

		const changes = await resetProjectVersion( {
			root: dir,
			currentVersion: '2.5.0',
			targetVersion: '1.0.0',
			mainPhpFile: 'my-plugin.php',
			targetPrefix: 'MY_PLUGIN_',
		} );

		assert.equal( changes.length, 7 );

		const pkg = JSON.parse(
			changes.find( ( c ) => c.relativePath === 'package.json' ).after
		);
		assert.equal( pkg.version, '1.0.0' );

		const lock = JSON.parse(
			changes.find( ( c ) => c.relativePath === 'package-lock.json' ).after
		);
		assert.equal( lock.version, '1.0.0' );
		assert.equal( lock.packages[ '' ].version, '1.0.0' );

		const composer = JSON.parse(
			changes.find( ( c ) => c.relativePath === 'composer.json' ).after
		);
		assert.equal( composer.version, '1.0.0' );

		const php = changes.find( ( c ) => c.relativePath === 'my-plugin.php' ).after;
		assert.match( php, /\*\s*Version:\s*1\.0\.0/ );
		assert.match( php, /define\(\s*'MY_PLUGIN_VERSION',\s*'1\.0\.0'\s*\);/ );

		const kernel = changes.find(
			( c ) => c.relativePath === 'src/framework/Kernel/Plugin.php'
		 ).after;
		assert.match( kernel, /public\s+const\s+VERSION\s*=\s*'1\.0\.0';/ );

		const block = JSON.parse(
			changes.find(
				( c ) => c.relativePath === 'src/frontend/apps/hello-world/block.json'
			).after
		);
		assert.equal( block.version, '1.0.0' );

		const readme = changes.find( ( c ) => c.relativePath === 'readme.txt' ).after;
		assert.match( readme, /Stable\s+tag:\s*1\.0\.0/ );
	} finally {
		await rm( dir, { recursive: true, force: true } );
	}
} );
