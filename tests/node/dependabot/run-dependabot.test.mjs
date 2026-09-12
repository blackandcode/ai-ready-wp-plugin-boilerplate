import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
	ECOSYSTEM_MAP,
	buildDependabotArgs,
	checkPrerequisites,
	detectRepoName,
	findDependabotBinary,
	generateJobDefinition,
	getEcosystemMapping,
	loadDependabotConfig,
	parseDependabotOutput,
	resolveGitHubToken,
} from '../../../tools/dependabot/run-dependabot.mjs';

test( 'resolveGitHubToken extracts token from environment variables in priority order', () => {
	// 1. LOCAL_GITHUB_ACCESS_TOKEN takes highest priority
	const res1 = resolveGitHubToken( {
		LOCAL_GITHUB_ACCESS_TOKEN: 'token_local',
		GITHUB_TOKEN: 'token_github',
		GH_TOKEN: 'token_gh',
	} );
	assert.equal( res1.token, 'token_local' );
	assert.equal( res1.source, 'LOCAL_GITHUB_ACCESS_TOKEN' );

	// 2. GITHUB_TOKEN takes next priority
	const res2 = resolveGitHubToken( {
		GITHUB_TOKEN: 'token_github',
		GH_TOKEN: 'token_gh',
	} );
	assert.equal( res2.token, 'token_github' );
	assert.equal( res2.source, 'GITHUB_TOKEN' );

	// 3. GH_TOKEN takes third priority
	const res3 = resolveGitHubToken( {
		GH_TOKEN: 'token_gh',
	} );
	assert.equal( res3.token, 'token_gh' );
	assert.equal( res3.source, 'GH_TOKEN' );

	// 4. Falls back to gh auth token command if no env var
	let execCalledWith = null;
	const mockExec = ( cmd ) => {
		execCalledWith = cmd;
		return 'token_from_gh_cli\n';
	};
	const res4 = resolveGitHubToken( {}, mockExec );
	assert.equal( execCalledWith, 'gh auth token' );
	assert.equal( res4.token, 'token_from_gh_cli' );
	assert.equal( res4.source, 'gh_cli' );

	// 5. Returns null when gh CLI also fails
	const failingExec = () => {
		throw new Error( 'gh not logged in' );
	};
	const res5 = resolveGitHubToken( {}, failingExec );
	assert.equal( res5.token, null );
	assert.equal( res5.source, null );
} );

test( 'getEcosystemMapping translates config ecosystem names to Dependabot CLI names', () => {
	assert.equal( getEcosystemMapping( 'github-actions' ), 'github_actions' );
	assert.equal( getEcosystemMapping( 'github_actions' ), 'github_actions' );
	assert.equal( getEcosystemMapping( 'npm' ), 'npm_and_yarn' );
	assert.equal( getEcosystemMapping( 'npm_and_yarn' ), 'npm_and_yarn' );
	assert.equal( getEcosystemMapping( 'composer' ), 'composer' );
	assert.equal( getEcosystemMapping( 'cargo' ), 'cargo' );
	assert.equal( getEcosystemMapping( 'docker-compose' ), 'docker_compose' );
	assert.equal( getEcosystemMapping( '' ), '' );
} );

test( 'loadDependabotConfig parses valid dependabot.yml configurations', () => {
	const tempDir = mkdtempSync( join( tmpdir(), 'dep-cfg-test-' ) );
	const tempConfig = join( tempDir, 'dependabot.yml' );

	try {
		const sampleYaml = `
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    ignore:
      - dependency-name: "react"
        versions: ["19.x"]
  - package-ecosystem: "composer"
    directory: "/"
    schedule:
      interval: "weekly"
`;
		writeFileSync( tempConfig, sampleYaml, 'utf8' );

		const config = loadDependabotConfig( tempConfig );
		assert.equal( config.version, 2 );
		assert.equal( config.updates.length, 3 );
		assert.equal( config.updates[ 0 ].packageEcosystem, 'github-actions' );
		assert.equal( config.updates[ 1 ].packageEcosystem, 'npm' );
		assert.equal( config.updates[ 1 ].ignore.length, 1 );
		assert.equal( config.updates[ 1 ].ignore[ 0 ][ 'dependency-name' ], 'react' );
		assert.equal( config.updates[ 2 ].packageEcosystem, 'composer' );
	} finally {
		rmSync( tempDir, { recursive: true, force: true } );
	}
} );

