#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
	copyFile,
	cp,
	mkdir,
	readdir,
	readFile,
	rm,
	stat,
	unlink,
	writeFile,
} from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';
import { isPathIgnored, loadDistignore } from './lib/distignore.mjs';
import { createZip } from './lib/zip-utils.mjs';
import { findMainPluginFile } from './validate-release.mjs';

const HELP = `
Usage:
  node tools/release/build-package.mjs [options]
  npm run release:build -- [options]

Builds the official production distribution ZIP archive for the plugin,
enforcing an isolated staging environment (.staging/), allowlist assembly,
fail-hard Composer pruning, and packaging the root {plugin-slug}/ folder.

Options:
  --root <path>               Project root directory. Default: current directory.
  --out-dir <path>            Output directory for the ZIP archive. Default: dist.
  --skip-build                Skip running 'npm run build' before packaging.
  --unsafe-skip-composer      Bypass 'composer install --no-dev' (UNSAFE: test-only).
  --skip-composer             Alias for --unsafe-skip-composer (legacy test compatibility).
  --json                      Output structured JSON format.
  -h, --help                  Show this help message.
`;

/**
 * Discovers plugin information from package.json and main PHP file.
 *
 * @param {string} root Project root
 * @return {Promise<{ slug: string, version: string, mainPhpFile: string }>} Plugin metadata
 */
export async function getPluginMetadata( root ) {
	const packageJsonPath = join( root, 'package.json' );
	const packageJson = JSON.parse( await readFile( packageJsonPath, 'utf8' ) );

	const mainPhpFile = await findMainPluginFile( root );
	const phpSource = await readFile( join( root, mainPhpFile ), 'utf8' );

	let slug = mainPhpFile.replace( /\.php$/, '' );
	const textDomainMatch = phpSource.match(
		/\*\s*Text Domain:\s*([^\r\n]+)/i
	);
	if ( textDomainMatch ) {
		slug = textDomainMatch[ 1 ].trim();
	}

	return {
		slug,
		version: packageJson.version,
		mainPhpFile,
	};
}

/**
 * Assembles production files from root into an isolated staging directory using an explicit allowlist.
 *
 * @param {string} root            Project source root directory
 * @param {string} stagingDir      Isolated staging directory (.staging/<slug>/)
 * @param {Object} meta            Plugin metadata
 * @param {Array}  distignoreRules Compiled distignore rules
 */
