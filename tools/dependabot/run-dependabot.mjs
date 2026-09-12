#!/usr/bin/env node

/**
 * Local Dependabot CLI Runner for AI-Ready WP Plugin Boilerplate.
 *
 * Runs official GitHub Dependabot CLI update checks purely in the local
 * workspace environment, resolving dependency updates and diagnosing issues
 * without modifying remote GitHub branches or opening remote pull requests.
 *
 * @license MIT
 */

import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { delimiter, isAbsolute, join, resolve } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';
import yaml from 'js-yaml';

const DEFAULT_CONFIG_PATH = '.github/dependabot.yml';
const DEFAULT_REPO_NAME = 'blackandcode/ai-ready-wp-plugin-boilerplate';

/**
 * Ecosystem name translation between .github/dependabot.yml and Dependabot CLI core names.
 */
export const ECOSYSTEM_MAP = {
	'github-actions': 'github_actions',
	github_actions: 'github_actions',
	npm: 'npm_and_yarn',
	npm_and_yarn: 'npm_and_yarn',
	composer: 'composer',
};

/**
 * Map of Dependabot core ecosystem names back to user-friendly display labels.
 */
export const ECOSYSTEM_LABELS = {
	github_actions: 'GitHub Actions Workflows',
	npm_and_yarn: 'npm Runtime & Dev Dependencies',
	composer: 'Composer PHP Dependencies',
};

const HELP_TEXT = `
Usage:
  npm run dependabot [options]
  node tools/dependabot/run-dependabot.mjs [options]

Runs local Dependabot dependency checks across configured ecosystems using dependabot/cli.
All checks are performed locally against the current workspace (--local .); no remote GitHub
branches, commits, or pull requests are created.

Options:
  -e, --ecosystem <name>  Filter checks to a single ecosystem:
                          github-actions (github_actions), npm (npm_and_yarn), composer
  -d, --dep <name>        Target a specific dependency name for update check
      --config <path>     Path to dependabot.yml configuration file (default: .github/dependabot.yml)
      --repo <name>       Repository owner/name for context (default: blackandcode/ai-ready-wp-plugin-boilerplate)
      --dry-run           Validate prerequisites and configuration without starting containers
  -h, --help              Show this help message and command guidance
`;

/**
 * Securely resolves a GitHub access token from environment or GitHub CLI (gh).
 *
 * The token is used solely by the Dependabot local proxy to prevent 403 Rate Limit
 * errors on api.github.com during release and commit checks.
 *
 * @param {object} [env=process.env] Environment variables map
 * @param {Function} [execFn=execSync] Synchronous command execution function
 * @return {{ token: string | null, source: string | null }} Token and source description
 */
export function resolveGitHubToken( env = process.env, execFn = execSync ) {
	if ( env.LOCAL_GITHUB_ACCESS_TOKEN && env.LOCAL_GITHUB_ACCESS_TOKEN.trim() ) {
		return {
			token: env.LOCAL_GITHUB_ACCESS_TOKEN.trim(),
			source: 'LOCAL_GITHUB_ACCESS_TOKEN',
		};
	}

	if ( env.GITHUB_TOKEN && env.GITHUB_TOKEN.trim() ) {
		return {
			token: env.GITHUB_TOKEN.trim(),
			source: 'GITHUB_TOKEN',
		};
	}

	if ( env.GH_TOKEN && env.GH_TOKEN.trim() ) {
		return {
			token: env.GH_TOKEN.trim(),
			source: 'GH_TOKEN',
		};
	}

	try {
		const stdout = execFn( 'gh auth token', {
			encoding: 'utf8',
			stdio: [ 'ignore', 'pipe', 'ignore' ],
		} );
		const token = ( stdout || '' ).trim();
		if ( token ) {
			return {
				token,
				source: 'gh_cli',
			};
		}
	} catch {
		// gh CLI not available or not logged in.
	}

	return {
		token: null,
		source: null,
	};
}

/**
 * Discovers the dependabot executable binary path.
 *
 * @param {string[]} [searchPaths] Candidate paths to inspect
 * @param {object} [env=process.env] Environment variables
 * @return {string | null} Path to dependabot binary, or null if not found
 */
export function findDependabotBinary( searchPaths, env = process.env ) {
	const candidates = searchPaths || [
		join( homedir(), '.local/bin/dependabot' ),
		'/usr/local/bin/dependabot',
		'/usr/bin/dependabot',
	];

	for ( const candidate of candidates ) {
		if ( existsSync( candidate ) ) {
			return candidate;
		}
	}

	const pathDirs = ( env.PATH || '' ).split( delimiter );
	for ( const dir of pathDirs ) {
		if ( ! dir ) continue;
		const fullPath = join( dir, 'dependabot' );
		if ( existsSync( fullPath ) ) {
			return fullPath;
		}
	}

	return null;
}

/**
 * Validates system prerequisites (dependabot CLI binary and Docker daemon).
 *
 * @param {object} options Options
 * @param {Function} [options.execFn=execSync] Execution function
 * @param {object} [options.env=process.env] Environment variables
 * @return {{ ok: boolean, dependabotPath: string | null, dockerRunning: boolean, errors: string[] }}
 */
export function checkPrerequisites( { execFn = execSync, env = process.env } = {} ) {
	const errors = [];
	const dependabotPath = findDependabotBinary( undefined, env );

	if ( ! dependabotPath ) {
		errors.push(
			'dependabot binary not found. Install it to ~/.local/bin/dependabot or ensure it is on $PATH.'
		);
	}

	let dockerRunning = false;
	try {
		execFn( 'docker info', {
			encoding: 'utf8',
			stdio: [ 'ignore', 'ignore', 'ignore' ],
		} );
		dockerRunning = true;
	} catch {
		errors.push(
			'Docker daemon is not accessible. Ensure Docker service is running (e.g. "sudo service docker start" or Docker Desktop).'
		);
	}

	return {
		ok: errors.length === 0,
		dependabotPath,
		dockerRunning,
		errors,
	};
}

/**
 * Translates a package ecosystem name to Dependabot CLI package manager name.
 *
 * @param {string} ecosystem Input ecosystem name
 * @return {string} Canonical Dependabot CLI package manager name
 */
export function getEcosystemMapping( ecosystem ) {
	if ( ! ecosystem ) return '';
	const key = ecosystem.trim().toLowerCase();
	return ECOSYSTEM_MAP[ key ] || key.replace( /-/g, '_' );
}

/**
 * Reads and parses the .github/dependabot.yml configuration file.
 *
 * @param {string} configPath Path to dependabot.yml
 * @param {string} [rootPath=process.cwd()] Root directory
 * @return {{ version: number, updates: Array<{ packageEcosystem: string, directory: string, schedule: object, ignore: Array<object>, openPullRequestsLimit: number }> }}
 */
export function loadDependabotConfig( configPath, rootPath = process.cwd() ) {
	const absolutePath = isAbsolute( configPath )
		? configPath
		: resolve( rootPath, configPath );

	if ( ! existsSync( absolutePath ) ) {
		throw new Error( `Dependabot configuration file not found: ${ absolutePath }` );
	}

	const rawContent = readFileSync( absolutePath, 'utf8' );
	const parsed = yaml.load( rawContent );

	if ( ! parsed || ! Array.isArray( parsed.updates ) ) {
		throw new Error(
			`Invalid Dependabot configuration in ${ absolutePath }: missing "updates" array.`
		);
	}

	return {
		version: parsed.version || 2,
		updates: parsed.updates.map( ( item ) => ( {
			packageEcosystem: item[ 'package-ecosystem' ] || item.packageEcosystem || '',
			directory: item.directory || '/',
			schedule: item.schedule || {},
			commitMessage: item[ 'commit-message' ] || {},
			allow: Array.isArray( item.allow ) ? item.allow : [],
			ignore: Array.isArray( item.ignore ) ? item.ignore : [],
			openPullRequestsLimit: item[ 'open-pull-requests-limit' ] ?? 10,
		} ) ),
	};
}

/**
 * Determines the repository name from git remote or defaults.
 *
 * @param {string} [fallback=DEFAULT_REPO_NAME] Fallback repository name
 * @param {Function} [execFn=execSync] Synchronous exec function
 * @return {string} Repository name in owner/repo format
 */