test( 'loadDependabotConfig throws on missing or invalid files', () => {
	assert.throws( () => {
		loadDependabotConfig( '/nonexistent/dependabot.yml' );
	}, /not found/i );

	const tempDir = mkdtempSync( join( tmpdir(), 'dep-inv-test-' ) );
	const tempConfig = join( tempDir, 'dependabot.yml' );
	try {
		writeFileSync( tempConfig, 'version: 2\n# Missing updates\n', 'utf8' );
		assert.throws( () => {
			loadDependabotConfig( tempConfig );
		}, /missing "updates" array/i );
	} finally {
		rmSync( tempDir, { recursive: true, force: true } );
	}
} );

test( 'detectRepoName parses owner and repo from remote git urls', () => {
	// HTTPS format
	const mockHttps = () => 'https://github.com/my-org/my-plugin.git\n';
	assert.equal( detectRepoName( 'fallback/repo', mockHttps ), 'my-org/my-plugin' );

	// SSH format
	const mockSsh = () => 'git@github.com:my-org/my-plugin.git\n';
	assert.equal( detectRepoName( 'fallback/repo', mockSsh ), 'my-org/my-plugin' );

	// Non-matching remote
	const mockOther = () => 'https://gitlab.com/other/repo.git\n';
	assert.equal( detectRepoName( 'fallback/repo', mockOther ), 'fallback/repo' );

	// Failure fallback
	const mockFail = () => {
		throw new Error( 'fatal: not a git repository' );
	};
	assert.equal( detectRepoName( 'fallback/repo', mockFail ), 'fallback/repo' );
} );

test( 'generateJobDefinition structures job parameters and ignore conditions', () => {
	const jobDef = generateJobDefinition( {
		ecosystem: 'composer',
		repo: 'owner/plugin',
		directory: '/',
		allow: [ { 'dependency-type': 'direct' } ],
		ignore: [
			{ 'dependency-name': 'phpunit/phpunit', versions: [ '>= 12' ] },
		],
		dep: 'phpunit/phpunit',
	} );

	assert.equal( jobDef.job[ 'package-manager' ], 'composer' );
	assert.equal( jobDef.job.source.repo, 'owner/plugin' );
	assert.deepEqual( jobDef.job[ 'allowed-updates' ], [ { 'dependency-type': 'direct' } ] );
	assert.equal( jobDef.job[ 'ignore-conditions' ].length, 1 );
	assert.equal( jobDef.job[ 'ignore-conditions' ][ 0 ][ 'dependency-name' ], 'phpunit/phpunit' );
	assert.equal( jobDef.job[ 'ignore-conditions' ][ 0 ][ 'version-requirement' ], '>= 12' );
	assert.equal( jobDef.job[ 'ignore-conditions' ][ 0 ].source, 'dependabot.yml' );
	assert.deepEqual( jobDef.job.dependencies, [ 'phpunit/phpunit' ] );
} );

test( 'buildDependabotArgs constructs valid CLI parameter vectors', () => {
	// Basic call
	const args1 = buildDependabotArgs( {
		ecosystem: 'composer',
		repo: 'owner/plugin',
		localDir: '.',
	} );
	assert.deepEqual( args1, [ 'update', 'composer', 'owner/plugin', '--local', '.' ] );

	// With sub-directory
	const args2 = buildDependabotArgs( {
		ecosystem: 'npm_and_yarn',
		repo: 'owner/plugin',
		localDir: '.',
		directory: '/src/frontend',
	} );
	assert.deepEqual( args2, [
		'update',
		'npm_and_yarn',
		'owner/plugin',
		'--local',
		'.',
		'--directory',
		'/src/frontend',
	] );

	// With single dependency filter
	const args3 = buildDependabotArgs( {
		ecosystem: 'github_actions',
		repo: 'owner/plugin',
		localDir: '.',
		dep: 'actions/checkout',
	} );
	assert.deepEqual( args3, [
		'update',
		'github_actions',
		'owner/plugin',
		'--local',
		'.',
		'--dep',
		'actions/checkout',
	] );

	// With input job definition file (-f)
	const args4 = buildDependabotArgs( {
		jobFile: '/tmp/job.yml',
		localDir: '.',
	} );
	assert.deepEqual( args4, [
		'update',
		'-f',
		'/tmp/job.yml',
		'--local',
		'.',
	] );
} );

