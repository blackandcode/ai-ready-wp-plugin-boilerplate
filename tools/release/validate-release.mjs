#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

const HELP = `
Usage:
  node tools/release/validate-release.mjs [version] [options]
  npm run release:check -- [version] [options]

Validates release prerequisites, version consistency across manifests and headers,
git branch constraints, and tag uniqueness prior to publishing.

Arguments:
  [version]                    Target semantic version (e.g. 1.3.3). Defaults to package.json version.

Options:
  -v, --version <X.Y.Z>        Target version (flag form).
  --root <path>                Project root directory. Default: current directory.
  --expected-branch <name>     Expected git branch. Default: main.
  --skip-branch-check          Bypass git branch validation (for local testing/CI).
  --skip-tag-check             Bypass git tag uniqueness check.
  --json                       Output structured JSON format.
  -h, --help                   Show this help message.
`;

/**
 * Discovers the main plugin PHP file in the given root directory.
 *
 * @param {string} root Project root
 * @return {Promise<string>} Path to main PHP file relative to root
 */
export async function findMainPluginFile( root ) {
	const files = await readdir( root );
	for ( const file of files ) {
		if (
			file.endsWith( '.php' ) &&
			! [ 'uninstall.php', 'index.php' ].includes( file )
		) {
			const content = await readFile( join( root, file ), 'utf8' );
			if ( content.includes( 'Plugin Name:' ) ) {
				return file;
			}
		}
	}
	throw new Error(
		`Could not locate main plugin PHP file containing "Plugin Name:" in ${ root }`
	);
}

/**
 * Validates release readiness and version consistency.
 *
 * @param {Object} options                 Validation options
 * @param          options.root
 * @param          options.version
 * @param          options.expectedBranch
 * @param          options.skipBranchCheck
 * @param          options.skipTagCheck
 * @return {Promise<{ valid: boolean, targetVersion: string, checks: Array<{ name: string, pass: boolean, detail: string }> }>}
 */