export function detectRepoName( fallback = DEFAULT_REPO_NAME, execFn = execSync ) {
	try {
		const remoteUrl = execFn( 'git config --get remote.origin.url', {
			encoding: 'utf8',
			stdio: [ 'ignore', 'pipe', 'ignore' ],
		} ).trim();

		const match = remoteUrl.match( /github\.com[:/]([^/]+\/[^/.]+?)(\.git)?$/ );
		if ( match && match[ 1 ] ) {
			return match[ 1 ];
		}
	} catch {
		// Not a git repo or no origin remote configured.
	}
	return fallback;
}

/**
 * Generates a Dependabot job definition object from ecosystem configuration.
 *
 * @param {object} options Configuration options
 * @param {string} options.ecosystem Canonical Dependabot package manager
 * @param {string} [options.repo=DEFAULT_REPO_NAME] Repository name
 * @param {string} [options.directory='/'] Directory inside repository
 * @param {Array<object>} [options.allow=[]] Allow rules from dependabot.yml
 * @param {Array<object>} [options.ignore=[]] Ignore rules from dependabot.yml
 * @param {string} [options.dep] Optional single dependency filter
 * @return {object} Structured job description matching Dependabot CLI schema
 */
export function generateJobDefinition( {
	ecosystem,
	repo = DEFAULT_REPO_NAME,
	directory = '/',
	allow = [],
	ignore = [],
	dep,
} ) {
	let allowedUpdates = [ { 'update-type': 'all' } ];
	if ( Array.isArray( allow ) && allow.length > 0 ) {
		allowedUpdates = allow.map( ( item ) => {
			const a = {};
			if ( item[ 'dependency-type' ] ) a[ 'dependency-type' ] = item[ 'dependency-type' ];
			if ( item[ 'dependency-name' ] ) a[ 'dependency-name' ] = item[ 'dependency-name' ];
			if ( item[ 'update-types' ] ) a[ 'update-types' ] = item[ 'update-types' ];
			return Object.keys( a ).length > 0 ? a : { 'update-type': 'all' };
		} );
	}

	const job = {
		'package-manager': ecosystem,
		'allowed-updates': allowedUpdates,
		source: {
			provider: 'github',
			repo,
			directory: directory || '/',
		},
	};

	if ( Array.isArray( ignore ) && ignore.length > 0 ) {
		const ignoreConditions = [];
		for ( const item of ignore ) {
			const depName = item[ 'dependency-name' ] || item.dependencyName;
			if ( ! depName ) continue;

			if ( Array.isArray( item.versions ) && item.versions.length > 0 ) {
				for ( const ver of item.versions ) {
					ignoreConditions.push( {
						'dependency-name': depName,
						'version-requirement': ver,
						source: 'dependabot.yml',
					} );
				}
			} else if ( item.versions ) {
				ignoreConditions.push( {
					'dependency-name': depName,
					'version-requirement': item.versions,
					source: 'dependabot.yml',
				} );
			}

			if ( item[ 'update-types' ] ) {
				ignoreConditions.push( {
					'dependency-name': depName,
					'update-types': Array.isArray( item[ 'update-types' ] )
						? item[ 'update-types' ]
						: [ item[ 'update-types' ] ],
					source: 'dependabot.yml',
				} );
			}

			if ( ! item.versions && ! item[ 'update-types' ] ) {
				ignoreConditions.push( {
					'dependency-name': depName,
					source: 'dependabot.yml',
				} );
			}
		}

		if ( ignoreConditions.length > 0 ) {
			job[ 'ignore-conditions' ] = ignoreConditions;
		}
	}

	if ( dep ) {
		job.dependencies = [ dep ];
	}

	return {
		job,
	};
}

/**
 * Constructs command-line arguments for running dependabot update.
 *
 * @param {object} options Configuration options
 * @param {string} [options.ecosystem] Canonical Dependabot package manager
 * @param {string} [options.repo=DEFAULT_REPO_NAME] Repository name
 * @param {string} [options.localDir='.'] Local directory to mount
 * @param {string} [options.dep] Optional single dependency filter
 * @param {string} [options.directory='/'] Directory inside repository
 * @param {string} [options.jobFile] Path to input job definition YAML file
 * @return {string[]} Array of CLI arguments
 */
