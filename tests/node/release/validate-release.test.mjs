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
