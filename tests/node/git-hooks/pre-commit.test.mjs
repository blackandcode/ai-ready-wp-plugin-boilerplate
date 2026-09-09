import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
	buildSteps,
} from '../../../tools/git-hooks/pre-commit.mjs';

const testDir = dirname( fileURLToPath( import.meta.url ) );
const projectRoot = resolve( testDir, '../../..' );
const cliPath = join( projectRoot, 'tools/git-hooks/pre-commit.mjs' );

test( 'buildSteps returns all 6 default CI-parity steps', () => {
	const steps = buildSteps( projectRoot );
	assert.equal( steps.length, 6 );

	const ids = steps.map( ( s ) => s.id );
	assert.deepEqual( ids, [
		'lint-js-css-md',
		'lint-openapi',
		'test-node-jest',
		'phpcs',
		'phpstan',
		'phpunit',
	] );

	// Confirm group balance: 3 JS, 3 PHP
	assert.equal( steps.filter( ( s ) => s.group === 'js' ).length, 3 );
	assert.equal( steps.filter( ( s ) => s.group === 'php' ).length, 3 );
} );

test( 'buildSteps filters correctly with jsOnly and phpOnly', () => {
	const jsSteps = buildSteps( projectRoot, { jsOnly: true } );
	assert.equal( jsSteps.length, 3 );
	assert.equal( jsSteps.every( ( s ) => s.group === 'js' ), true );

	const phpSteps = buildSteps( projectRoot, { phpOnly: true } );
	assert.equal( phpSteps.length, 3 );
	assert.equal( phpSteps.every( ( s ) => s.group === 'php' ), true );
} );

test( 'buildSteps filters test suites with skipTests', () => {
	const nonTestSteps = buildSteps( projectRoot, { skipTests: true } );
	assert.equal( nonTestSteps.length, 4 );
	assert.equal( nonTestSteps.some( ( s ) => s.isTest ), false );

	const ids = nonTestSteps.map( ( s ) => s.id );
	assert.deepEqual( ids, [
		'lint-js-css-md',
		'lint-openapi',
		'phpcs',
		'phpstan',
	] );

	const jsOnlyNonTest = buildSteps( projectRoot, {
		jsOnly: true,
		skipTests: true,
	} );
	assert.equal( jsOnlyNonTest.length, 2 );
	assert.deepEqual(
		jsOnlyNonTest.map( ( s ) => s.id ),
		[ 'lint-js-css-md', 'lint-openapi' ]
	);
} );

test( 'pre-commit CLI displays help message', () => {
	const res = spawnSync( process.execPath, [ cliPath, '--help' ], {
		encoding: 'utf-8',
	} );
	assert.equal( res.status, 0 );
	assert.match( res.stdout, /Usage:/ );
	assert.match( res.stdout, /_release-readiness\.yml/ );
	assert.match( res.stdout, /--js-only/ );
	assert.match( res.stdout, /--php-only/ );
} );