export function buildDependabotArgs( {
	ecosystem,
	repo = DEFAULT_REPO_NAME,
	localDir = '.',
	dep,
	directory = '/',
	jobFile,
} ) {
	if ( jobFile ) {
		return [ 'update', '-f', jobFile, '--local', localDir ];
	}

	const args = [ 'update', ecosystem, repo, '--local', localDir ];

	if ( directory && directory !== '/' ) {
		args.push( '--directory', directory );
	}

	if ( dep ) {
		args.push( '--dep', dep );
	}

	return args;
}

/**
 * Parses dependabot CLI output to extract pull requests created and key metrics.
 *
 * @param {string} output Combined stdout and stderr text
 * @return {{ created: Array<{ name: string, from: string, to: string }>, errors: string[], noUpdatePossible: string[] }}
 */
export function parseDependabotOutput( output ) {
	const created = [];
	const errors = [];
	const noUpdatePossible = [];

	if ( ! output ) {
		return { created, errors, noUpdatePossible };
	}

	// Match results table rows: "| created | <name> ( from <v1> to <v2> ) |"
	const tableRowRegex = /\|\s*created\s*\|\s*([^\s(]+)\s*\(\s*from\s+([^\s)]+)\s+to\s+([^\s)]+)\s*\)\s*\|/g;
	let match;
	while ( ( match = tableRowRegex.exec( output ) ) !== null ) {
		created.push( {
			name: match[ 1 ].trim(),
			from: match[ 2 ].trim(),
			to: match[ 3 ].trim(),
		} );
	}

	// Match updater error lines, filtering out internal Ruby/sorbet stack traces
	const errorRegex = /updater\s*\|\s*(?:\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+)?(?:ERROR|FATAL)\s+(.+)/g;
	let errMatch;
	while ( ( errMatch = errorRegex.exec( output ) ) !== null ) {
		const msg = errMatch[ 1 ].trim();
		// Skip internal gem/file stack traces like /home/dependabot/... or lib/types/...
		if ( ! msg.startsWith( '/' ) && ! msg.includes( '.rb:' ) && ! errors.includes( msg ) ) {
			errors.push( msg );
		}
	}

	// Match dependencies where update is blocked
	const blockedRegex = /No update possible for\s+([^\s]+)\s+([^\s\n]+)/g;
	let blockMatch;
	while ( ( blockMatch = blockedRegex.exec( output ) ) !== null ) {
		noUpdatePossible.push( `${ blockMatch[ 1 ] }@${ blockMatch[ 2 ] }` );
	}

	return { created, errors, noUpdatePossible };
}

/**
 * Executes a single Dependabot update job using child_process.spawn.
 *
 * @param {object} options Job options
 * @param {string} options.dependabotPath Path to dependabot binary
 * @param {string[]} options.args Arguments array
 * @param {string | null} [options.token=null] GitHub access token
 * @param {object} [options.env=process.env] Base environment
 * @param {boolean} [options.silent=false] Whether to suppress streaming output
 * @return {Promise<{ exitCode: number, output: string }>} Result of execution
 */
export function executeDependabotJob( {
	dependabotPath,
	args,
	token = null,
	env = process.env,
	silent = false,
} ) {
	return new Promise( ( resolvePromise ) => {
		const runEnv = {
			...env,
			FAKE_API_HOST: env.FAKE_API_HOST || '127.0.0.1',
		};

		if ( token ) {
			runEnv.LOCAL_GITHUB_ACCESS_TOKEN = token;
		}

		// Ensure ~/.local/bin is in PATH for container orchestration tools
		const localBin = join( homedir(), '.local/bin' );
		if ( ! ( runEnv.PATH || '' ).includes( localBin ) ) {
			runEnv.PATH = `${ localBin }:${ runEnv.PATH || '' }`;
		}

		const child = spawn( dependabotPath, args, {
			env: runEnv,
			stdio: [ 'ignore', 'pipe', 'pipe' ],
		} );

		let output = '';

		child.stdout.on( 'data', ( chunk ) => {
			const str = chunk.toString();
			output += str;
			if ( ! silent ) {
				process.stdout.write( str );
			}
		} );

		child.stderr.on( 'data', ( chunk ) => {
			const str = chunk.toString();
			output += str;
			if ( ! silent ) {
				process.stderr.write( str );
			}
		} );

		child.on( 'close', ( code ) => {
			resolvePromise( {
				exitCode: code ?? 0,
				output,
			} );
		} );

		child.on( 'error', ( err ) => {
			output += `\nSpawn error: ${ err.message }`;
			resolvePromise( {
				exitCode: 1,
				output,
			} );
		} );
	} );
}

