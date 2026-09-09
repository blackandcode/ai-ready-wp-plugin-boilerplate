#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const HELP = `
Usage:
  node tools/git-hooks/pre-commit.mjs [options]
  npm run pre-commit -- [options]
  npm run check -- [options]

Executes local quality checks matching GitHub Actions CI parity
(_release-readiness.yml quality-js and quality-php jobs) before commits.

Options:
  --js-only         Run only JavaScript/Node checks (lint, openapi, tests).
  --php-only        Run only PHP checks (phpcs, phpstan, phpunit).
  --skip-tests      Run linters and static analysis, skipping unit test suites.
  --root <path>     Repository root directory. Default: current directory.
  --quiet, -q       Minimal output; only display failures.
  -h, --help        Show this help message.

Bypass:
  git commit --no-verify
  SKIP_PRE_COMMIT=1 git commit
`;

/**
 * Resolves binary executable taking platform differences into account.
 *
 * @param {string} root Project root.
 * @param {string} name Tool name in vendor/bin.
 * @return {string} Path or command name.
 */
function resolveVendorBin( root, name ) {
	const isWin = process.platform === 'win32';
	const candidateBat = join( root, 'vendor', 'bin', `${ name }.bat` );
	const candidateSh = join( root, 'vendor', 'bin', name );

	if ( isWin && existsSync( candidateBat ) ) {
		return candidateBat;
	}
	if ( existsSync( candidateSh ) ) {
		return candidateSh;
	}
	return name;
}

/**
 * Resolves npm executable command name.
 *
 * @return {string} Executable.
 */
function getNpmCmd() {
	return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

/**
 * Resolves composer executable command name.
 *
 * @return {string} Executable.
 */
function getComposerCmd() {
	return process.platform === 'win32' ? 'composer.bat' : 'composer';
}

/**
 * Build the list of quality check steps based on options.
 *
 * @param {string}  root    Project root.
 * @param {Object}  options
 * @param {boolean} [options.jsOnly]
 * @param {boolean} [options.phpOnly]
 * @param {boolean} [options.skipTests]
 * @return {Array<{ id: string, name: string, group: 'js'|'php', isTest: boolean, cmd: string, args: string[], remediation: string }>} Steps.
 */
export function buildSteps( root, options = {} ) {
	const npmCmd = getNpmCmd();
	const composerCmd = getComposerCmd();
	const phpcsBin = resolveVendorBin( root, 'phpcs' );
	const phpstanBin = resolveVendorBin( root, 'phpstan' );
	const phpunitBin = resolveVendorBin( root, 'phpunit' );

	const allSteps = [
		{
			id: 'lint-js-css-md',
			name: 'JavaScript, CSS, Markdown & Actions linting (npm run lint)',
			group: 'js',
			isTest: false,
			cmd: npmCmd,
			args: [ 'run', 'lint' ],
			remediation: 'Run "npm run lint:js -- --fix" or check markdownlint / actions output.',
		},
		{
			id: 'lint-openapi',
			name: 'OpenAPI specification linting (npm run openapi:lint)',
			group: 'js',
			isTest: false,
			cmd: npmCmd,
			args: [ 'run', 'openapi:lint' ],
			remediation: 'Run "npm run openapi:lint" to inspect Redocly errors or regenerate from controllers.',
		},
		{
			id: 'test-node-jest',
			name: 'Jest and Node test suites (npm run test)',
			group: 'js',
			isTest: true,
			cmd: npmCmd,
			args: [ 'run', 'test' ],
			remediation: 'Run "npm run test:unit" to debug failing Jest specs or individual node tests.',
		},
		{
			id: 'phpcs',
			name: 'WordPress Coding Standards (vendor/bin/phpcs)',
			group: 'php',
			isTest: false,
			cmd: phpcsBin.includes( 'vendor' ) ? phpcsBin : composerCmd,
			args: phpcsBin.includes( 'vendor' ) ? [] : [ 'lint' ],
			remediation: 'Run "composer lint:fix" to automatically fix code style issues.',
		},
		{
			id: 'phpstan',
			name: 'PHPStan static analysis (vendor/bin/phpstan analyse)',
			group: 'php',
			isTest: false,
			cmd: phpstanBin.includes( 'vendor' ) ? phpstanBin : composerCmd,
			args: phpstanBin.includes( 'vendor' )
				? [ 'analyse' ]
				: [ 'analyse' ],
			remediation: 'Run "vendor/bin/phpstan analyse" to inspect static typing errors.',
		},
		{
			id: 'phpunit',
			name: 'PHPUnit test suite (vendor/bin/phpunit)',
			group: 'php',
			isTest: true,
			cmd: phpunitBin.includes( 'vendor' ) ? phpunitBin : composerCmd,
			args: phpunitBin.includes( 'vendor' ) ? [] : [ 'test' ],
			remediation: 'Run "vendor/bin/phpunit" to debug failing PHP unit tests.',
		},
	];

	return allSteps.filter( ( step ) => {
		if ( options.jsOnly && step.group !== 'js' ) {
			return false;
		}
		if ( options.phpOnly && step.group !== 'php' ) {
			return false;
		}
		if ( options.skipTests && step.isTest ) {
			return false;
		}
		return true;
	} );
}

/**
 * Runs a single step command.
 *
 * @param {Object} step Step definition.
 * @param {string} cwd  Working directory.
 * @return {{ status: number, stdout: string, stderr: string, durationMs: number }}
 */
function executeStep( step, cwd ) {
	const start = Date.now();
	const result = spawnSync( step.cmd, step.args, {
		cwd,
		stdio: 'pipe',
		encoding: 'utf-8',
		shell: process.platform === 'win32',
	} );
	const durationMs = Date.now() - start;

	return {
		status: result.status ?? 1,
		stdout: result.stdout || '',
		stderr: result.stderr || '',
		durationMs,
	};
}

/**
 * Runs pre-commit quality checks.
 *
 * @param {Object}  options
 * @param {string}  [options.root]      Project root.
 * @param {boolean} [options.jsOnly]    Run only JS checks.
 * @param {boolean} [options.phpOnly]   Run only PHP checks.
 * @param {boolean} [options.skipTests] Skip test suites.
 * @param {boolean} [options.quiet]     Minimal output.
 * @return {{ success: boolean, results: Array<{ id: string, name: string, status: 'passed'|'failed', durationMs: number, error?: string }>, totalDurationMs: number }}
 */
export function runPreCommitChecks( options = {} ) {
	const root = resolve( options.root || process.cwd() );
	const steps = buildSteps( root, options );
	const quiet = Boolean( options.quiet );
	const results = [];
	const overallStart = Date.now();

	if ( ! quiet ) {
		console.log( '\n🛡️  Running pre-commit quality checks (CI parity)...\n' );
	}

	let allPassed = true;

	for ( let i = 0; i < steps.length; i++ ) {
		const step = steps[ i ];
		const stepNumber = `[${ i + 1 }/${ steps.length }]`;

		if ( ! quiet ) {
			process.stdout.write( `▶ ${ stepNumber } ${ step.name }... ` );
		}

		const outcome = executeStep( step, root );
		const seconds = ( outcome.durationMs / 1000 ).toFixed( 1 );

		if ( outcome.status === 0 ) {
			if ( ! quiet ) {
				process.stdout.write( `✔ Passed (${ seconds }s)\n` );
			}
			results.push( {
				id: step.id,
				name: step.name,
				status: 'passed',
				durationMs: outcome.durationMs,
			} );
		} else {
			allPassed = false;
			if ( ! quiet ) {
				process.stdout.write( `✖ Failed (${ seconds }s)\n` );
			}

			const output = ( outcome.stdout + '\n' + outcome.stderr ).trim();
			const errorSnippet = output
				? output
						.split( '\n' )
						.slice( -30 )
						.join( '\n' )
				: 'Process exited with non-zero status.';

			if ( ! quiet ) {
				console.error( '\n' + '='.repeat( 60 ) );
				console.error( `❌ Failure in: ${ step.name }` );
				console.error( '='.repeat( 60 ) );
				console.error( errorSnippet );
				console.error( '='.repeat( 60 ) );
				console.error( `💡 Remediation: ${ step.remediation }\n` );
				console.error(
					'⚠️  To bypass in an emergency: git commit --no-verify\n'
				);
			}

			results.push( {
				id: step.id,
				name: step.name,
				status: 'failed',
				durationMs: outcome.durationMs,
				error: errorSnippet,
			} );

			// Fail-fast on first error
			break;
		}
	}

	const totalDurationMs = Date.now() - overallStart;
	const totalSeconds = ( totalDurationMs / 1000 ).toFixed( 1 );

	if ( ! quiet ) {
		if ( allPassed ) {
			console.log(
				`\n✨ All ${ steps.length } quality checks passed in ${ totalSeconds }s. Ready to commit!\n`
			);
		} else {
			console.error(
				`\n💥 Pre-commit checks failed after ${ totalSeconds }s. Please resolve the errors above before committing.\n`
			);
		}
	}

	return {
		success: allPassed,
		results,
		totalDurationMs,
	};
}

// CLI entry point
const isDirectCall =
	process.argv[ 1 ] &&
	resolve( process.argv[ 1 ] ) === resolve( new URL( import.meta.url ).pathname );

if ( isDirectCall ) {
	const { values } = parseArgs( {
		options: {
			'js-only': { type: 'boolean', default: false },
			'php-only': { type: 'boolean', default: false },
			'skip-tests': { type: 'boolean', default: false },
			root: { type: 'string', default: process.cwd() },
			quiet: { type: 'boolean', short: 'q', default: false },
			help: { type: 'boolean', short: 'h', default: false },
		},
		strict: true,
	} );

	if ( values.help ) {
		console.log( HELP.trim() );
		process.exit( 0 );
	}

	const result = runPreCommitChecks( {
		root: values.root,
		jsOnly: values[ 'js-only' ],
		phpOnly: values[ 'php-only' ],
		skipTests: values[ 'skip-tests' ],
		quiet: values.quiet,
	} );

	process.exit( result.success ? 0 : 1 );
}
