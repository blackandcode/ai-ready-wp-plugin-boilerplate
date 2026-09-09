import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
	installHooks,
	isGitRepository,
} from '../../../tools/git-hooks/install-hooks.mjs';

const testDir = dirname( fileURLToPath( import.meta.url ) );
const projectRoot = resolve( testDir, '../../..' );
const cliPath = join( projectRoot, 'tools/git-hooks/install-hooks.mjs' );

test( 'isGitRepository accurately detects git work trees', async () => {
	// Project root is a git repo
	assert.equal( isGitRepository( projectRoot ), true );

	// Temporary directory is not a git repo
	const tempDir = await mkdtemp( join( tmpdir(), 'airwp-hooks-test-' ) );
	try {
		assert.equal( isGitRepository( tempDir ), false );
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );

test( 'installHooks skips gracefully in non-git directories', async () => {
	const tempDir = await mkdtemp( join( tmpdir(), 'airwp-hooks-nongit-' ) );
	try {
		const res = installHooks( { root: tempDir, quiet: true } );
		assert.equal( res.success, true );
		assert.equal( res.skipped, true );
		assert.match( res.reason, /Not a git repository/ );
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );

test( 'installHooks configures and uninstalls core.hooksPath in a git repo', async () => {
	const tempDir = await mkdtemp( join( tmpdir(), 'airwp-hooks-repo-' ) );
	try {
		// Initialize temporary git repo
		spawnSync( 'git', [ 'init', tempDir ], { stdio: 'pipe' } );

		// Create mock .githooks/pre-commit
		await mkdir( join( tempDir, '.githooks' ), { recursive: true } );
		await writeFile(
			join( tempDir, '.githooks/pre-commit' ),
			'#!/usr/bin/env sh\nexit 0\n'
		);

		// Install hooks
		const installRes = installHooks( { root: tempDir, quiet: true } );
		assert.equal( installRes.success, true );
		assert.equal( installRes.hooksPath, '.githooks' );

		// Verify git config
		const check = spawnSync(
			'git',
			[ 'config', 'core.hooksPath' ],
			{ cwd: tempDir, encoding: 'utf-8' }
		);
		assert.equal( check.stdout.trim(), '.githooks' );

		// Uninstall hooks
		const uninstallRes = installHooks( {
			root: tempDir,
			uninstall: true,
			quiet: true,
		} );
		assert.equal( uninstallRes.success, true );
		assert.equal( uninstallRes.uninstalled, true );

		// Verify git config is unset
		const checkUnset = spawnSync(
			'git',
			[ 'config', 'core.hooksPath' ],
			{ cwd: tempDir, encoding: 'utf-8' }
		);
		assert.notEqual( checkUnset.stdout.trim(), '.githooks' );
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );

test( 'installHooks reports error if pre-commit script is missing', async () => {
	const tempDir = await mkdtemp( join( tmpdir(), 'airwp-hooks-missing-' ) );
	try {
		spawnSync( 'git', [ 'init', tempDir ], { stdio: 'pipe' } );

		const res = installHooks( { root: tempDir, quiet: true } );
		assert.equal( res.success, false );
		assert.match( res.error, /Pre-commit hook script not found/ );
	} finally {
		await rm( tempDir, { recursive: true, force: true } );
	}
} );

test( 'install-hooks CLI displays help message', () => {
	const res = spawnSync( process.execPath, [ cliPath, '--help' ], {
		encoding: 'utf-8',
	} );
	assert.equal( res.status, 0 );
	assert.match( res.stdout, /Usage:/ );
	assert.match( res.stdout, /core\.hooksPath/ );
} );