/**
 * CLI Entry point.
 *
 * @param {string[]} [rawArgs=process.argv.slice(2)] Command line arguments
 * @return {Promise<number>} Exit code (0 for success, non-zero for failure)
 */
export async function runCli( rawArgs = process.argv.slice( 2 ) ) {
	const options = {
		ecosystem: { type: 'string', short: 'e' },
		dep: { type: 'string', short: 'd' },
		config: { type: 'string', default: DEFAULT_CONFIG_PATH },
		repo: { type: 'string' },
		'dry-run': { type: 'boolean', default: false },
		help: { type: 'boolean', short: 'h', default: false },
	};

	let parsedArgs;
	try {
		parsedArgs = parseArgs( { args: rawArgs, options, allowPositionals: true } );
	} catch ( err ) {
		console.error( `❌ Argument parsing error: ${ err.message }\n` );
		console.log( HELP_TEXT );
		return 1;
	}

	const { values } = parsedArgs;

	if ( values.help ) {
		console.log( HELP_TEXT );
		return 0;
	}

	console.log( '🤖 Dependabot Local Environment Runner' );
	console.log( '======================================' );

	// 1. Resolve GitHub Token
	const { token, source: tokenSource } = resolveGitHubToken();
	if ( token ) {
		console.log( `🔑 Authenticated via GitHub token source: [${ tokenSource }]` );
	} else {
		console.warn(
			'⚠️  No GitHub token found in env (LOCAL_GITHUB_ACCESS_TOKEN/GITHUB_TOKEN/GH_TOKEN) or gh CLI.'
		);
		console.warn(
			'   Unauthenticated requests may encounter GitHub API 60 req/hr rate limits.'
		);
	}

	// 2. Check Prerequisites
	const prereqs = checkPrerequisites();
	if ( ! prereqs.ok ) {
		console.error( '\n❌ Prerequisites check failed:' );
		for ( const error of prereqs.errors ) {
			console.error( `   - ${ error }` );
		}
		return 1;
	}
	console.log( `✅ Dependabot binary found: ${ prereqs.dependabotPath }` );
	console.log( '✅ Docker daemon is running and responsive.' );

	// 3. Load Dependabot Config
	let config;
	try {
		config = loadDependabotConfig( values.config );
		console.log( `✅ Loaded config: ${ values.config } (v${ config.version })` );
	} catch ( err ) {
		console.error( `\n❌ Failed to load Dependabot configuration: ${ err.message }` );
		return 1;
	}

	// 4. Resolve Target Ecosystems
	const configuredEcosystems = config.updates.map( ( u ) => ( {
		original: u.packageEcosystem,
		cliName: getEcosystemMapping( u.packageEcosystem ),
		directory: u.directory,
		allow: u.allow || [],
		ignore: u.ignore || [],
		ignoreCount: ( u.ignore || [] ).length,
	} ) );

	let targetEcosystems = configuredEcosystems;

	if ( values.ecosystem ) {
		const filteredCliName = getEcosystemMapping( values.ecosystem );
		targetEcosystems = configuredEcosystems.filter(
			( e ) => e.cliName === filteredCliName || e.original === values.ecosystem
		);

		if ( targetEcosystems.length === 0 ) {
			console.error(
				`\n❌ Unknown or unconfigured ecosystem: "${ values.ecosystem }"`
			);
			console.error(
				`   Configured ecosystems in ${ values.config }: ${ configuredEcosystems.map( ( e ) => e.original ).join( ', ' ) }`
			);
			return 1;
		}
	}

	const repoName = values.repo || detectRepoName();
	console.log( `📦 Target repository context: ${ repoName }` );
	console.log(
		`🔍 Ecosystems to evaluate: ${ targetEcosystems.map( ( e ) => `${ e.original } [${ e.cliName }]` ).join( ', ' ) }\n`
	);

	if ( values[ 'dry-run' ] ) {
		console.log( '✨ Dry run requested. Prerequisites and configuration are valid.' );
		return 0;
	}

	// 5. Execute Update Checks Sequentially
	const summaryResults = [];
	let hasFailures = false;

	for ( const eco of targetEcosystems ) {
		const label = ECOSYSTEM_LABELS[ eco.cliName ] || eco.original;
		console.log( '------------------------------------------------------' );
		console.log( `🚀 Running Dependabot checks for: ${ label } (${ eco.cliName })` );
		console.log( '------------------------------------------------------' );

		let tempJobPath = null;
		let args;

		if ( ( eco.ignore && eco.ignore.length > 0 ) || ( eco.allow && eco.allow.length > 0 ) ) {
			const jobDef = generateJobDefinition( {
				ecosystem: eco.cliName,
				repo: repoName,
				directory: eco.directory,
				allow: eco.allow,
				ignore: eco.ignore,
				dep: values.dep,
			} );
			tempJobPath = join( tmpdir(), `dependabot-job-${ eco.cliName }-${ Date.now() }.yml` );
			writeFileSync( tempJobPath, yaml.dump( jobDef ), 'utf8' );
			args = buildDependabotArgs( {
				jobFile: tempJobPath,
				localDir: '.',
			} );
		} else {
			args = buildDependabotArgs( {
				ecosystem: eco.cliName,
				repo: repoName,
				localDir: '.',
				dep: values.dep,
				directory: eco.directory,
			} );
		}

		console.log( `Command: dependabot ${ args.join( ' ' ) }\n` );

		let result;
		try {
			const startTime = Date.now();
			result = await executeDependabotJob( {
				dependabotPath: prereqs.dependabotPath,
				args,
				token,
			} );
			const duration = Math.round( ( Date.now() - startTime ) / 1000 );

			const parsed = parseDependabotOutput( result.output );
			const isSuccess = result.exitCode === 0 && parsed.errors.length === 0;

			if ( ! isSuccess ) {
				hasFailures = true;
			}

			summaryResults.push( {
				ecosystem: eco.original,
				cliName: eco.cliName,
				status: isSuccess ? 'PASS' : 'FAIL',
				exitCode: result.exitCode,
				duration: `${ duration }s`,
				createdCount: parsed.created.length,
				created: parsed.created,
				errors: parsed.errors,
			} );

			console.log( `\nFinished ${ eco.original } in ${ duration }s (exit code: ${ result.exitCode })` );
			if ( parsed.created.length > 0 ) {
				console.log( 'Created PR proposals locally:' );
				for ( const pr of parsed.created ) {
					console.log( `  - ${ pr.name }: from ${ pr.from } to ${ pr.to }` );
				}
			}
			if ( parsed.errors.length > 0 ) {
				console.error( 'Errors encountered:' );
				for ( const err of parsed.errors ) {
					console.error( `  - ${ err }` );
				}
			}
			console.log();
		} finally {
			if ( tempJobPath ) {
				try {
					unlinkSync( tempJobPath );
				} catch {}
			}
		}
	}

	// 6. Print Overall Summary Table
	console.log( '======================================================' );
	console.log( '📊 Dependabot Local Execution Summary' );
	console.log( '======================================================' );
	for ( const s of summaryResults ) {
		const icon = s.status === 'PASS' ? '✅' : '❌';
		console.log(
			`${ icon } ${ s.ecosystem.padEnd( 16 ) } | Status: ${ s.status.padEnd( 4 ) } | Exit: ${ s.exitCode } | Duration: ${ s.duration.padEnd( 5 ) } | PRs: ${ s.createdCount }`
		);
	}
	console.log( '======================================================' );

	if ( hasFailures ) {
		console.error( '\n❌ One or more Dependabot ecosystem checks reported errors.' );
		return 1;
	}

	console.log( '\n🎉 All Dependabot checks completed successfully with zero unhandled errors!' );
	return 0;
}

// Execute CLI when called directly
const isDirectExecution =
	process.argv[ 1 ] &&
	resolve( process.argv[ 1 ] ) === resolve( new URL( import.meta.url ).pathname );

if ( isDirectExecution ) {
	runCli().then( ( exitCode ) => {
		process.exitCode = exitCode;
	} );
}