test( 'parseDependabotOutput extracts created PR items, errors, and filters stack traces', () => {
	const sampleLog = `
updater | 2026/09/09 11:56:43 INFO Results:
updater | +-----------------------------------------------------------+
updater | |            Changes to Dependabot Pull Requests            |
updater | +---------+-------------------------------------------------+
updater | | created | actions/checkout ( from 4 to 7 )                |
updater | | created | actions/setup-node ( from 4 to 7 )              |
updater | | created | actions/upload-artifact ( from 4 to 7 )         |
updater | +---------+-------------------------------------------------+
updater | 2026/09/09 11:57:00 ERROR Failed to resolve registry token
updater | 2026/09/09 11:57:01 ERROR /home/dependabot/common/lib/dependabot/shared_helpers.rb:234:in 'run'
updater | No update possible for react-dom 18.3.1
updater | No update possible for @wordpress/components 30.0.0
`;

	const parsed = parseDependabotOutput( sampleLog );
	assert.equal( parsed.created.length, 3 );
	assert.equal( parsed.created[ 0 ].name, 'actions/checkout' );
	assert.equal( parsed.created[ 0 ].from, '4' );
	assert.equal( parsed.created[ 0 ].to, '7' );

	assert.equal( parsed.errors.length, 1 );
	assert.equal( parsed.errors[ 0 ], 'Failed to resolve registry token' );

	assert.equal( parsed.noUpdatePossible.length, 2 );
	assert.equal( parsed.noUpdatePossible[ 0 ], 'react-dom@18.3.1' );
	assert.equal( parsed.noUpdatePossible[ 1 ], '@wordpress/components@30.0.0' );
} );

test( 'parseDependabotOutput handles empty output gracefully', () => {
	const parsed = parseDependabotOutput( '' );
	assert.deepEqual( parsed.created, [] );
	assert.deepEqual( parsed.errors, [] );
	assert.deepEqual( parsed.noUpdatePossible, [] );
} );

test( 'findDependabotBinary searches designated paths and PATH variable', () => {
	const tempDir = mkdtempSync( join( tmpdir(), 'airwp-dependabot-test-' ) );
	try {
		const dummyBinary = join( tempDir, 'dependabot' );
		writeFileSync( dummyBinary, '#!/bin/sh\n', 'utf8' );

		const found = findDependabotBinary( [ dummyBinary ] );
		assert.ok( found !== null );
		assert.equal( found, dummyBinary );
		assert.match( found, /dependabot$/ );

		const foundViaPath = findDependabotBinary( [], { PATH: tempDir } );
		assert.equal( foundViaPath, dummyBinary );

		const missing = findDependabotBinary( [ '/nonexistent/path/dependabot' ], { PATH: '' } );
		assert.equal( missing, null );
	} finally {
		rmSync( tempDir, { recursive: true, force: true } );
	}
} );

test( 'checkPrerequisites detects missing binary or docker failures', () => {
	// Failing docker check
	const mockFailingDocker = () => {
		throw new Error( 'Cannot connect to the Docker daemon' );
	};
	const res = checkPrerequisites( { execFn: mockFailingDocker } );
	assert.equal( res.dockerRunning, false );
	assert.equal( res.ok, false );
	assert.ok( res.errors.some( ( e ) => e.includes( 'Docker daemon is not accessible' ) ) );
} );
