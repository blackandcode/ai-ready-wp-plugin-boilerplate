import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateRelease } from '../../../tools/release/validate-release.mjs';

test( 'validateRelease passes when all files and headers match target version', async () => {
	const tempDir = await mkdtemp(
		join( tmpdir(), 'airwp-validate-release-' )
	);

	try {
		await writeFile(
			join( tempDir, 'package.json' ),
			JSON.stringify( { name: 'test-plugin', version: '2.0.0' }, null, 2 )
		);

		await writeFile(
			join( tempDir, 'test-plugin.php' ),
			`<?php
/**
 * Plugin Name: Test Plugin
 * Version: 2.0.0
 * Text Domain: test-plugin
 */
define( 'TEST_PLUGIN_VERSION', '2.0.0' );
`
		);

		await writeFile(
			join( tempDir, 'readme.txt' ),
			`=== Test Plugin ===
Stable tag: 2.0.0
`
		);

		await writeFile(
			join( tempDir, 'CHANGELOG.md' ),
			`# Changelog
## [2.0.0] - 2026-09-09
### Added
- Major release 2.0.0
`
		);

		const result = await validateRelease( {
			root: tempDir,
			version: '2.0.0',
			skipBranchCheck: true,
			skipTagCheck: true,
		} );

		assert.equal( result.valid, true );
		assert.equal( result.targetVersion, '2.0.0' );
		assert.equal(
			result.checks.every( ( c ) => c.pass ),
			true
		);
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );

test( 'validateRelease detects version mismatches in headers or readme', async () => {
	const tempDir = await mkdtemp(
		join( tmpdir(), 'airwp-validate-release-mismatch-' )
	);

	try {
		await writeFile(
			join( tempDir, 'package.json' ),
			JSON.stringify( { name: 'test-plugin', version: '2.0.0' }, null, 2 )
		);

		await writeFile(
			join( tempDir, 'test-plugin.php' ),
			`<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.9.0
 * Text Domain: test-plugin
 */
define( 'TEST_PLUGIN_VERSION', '1.9.0' );
`
		);

		await writeFile(
			join( tempDir, 'readme.txt' ),
			`=== Test Plugin ===
Stable tag: 1.8.0
`
		);

		await writeFile(
			join( tempDir, 'CHANGELOG.md' ),
			`# Changelog
## [1.0.0]
`
		);

		const result = await validateRelease( {
			root: tempDir,
			version: '2.0.0',
			skipBranchCheck: true,
			skipTagCheck: true,
		} );

		assert.equal( result.valid, false );
		const failedChecks = result.checks.filter( ( c ) => ! c.pass );
		assert.equal( failedChecks.length >= 3, true );
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );

test( 'validateRelease validates Plugin::VERSION, block.json, compatibility baselines, and composer.json', async () => {
	const tempDir = await mkdtemp(
		join( tmpdir(), 'airwp-validate-release-full-' )
	);

	try {
		await writeFile(
			join( tempDir, 'package.json' ),
			JSON.stringify( { name: 'test-plugin', version: '2.0.0' }, null, 2 )
		);

		await writeFile(
			join( tempDir, 'test-plugin.php' ),
			`<?php
/**
 * Plugin Name: Test Plugin
 * Version: 2.0.0
 * Requires at least: 7.1
 * Requires PHP: 8.3
 * Text Domain: test-plugin
 */
define( 'TEST_PLUGIN_VERSION', '2.0.0' );
`
		);

		await mkdir( join( tempDir, 'src/framework/Kernel' ), {
			recursive: true,
		} );
		await writeFile(
			join( tempDir, 'src/framework/Kernel/Plugin.php' ),
			`<?php
namespace AIReady\\WPPluginBoilerplate\\Framework\\Kernel;
class Plugin {
    public const VERSION = '2.0.0';
}
`
		);

		await mkdir( join( tempDir, 'src/frontend/apps/hello-world' ), {
			recursive: true,
		} );
		await writeFile(
			join( tempDir, 'src/frontend/apps/hello-world/block.json' ),
			JSON.stringify( { name: 'test/block', version: '2.0.0' }, null, 2 )
		);

		await writeFile(
			join( tempDir, 'readme.txt' ),
			`=== Test Plugin ===
Requires at least: 7.1
Requires PHP: 8.3
Stable tag: 2.0.0
`
		);

		await writeFile(
			join( tempDir, 'composer.json' ),
			JSON.stringify( { require: { php: '>=8.3' } }, null, 2 )
		);

		await writeFile(
			join( tempDir, 'CHANGELOG.md' ),
			`# Changelog
## [2.0.0] - 2026-09-09
### Added
- Complete release 2.0.0
`
		);

		const result = await validateRelease( {
			root: tempDir,
			version: '2.0.0',
			skipBranchCheck: true,
			skipTagCheck: true,
		} );

		assert.equal( result.valid, true );
		assert.equal(
			result.checks.some(
				( c ) => c.name.includes( 'Plugin::VERSION' ) && c.pass
			),
			true
		);
		assert.equal(
			result.checks.some(
				( c ) => c.name.includes( 'block.json' ) && c.pass
			),
			true
		);
		assert.equal(
			result.checks.some(
				( c ) => c.name.includes( 'Requires at least' ) && c.pass
			),
			true
		);
		assert.equal(
			result.checks.some(
				( c ) => c.name.includes( 'Requires PHP' ) && c.pass
			),
			true
		);
		assert.equal(
			result.checks.some(
				( c ) => c.name.includes( 'composer.json' ) && c.pass
			),
			true
		);
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );
