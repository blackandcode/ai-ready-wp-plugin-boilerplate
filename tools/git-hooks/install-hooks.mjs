#!/usr/bin/env node
import { chmodSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const HELP = `
Usage:
  node tools/git-hooks/install-hooks.mjs [options]
  npm run hooks:install
  npm run hooks:uninstall

Configures Git to use in-tree hooks (.githooks/) via core.hooksPath,
or unsets core.hooksPath.

Options:
  --root <path>     Repository root directory. Default: current directory.
  --uninstall       Unset Git core.hooksPath configuration.
  --quiet, -q       Suppress informative output.
  -h, --help        Show this help message.
`;

/**
 * Checks if the target directory is inside a Git repository work tree.
 *
 * @param {string} root Target directory.
 * @return {boolean} True if inside git work tree.
 */
export function isGitRepository( root = process.cwd() ) {
	try {
		const res = spawnSync(
			'git',
			[ 'rev-parse', '--is-inside-work-tree' ],
			{
				cwd: root,
				stdio: 'pipe',
				encoding: 'utf-8',
			}
		);
		return res.status === 0 && res.stdout.trim() === 'true';
	} catch {
		return false;
	}
}

/**
 * Installs or uninstalls in-tree Git hooks via core.hooksPath.
 *
 * @param {Object}  options
 * @param {string}  [options.root]      Repository root directory.
 * @param {boolean} [options.uninstall] Whether to unset core.hooksPath.
 * @param {boolean} [options.quiet]     Whether to suppress logs.
 * @return {{ success: boolean, skipped?: boolean, uninstalled?: boolean, hooksPath?: string, error?: string, reason?: string }} Result.
 */
export function installHooks( options = {} ) {
	const root = resolve( options.root || process.cwd() );
	const uninstall = Boolean( options.uninstall );
	const quiet = Boolean( options.quiet );

	if ( ! isGitRepository( root ) ) {
		if ( ! quiet ) {
			console.log(
				'ℹ️  Not a git repository; skipping git hooks setup.'
			);
		}
		return {
			success: true,
			skipped: true,
			reason: 'Not a git repository',
		};
	}

	if ( uninstall ) {
		try {
			spawnSync( 'git', [ 'config', '--unset', 'core.hooksPath' ], {
				cwd: root,
				stdio: 'pipe',
			} );
			if ( ! quiet ) {
				console.log(
					'✅ Uninstalled git hooks (unset core.hooksPath).'
				);
			}
			return { success: true, uninstalled: true };
		} catch ( error ) {
			const message =
				error instanceof Error ? error.message : String( error );
			if ( ! quiet ) {
				console.error(
					`❌ Failed to uninstall git hooks: ${ message }`
				);
			}
			return { success: false, error: message };
		}
	}

	const hookPath = resolve( root, '.githooks/pre-commit' );
	if ( ! existsSync( hookPath ) ) {
		const errorMsg = `Pre-commit hook script not found at ${ hookPath }`;
		if ( ! quiet ) {
			console.error( `❌ ${ errorMsg }` );
		}
		return { success: false, error: errorMsg };
	}

	// Make executable on POSIX systems
	if ( process.platform !== 'win32' ) {
		try {
			chmodSync( hookPath, 0o755 );
		} catch {
			// Ignore chmod errors on systems that don't support it
		}
	}

	const res = spawnSync(
		'git',
		[ 'config', 'core.hooksPath', '.githooks' ],
		{
			cwd: root,
			stdio: 'pipe',
			encoding: 'utf-8',
		}
	);

	if ( res.status !== 0 ) {
		const errorMsg =
			res.stderr?.trim() ||
			'Failed to set core.hooksPath in git config';
		if ( ! quiet ) {
			console.error( `❌ ${ errorMsg }` );
		}
		return { success: false, error: errorMsg };
	}

	if ( ! quiet ) {
		console.log(
			'✅ Configured git hooks (core.hooksPath = .githooks).'
		);
	}

	return { success: true, hooksPath: '.githooks' };
}

// CLI entry point
const isDirectCall =
	process.argv[ 1 ] &&
	resolve( process.argv[ 1 ] ) === resolve( new URL( import.meta.url ).pathname );

if ( isDirectCall ) {
	const { values } = parseArgs( {
		options: {
			root: { type: 'string', default: process.cwd() },
			uninstall: { type: 'boolean', default: false },
			quiet: { type: 'boolean', short: 'q', default: false },
			help: { type: 'boolean', short: 'h', default: false },
		},
		strict: true,
	} );

	if ( values.help ) {
		console.log( HELP.trim() );
		process.exit( 0 );
	}

	const result = installHooks( {
		root: values.root,
		uninstall: values.uninstall,
		quiet: values.quiet,
	} );

	process.exit( result.success ? 0 : 1 );
}