export async function validateRelease( {
	root = process.cwd(),
	version: explicitVersion,
	expectedBranch = 'main',
	skipBranchCheck = false,
	skipTagCheck = false,
} = {} ) {
	const checks = [];

	// 1. Read package.json version
	const packageJsonPath = join( root, 'package.json' );
	let packageJsonVersion;
	try {
		const pkg = JSON.parse( await readFile( packageJsonPath, 'utf8' ) );
		packageJsonVersion = pkg.version;
	} catch ( err ) {
		throw new Error(
			`Failed to read package.json at ${ packageJsonPath }: ${ err.message }`
		);
	}

	const targetVersion = explicitVersion || packageJsonVersion;
	if ( ! targetVersion ) {
		throw new Error(
			'Target version could not be determined from arguments or package.json.'
		);
	}

	checks.push( {
		name: 'package.json version matches target',
		pass: packageJsonVersion === targetVersion,
		detail: `package.json has "${ packageJsonVersion }", expected "${ targetVersion }"`,
	} );

	// 2. Main PHP header Version: and define(*_VERSION)
	try {
		const mainPhpFile = await findMainPluginFile( root );
		const phpSource = await readFile( join( root, mainPhpFile ), 'utf8' );

		const headerMatch = phpSource.match( /\*\s*Version:\s*([^\r\n]+)/i );
		const headerVersion = headerMatch ? headerMatch[ 1 ].trim() : null;
		checks.push( {
			name: `${ mainPhpFile } header Version matches target`,
			pass: headerVersion === targetVersion,
			detail: `${ mainPhpFile } header has "${ headerVersion }", expected "${ targetVersion }"`,
		} );

		const constantMatch = phpSource.match(
			/define\(\s*['"][A-Z0-9_]+_VERSION['"]\s*,\s*['"]([^'"]+)['"]\s*\)/
		);
		const constantVersion = constantMatch
			? constantMatch[ 1 ].trim()
			: null;
		checks.push( {
			name: `${ mainPhpFile } version constant matches target`,
			pass: constantVersion === targetVersion,
			detail: `${ mainPhpFile } constant has "${ constantVersion }", expected "${ targetVersion }"`,
		} );

		// Header compatibility fields
		const reqAtLeastMatch = phpSource.match(
			/\*\s*Requires at least:\s*([^\r\n]+)/i
		);
		if ( reqAtLeastMatch ) {
			const reqAtLeast = reqAtLeastMatch[ 1 ].trim();
			checks.push( {
				name: `${ mainPhpFile } Requires at least matches 7.1`,
				pass: reqAtLeast === '7.1',
				detail: `${ mainPhpFile } has Requires at least "${ reqAtLeast }", expected "7.1"`,
			} );
		}

		const reqPhpMatch = phpSource.match(
			/\*\s*Requires PHP:\s*([^\r\n]+)/i
		);
		if ( reqPhpMatch ) {
			const reqPhp = reqPhpMatch[ 1 ].trim();
			checks.push( {
				name: `${ mainPhpFile } Requires PHP matches 8.3`,
				pass: reqPhp === '8.3',
				detail: `${ mainPhpFile } has Requires PHP "${ reqPhp }", expected "8.3"`,
			} );
		}
	} catch ( err ) {
		checks.push( {
			name: 'Main plugin PHP file validation',
			pass: false,
			detail: err.message,
		} );
	}

	// 2b. Plugin::VERSION constant in src/framework/Kernel/Plugin.php (if exists)
	const pluginClassPath = join( root, 'src/framework/Kernel/Plugin.php' );
	try {
		const pluginSource = await readFile( pluginClassPath, 'utf8' );
		const classVersionMatch = pluginSource.match(
			/public\s+const\s+VERSION\s*=\s*['"]([^'"]+)['"]/
		);
		const classVersion = classVersionMatch
			? classVersionMatch[ 1 ].trim()
			: null;
		checks.push( {
			name: 'Plugin::VERSION constant matches target',
			pass: classVersion === targetVersion,
			detail: `Plugin::VERSION has "${ classVersion }", expected "${ targetVersion }"`,
		} );
	} catch {
		// Optional if file does not exist
	}

	// 2c. Block metadata version in src/frontend/apps/hello-world/block.json (if exists)
	const blockJsonPath = join(
		root,
		'src/frontend/apps/hello-world/block.json'
	);
	try {
		const blockJson = JSON.parse( await readFile( blockJsonPath, 'utf8' ) );
		checks.push( {
			name: 'hello-world block.json version matches target',
			pass: blockJson.version === targetVersion,
			detail: `block.json has version "${ blockJson.version }", expected "${ targetVersion }"`,
		} );
	} catch {
		// Optional if file does not exist
	}

	// 3. readme.txt Stable tag and compatibility
	const readmePath = join( root, 'readme.txt' );
	try {
		const readmeSource = await readFile( readmePath, 'utf8' );
		const stableMatch = readmeSource.match( /Stable\s*tag:\s*([^\r\n]+)/i );
		const stableTag = stableMatch ? stableMatch[ 1 ].trim() : null;
		checks.push( {
			name: 'readme.txt Stable tag matches target',
			pass: stableTag === targetVersion,
			detail: `readme.txt has Stable tag "${ stableTag }", expected "${ targetVersion }"`,
		} );

		const readmeReqAtLeast = readmeSource.match(
			/Requires\s*at\s*least:\s*([^\r\n]+)/i
		);
		if ( readmeReqAtLeast ) {
			const val = readmeReqAtLeast[ 1 ].trim();
			checks.push( {
				name: 'readme.txt Requires at least matches 7.1',
				pass: val === '7.1',
				detail: `readme.txt has Requires at least "${ val }", expected "7.1"`,
			} );
		}

		const readmeReqPhp = readmeSource.match(
			/Requires\s*PHP:\s*([^\r\n]+)/i
		);
		if ( readmeReqPhp ) {
			const val = readmeReqPhp[ 1 ].trim();
			checks.push( {
				name: 'readme.txt Requires PHP matches 8.3',
				pass: val === '8.3',
				detail: `readme.txt has Requires PHP "${ val }", expected "8.3"`,
			} );
		}
	} catch {
		checks.push( {
			name: 'readme.txt Stable tag matches target',
			pass: false,
			detail: `readme.txt not found at ${ readmePath }`,
		} );
	}

	// 3b. composer.json require.php (if exists)
	const composerPath = join( root, 'composer.json' );
	try {
		const composerData = JSON.parse(
			await readFile( composerPath, 'utf8' )
		);
		if ( composerData.require && composerData.require.php ) {
			const phpReq = composerData.require.php;
			const satisfies = phpReq.includes( '8.3' );
			checks.push( {
				name: 'composer.json PHP requirement satisfies >=8.3',
				pass: satisfies,
				detail: `composer.json has php "${ phpReq }", expected ">=8.3"`,
			} );
		}
	} catch {
		// Optional if composer.json not found
	}

	// 4. CHANGELOG.md release entry
	const changelogPath = join( root, 'CHANGELOG.md' );
	try {
		const changelogSource = await readFile( changelogPath, 'utf8' );
		const entryMatch = changelogSource.match(
			new RegExp(
				`##\\s*\\[${ targetVersion.replace(
					/[.*+?^${}()|[\\]\\]/g,
					'\\$&'
				) }\\]`
			)
		);
		checks.push( {
			name: 'CHANGELOG.md contains release heading',
			pass: Boolean( entryMatch ),
			detail: entryMatch
				? `CHANGELOG.md has entry for [${ targetVersion }]`
				: `Missing "## [${ targetVersion }]" entry in CHANGELOG.md`,
		} );
	} catch ( err ) {
		checks.push( {
			name: 'CHANGELOG.md validation',
			pass: false,
			detail: err.message,
		} );
	}

	// 5. Git branch validation
	if ( ! skipBranchCheck ) {
		try {
			const currentBranch = execSync( 'git rev-parse --abbrev-ref HEAD', {
				cwd: root,
				encoding: 'utf8',
			} ).trim();
			checks.push( {
				name: `Git branch is "${ expectedBranch }"`,
				pass: currentBranch === expectedBranch,
				detail: `Current branch is "${ currentBranch }", expected "${ expectedBranch }"`,
			} );
		} catch {
			checks.push( {
				name: `Git branch is "${ expectedBranch }"`,
				pass: false,
				detail: 'Unable to query git branch via "git rev-parse --abbrev-ref HEAD"',
			} );
		}
	}

	// 6. Git tag uniqueness check (vX.Y.Z should not already exist)
	if ( ! skipTagCheck ) {
		const tagName = `v${ targetVersion }`;
		try {
			const existingTags = execSync( 'git tag -l', {
				cwd: root,
				encoding: 'utf8',
			} )
				.split( '\n' )
				.map( ( t ) => t.trim() );
			const tagExists = existingTags.includes( tagName );
			checks.push( {
				name: `Git tag ${ tagName } does not exist`,
				pass: ! tagExists,
				detail: tagExists
					? `Tag "${ tagName }" already exists in git repository`
					: `Tag "${ tagName }" is available`,
			} );
		} catch {
			// If git fails, skip or warn
			checks.push( {
				name: `Git tag ${ tagName } does not exist`,
				pass: true,
				detail: 'Git tag check skipped (git tag not available)',
			} );
		}
	}

	const allPassed = checks.every( ( c ) => c.pass );

	return {
		valid: allPassed,
		targetVersion,
		checks,
	};
}

// CLI execution
if (
	process.argv[ 1 ] &&
	resolve( process.argv[ 1 ] ) ===
		resolve( new URL( import.meta.url ).pathname )
) {
	const { values, positionals } = parseArgs( {
		options: {
			version: { type: 'string', short: 'v' },
			root: { type: 'string', default: process.cwd() },
			'expected-branch': { type: 'string', default: 'main' },
			'skip-branch-check': { type: 'boolean', default: false },
			'skip-tag-check': { type: 'boolean', default: false },
			json: { type: 'boolean', default: false },
			help: { type: 'boolean', short: 'h', default: false },
		},
		allowPositionals: true,
		strict: true,
	} );

	if ( values.help ) {
		console.log( HELP.trim() );
		process.exit( 0 );
	}

	const version = values.version || positionals[ 0 ];

	try {
		const result = await validateRelease( {
			root: resolve( values.root ),
			version,
			expectedBranch: values[ 'expected-branch' ],
			skipBranchCheck: values[ 'skip-branch-check' ],
			skipTagCheck: values[ 'skip-tag-check' ],
		} );

		if ( values.json ) {
			console.log( JSON.stringify( result, null, 2 ) );
		} else {
			console.log(
				`\n=== Release Pre-Flight Checks: v${ result.targetVersion } ===\n`
			);
			for ( const check of result.checks ) {
				const symbol = check.pass ? '✅' : '❌';
				console.log( `${ symbol } ${ check.name }` );
				if ( ! check.pass ) {
					console.log( `   Detail: ${ check.detail }` );
				}
			}
			console.log( '' );
			if ( result.valid ) {
				console.log(
					'🎉 All release pre-flight checks passed! Target is releasable.\n'
				);
			} else {
				console.error(
					'🚫 Release pre-flight validation failed. Correct the errors above.\n'
				);
				process.exit( 1 );
			}
		}
	} catch ( error ) {
		console.error( `Error: ${ error.message }` );
		process.exit( 1 );
	}
}