async function assembleStaging( root, stagingDir, meta, distignoreRules ) {
	await mkdir( stagingDir, { recursive: true } );

	// 1. Root production files
	const allowedRootFiles = [
		meta.mainPhpFile,
		'uninstall.php',
		'readme.txt',
		'LICENSE',
		'LICENSE.txt',
		'LICENSE.md',
	];

	for ( const file of allowedRootFiles ) {
		const srcPath = join( root, file );
		if ( existsSync( srcPath ) ) {
			if ( ! isPathIgnored( file, false, distignoreRules ) ) {
				await copyFile( srcPath, join( stagingDir, file ) );
			}
		}
	}

	// 2. Languages directory (if present)
	const languagesDir = join( root, 'languages' );
	if (
		existsSync( languagesDir ) &&
		! isPathIgnored( 'languages', true, distignoreRules )
	) {
		await cp( languagesDir, join( stagingDir, 'languages' ), {
			recursive: true,
		} );
	}

	// 3. Runtime PHP classes from src/
	const srcDir = join( root, 'src' );
	if ( existsSync( srcDir ) ) {
		async function walkSrc( currentDir ) {
			const entries = await readdir( currentDir, { withFileTypes: true } );
			for ( const entry of entries ) {
				const fullPath = join( currentDir, entry.name );
				const relFromRoot = relative( root, fullPath ).replace( /\\/g, '/' );

				if ( isPathIgnored( relFromRoot, entry.isDirectory(), distignoreRules ) ) {
					continue;
				}

				// Strictly exclude development domain
				if (
					relFromRoot === 'src/development' ||
					relFromRoot.startsWith( 'src/development/' )
				) {
					continue;
				}

				// Strictly exclude test doubles
				if ( entry.name.startsWith( 'Fake' ) || entry.name.includes( 'Test' ) ) {
					continue;
				}

				if ( entry.isDirectory() ) {
					// Exclude uncompiled frontend source directories
					if (
						relFromRoot.includes( '/react' ) ||
						relFromRoot === 'src/frontend/shared' ||
						relFromRoot.startsWith( 'src/frontend/shared/' ) ||
						relFromRoot === 'src/frontend/apps/developer' ||
						relFromRoot.startsWith( 'src/frontend/apps/developer/' ) ||
						relFromRoot === 'src/frontend/apps/hello-world' // Compiled into build/blocks/
					) {
						continue;
					}
					await walkSrc( fullPath );
				} else if ( entry.isFile() ) {
					if ( ! entry.name.endsWith( '.php' ) ) {
						continue;
					}
					const destPath = join( stagingDir, relFromRoot );
					await mkdir( dirname( destPath ), { recursive: true } );
					await copyFile( fullPath, destPath );
				}
			}
		}
		await walkSrc( srcDir );
	}

	// 4. Compiled production assets from build/
	const buildDir = join( root, 'build' );
	if ( existsSync( buildDir ) ) {
		async function walkBuild( currentDir ) {
			const entries = await readdir( currentDir, { withFileTypes: true } );
			for ( const entry of entries ) {
				const fullPath = join( currentDir, entry.name );
				const relFromRoot = relative( root, fullPath ).replace( /\\/g, '/' );

				if ( isPathIgnored( relFromRoot, entry.isDirectory(), distignoreRules ) ) {
					continue;
				}

				// Strictly exclude developer admin bundles, legacy build/frontend duplicates, source maps, and numeric dynamic chunks from dev
				if (
					relFromRoot === 'build/admin/developer' ||
					relFromRoot.startsWith( 'build/admin/developer/' ) ||
					relFromRoot === 'build/frontend' ||
					relFromRoot.startsWith( 'build/frontend/' ) ||
					entry.name.endsWith( '.map' ) ||
					/^\d+\.js$/.test( entry.name )
				) {
					continue;
				}

				if ( entry.isDirectory() ) {
					await walkBuild( fullPath );
				} else if ( entry.isFile() ) {
					const destPath = join( stagingDir, relFromRoot );
					await mkdir( dirname( destPath ), { recursive: true } );
					await copyFile( fullPath, destPath );
				}
			}
		}
		await walkBuild( buildDir );
	}
}

/**
 * Recursively collects all files in staging directory.
 *
 * @param {string} stagingDir Directory to scan
 * @return {Promise<Array<string>>} List of relative file paths
 */
async function collectStagedFiles( stagingDir ) {
	const collected = [];

	async function walk( currentDir ) {
		const entries = await readdir( currentDir, { withFileTypes: true } );
		for ( const entry of entries ) {
			const fullPath = join( currentDir, entry.name );
			const relPath = relative( stagingDir, fullPath ).replace( /\\/g, '/' );

			if ( entry.isDirectory() ) {
				await walk( fullPath );
			} else if ( entry.isFile() ) {
				collected.push( relPath );
			}
		}
	}

	await walk( stagingDir );
	return collected;
}

/**
 * Builds the distribution package ZIP, .sha256 checksum file, and .files.json inventory report.
 *
 * @param {Object} options                    Build options
 * @param          options.root
 * @param          options.outDir
 * @param          options.skipBuild
 * @param          options.skipComposer
 * @param          options.unsafeSkipComposer
 * @return {Promise<{ zipPath: string, sha256Path: string, filesJsonPath: string, size: number, sha256: string, totalFiles: number, slug: string, version: string }>} Result
 */
export async function buildPackage( {
	root = process.cwd(),
	outDir = 'dist',
	skipBuild = false,
	skipComposer = false,
	unsafeSkipComposer = false,
} = {} ) {
	const isUnsafeComposer = unsafeSkipComposer || skipComposer;
	const meta = await getPluginMetadata( root );
	const targetOutDir = resolve( root, outDir );
	const stagingRoot = join( targetOutDir, '.staging' );
	const stagingDir = join( stagingRoot, meta.slug );

	// 1. Production frontend build
	if ( ! skipBuild ) {
		try {
			execSync( 'npm run build', { cwd: root, stdio: 'pipe' } );
		} catch ( err ) {
			throw new Error(
				`Production build failed ("npm run build"): ${ err.message }`
			);
		}
	}

	try {
		// Clean staging directory
		await rm( stagingRoot, { recursive: true, force: true } );
		await mkdir( targetOutDir, { recursive: true } );

		// 2. Load .distignore rules
		const distignoreRules = await loadDistignore( root );

		// 3. Assemble production files into isolated staging directory
		await assembleStaging( root, stagingDir, meta, distignoreRules );

		// 4. Production Composer autoloader optimization inside staging
		const composerPath = join( root, 'composer.json' );
		const composerExists = existsSync( composerPath );

		if ( composerExists ) {
			if ( isUnsafeComposer ) {
				console.warn(
					'⚠️  WARNING: --unsafe-skip-composer is active. Composer dependencies were not pruned.'
				);
				// If a local vendor directory exists, copy it into staging (for offline unit tests)
				const localVendor = join( root, 'vendor' );
				if ( existsSync( localVendor ) ) {
					await cp( localVendor, join( stagingDir, 'vendor' ), {
						recursive: true,
					} );
				}
			} else {
				// Copy manifests into staging temporarily
				await copyFile( composerPath, join( stagingDir, 'composer.json' ) );
				const composerLockPath = join( root, 'composer.lock' );
				if ( existsSync( composerLockPath ) ) {
					await copyFile(
						composerLockPath,
						join( stagingDir, 'composer.lock' )
					);
				}

				// Fail-hard Composer execution
				try {
					execSync(
						'composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction --no-progress',
						{
							cwd: stagingDir,
							stdio: 'pipe',
						}
					);
				} catch ( err ) {
					const stderr = err.stderr ? err.stderr.toString() : '';
					throw new Error(
						`Composer production install failed ("composer install --no-dev"): ${ err.message }\n${ stderr }`
					);
				}

				// Verify production vendor integrity
				const stagedVendor = join( stagingDir, 'vendor' );
				const stagedAutoload = join( stagedVendor, 'autoload.php' );
				if ( ! existsSync( stagedAutoload ) ) {
					throw new Error(
						'Vendor autoloader missing after "composer install --no-dev". Expected vendor/autoload.php'
					);
				}

				// Assert vendor/bin does not exist
				const stagedBin = join( stagedVendor, 'bin' );
				if ( existsSync( stagedBin ) ) {
					await rm( stagedBin, { recursive: true, force: true } );
				}

				// Assert require-dev packages are absent
				const composerJson = JSON.parse(
					await readFile( composerPath, 'utf8' )
				);
				const devDeps = Object.keys( composerJson[ 'require-dev' ] || {} );
				for ( const devDep of devDeps ) {
					const devPkgPath = join( stagedVendor, devDep );
					if ( existsSync( devPkgPath ) ) {
						throw new Error(
							`Production vendor directory leaked require-dev package: ${ devDep }`
						);
					}
				}

				// Remove build manifests from staging
				await unlink( join( stagingDir, 'composer.json' ) );
				const stagedLock = join( stagingDir, 'composer.lock' );
				if ( existsSync( stagedLock ) ) {
					await unlink( stagedLock );
				}
			}
		} else {
			// No composer.json; copy existing vendor if present
			const localVendor = join( root, 'vendor' );
			if ( existsSync( localVendor ) ) {
				await cp( localVendor, join( stagingDir, 'vendor' ), {
					recursive: true,
				} );
			}
		}

		// 5. Collect staged files
		const files = await collectStagedFiles( stagingDir );

		if ( files.length === 0 ) {
			throw new Error(
				'No eligible production files found to package. Check assembly rules.'
			);
		}

		// 6. Build ZIP entries prefixed with {slug}/
		const entries = [];
		for ( const relPath of files ) {
			const absolutePath = join( stagingDir, relPath );
			const fileBuffer = await readFile( absolutePath );
			const fileStat = await stat( absolutePath );

			entries.push( {
				path: `${ meta.slug }/${ relPath }`,
				data: fileBuffer,
				mtime: fileStat.mtime,
			} );
		}

		// 7. Write ZIP file
		const zipFilename = `${ meta.slug }-${ meta.version }.zip`;
		const zipPath = join( targetOutDir, zipFilename );
		const zipResult = await createZip( entries, zipPath );

		// 8. Write SHA256 checksum file
		const sha256Filename = `${ zipFilename }.sha256`;
		const sha256Path = join( targetOutDir, sha256Filename );
		await writeFile(
			sha256Path,
			`${ zipResult.sha256 }  ${ zipFilename }\n`,
			'utf8'
		);

		// 9. Discover installed Composer production packages
		let composerProductionPackages = [];
		const installedJsonPath = join(
			stagingDir,
			'vendor/composer/installed.json'
		);
		if ( existsSync( installedJsonPath ) ) {
			try {
				const installedData = JSON.parse(
					await readFile( installedJsonPath, 'utf8' )
				);
				const pkgs = installedData.packages || installedData;
				if ( Array.isArray( pkgs ) ) {
					composerProductionPackages = pkgs
						.filter( ( p ) => p.name && p.type !== 'composer-plugin' )
						.map( ( p ) => `${ p.name }@${ p.version }` );
				}
			} catch {
				// Ignore parsing errors
			}
		}

		// 10. Write .files.json release inventory report
		const filesJsonFilename = `${ meta.slug }-${ meta.version }.files.json`;
		const filesJsonPath = join( targetOutDir, filesJsonFilename );
		const filesReport = {
			slug: meta.slug,
			version: meta.version,
			archive: zipFilename,
			sha256: zipResult.sha256,
			size: zipResult.size,
			formattedSize: `${ ( zipResult.size / 1024 ).toFixed( 2 ) } KB`,
			totalFiles: entries.length,
			builtAt: new Date().toISOString(),
			composerProductionPackages,
			files: entries.map( ( e ) => e.path ).sort(),
		};
		await writeFile(
			filesJsonPath,
			JSON.stringify( filesReport, null, 2 ) + '\n',
			'utf8'
		);

		return {
			zipPath,
			sha256Path,
			filesJsonPath,
			size: zipResult.size,
			sha256: zipResult.sha256,
			totalFiles: entries.length,
			slug: meta.slug,
			version: meta.version,
		};
	} finally {
		// Clean up temporary staging directory
		await rm( stagingRoot, { recursive: true, force: true } );
	}
}

// CLI execution
if (
	process.argv[ 1 ] &&
	resolve( process.argv[ 1 ] ) ===
		resolve( new URL( import.meta.url ).pathname )
) {
	const { values } = parseArgs( {
		options: {
			root: { type: 'string', default: process.cwd() },
			'out-dir': { type: 'string', default: 'dist' },
			'skip-build': { type: 'boolean', default: false },
			'skip-composer': { type: 'boolean', default: false },
			'unsafe-skip-composer': { type: 'boolean', default: false },
			json: { type: 'boolean', default: false },
			help: { type: 'boolean', short: 'h', default: false },
		},
		strict: true,
	} );

	if ( values.help ) {
		console.log( HELP.trim() );
		process.exit( 0 );
	}

	try {
		console.log( '📦 Building plugin distribution archive...' );
		const result = await buildPackage( {
			root: resolve( values.root ),
			outDir: values[ 'out-dir' ],
			skipBuild: values[ 'skip-build' ],
			skipComposer: values[ 'skip-composer' ],
			unsafeSkipComposer: values[ 'unsafe-skip-composer' ],
		} );

		if ( values.json ) {
			console.log( JSON.stringify( result, null, 2 ) );
		} else {
			const sizeKb = ( result.size / 1024 ).toFixed( 2 );
			const sizeMb = ( result.size / ( 1024 * 1024 ) ).toFixed( 2 );
			console.log( '\n✅ Distribution Package Created Successfully:' );
			console.log( `   Archive:    ${ result.zipPath }` );
			console.log( `   Checksum:   ${ result.sha256Path }` );
			console.log( `   Inventory:  ${ result.filesJsonPath }` );
			console.log( `   SHA256:     ${ result.sha256 }` );
			console.log( `   Size:       ${ sizeKb } KB (${ sizeMb } MB)` );
			console.log(
				`   Files:      ${ result.totalFiles } entries in "${ result.slug }/"\n`
			);
		}
	} catch ( error ) {
		console.error( `Error: ${ error.message }` );
		process.exit( 1 );
	}
}
