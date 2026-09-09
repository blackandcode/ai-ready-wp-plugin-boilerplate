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
	writeFile,
} from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';
import { getPluginMetadata } from './build-package.mjs';
import { createZip } from './lib/zip-utils.mjs';

const HELP = `
Usage:
  node tools/release/build-boilerplate-package.mjs [options]
  npm run boilerplate:build -- [options]

Builds the official Boilerplate Starter distribution ZIP archive,
containing the complete template repository (including dev tools, tests,
docs, and configurations) with pre-compiled assets and production Composer
autoloader, while strictly excluding node_modules/ and .git/.

Options:
  --root <path>               Project root directory. Default: current directory.
  --out-dir <path>            Output directory for the ZIP archive. Default: dist.
  --skip-build                Skip running 'npm run build' before packaging.
  --unsafe-skip-composer      Bypass 'composer install --no-dev' (UNSAFE: test-only).
  --skip-composer             Alias for --unsafe-skip-composer (test compatibility).
  --json                      Output structured JSON format.
  -h, --help                  Show this help message.
`;

/**
 * Checks if a path should be excluded from the boilerplate starter package.
 *
 * @param {string}  relPath Relative path from repository root
 * @param {boolean} isDir   Whether the path is a directory
 * @return {boolean} True if excluded
 */
export function isBoilerplateExcluded( relPath, isDir ) {
	const norm = relPath.replace( /\\/g, '/' );

	// Strictly excluded top-level directories
	if (
		norm === '.git' ||
		norm.startsWith( '.git/' ) ||
		norm === 'node_modules' ||
		norm.startsWith( 'node_modules/' ) ||
		norm === 'dist' ||
		norm.startsWith( 'dist/' ) ||
		norm === 'dist-extracted' ||
		norm.startsWith( 'dist-extracted/' ) ||
		norm.includes( '.phpunit.cache' ) ||
		norm.includes( 'playwright-report' ) ||
		norm.includes( 'test-results' ) ||
		norm.includes( 'coverage' ) ||
		norm.includes( 'bruno/reports' ) ||
		norm.includes( '.auth' ) ||
		norm === 'vendor' ||
		norm.startsWith( 'vendor/' )
	) {
		return true;
	}

	if ( isDir ) {
		return false;
	}

	const filename = norm.split( '/' ).pop();

	// Allow .env.example, exclude other .env files
	if ( filename === '.env.example' ) {
		return false;
	}
	if ( filename.startsWith( '.env' ) ) {
		return true;
	}

	// Exclude archives, logs, and OS files
	if (
		filename.endsWith( '.log' ) ||
		filename.endsWith( '.zip' ) ||
		filename.endsWith( '.tar.gz' ) ||
		filename.endsWith( '.tgz' ) ||
		filename === '.DS_Store' ||
		filename === 'Thumbs.db'
	) {
		return true;
	}

	return false;
}

/**
 * Recursively copies repository files into staging adhering to exclusions.
 *
 * @param {string} root       Source repository root
 * @param {string} stagingDir Target staging directory
 */
async function assembleBoilerplateStaging( root, stagingDir ) {
	await mkdir( stagingDir, { recursive: true } );

	async function walk( currentDir ) {
		const entries = await readdir( currentDir, { withFileTypes: true } );
		for ( const entry of entries ) {
			const fullPath = join( currentDir, entry.name );
			const relFromRoot = relative( root, fullPath ).replace( /\\/g, '/' );

			if ( isBoilerplateExcluded( relFromRoot, entry.isDirectory() ) ) {
				continue;
			}

			if ( entry.isDirectory() ) {
				await walk( fullPath );
			} else if ( entry.isFile() ) {
				const destPath = join( stagingDir, relFromRoot );
				await mkdir( dirname( destPath ), { recursive: true } );
				await copyFile( fullPath, destPath );
			}
		}
	}

	await walk( root );
}

/**
 * Recursively collects all files in staging directory.
 *
 * @param {string} stagingDir Staging directory to scan
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
 * Builds the Boilerplate Starter distribution ZIP, .sha256 checksum file, and .files.json report.
 *
 * @param {Object} options                    Build options
 * @param          options.root
 * @param          options.outDir
 * @param          options.skipBuild
 * @param          options.skipComposer
 * @param          options.unsafeSkipComposer
 * @return {Promise<{ zipPath: string, sha256Path: string, filesJsonPath: string, size: number, sha256: string, totalFiles: number, slug: string, version: string }>} Result
 */
export async function buildBoilerplatePackage( {
	root = process.cwd(),
	outDir = 'dist',
	skipBuild = false,
	skipComposer = false,
	unsafeSkipComposer = false,
} = {} ) {
	const isUnsafeComposer = unsafeSkipComposer || skipComposer;
	const meta = await getPluginMetadata( root );
	const targetOutDir = resolve( root, outDir );
	const stagingRoot = join( targetOutDir, '.staging-boilerplate' );
	const stagingDir = join( stagingRoot, meta.slug );

	// 1. Build frontend assets if requested
	if ( ! skipBuild ) {
		try {
			execSync( 'npm run build', { cwd: root, stdio: 'pipe' } );
		} catch ( err ) {
			throw new Error(
				`Boilerplate build failed ("npm run build"): ${ err.message }`
			);
		}
	}

	try {
		// Clean staging directory
		await rm( stagingRoot, { recursive: true, force: true } );
		await mkdir( targetOutDir, { recursive: true } );

		// 2. Assemble repository files into staging
		await assembleBoilerplateStaging( root, stagingDir );

		// 3. Setup production Composer autoloader inside staging
		const composerPath = join( stagingDir, 'composer.json' );
		const composerExists = existsSync( composerPath );

		if ( composerExists ) {
			if ( isUnsafeComposer ) {
				console.warn(
					'⚠️  WARNING: --unsafe-skip-composer is active for boilerplate build.'
				);
				const localVendor = join( root, 'vendor' );
				if ( existsSync( localVendor ) ) {
					await cp( localVendor, join( stagingDir, 'vendor' ), {
						recursive: true,
					} );
				}
			} else {
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
						`Composer production install failed for boilerplate package: ${ err.message }\n${ stderr }`
					);
				}

				// Assert vendor autoloader was created
				const stagedAutoload = join( stagingDir, 'vendor/autoload.php' );
				if ( ! existsSync( stagedAutoload ) ) {
					throw new Error(
						'Composer autoloader missing after "composer install --no-dev". Expected vendor/autoload.php'
					);
				}

				// Remove vendor/bin if created
				const stagedBin = join( stagingDir, 'vendor/bin' );
				if ( existsSync( stagedBin ) ) {
					await rm( stagedBin, { recursive: true, force: true } );
				}
			}
		}

		// 4. Collect staged files
		const files = await collectStagedFiles( stagingDir );
		if ( files.length === 0 ) {
			throw new Error( 'No files found in boilerplate staging directory.' );
		}

		// 5. Build ZIP entries prefixed with {slug}/
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

		// 6. Write ZIP file with starter suffix
		const zipFilename = `${ meta.slug }-starter-${ meta.version }.zip`;
		const zipPath = join( targetOutDir, zipFilename );
		const zipResult = await createZip( entries, zipPath );

		// 7. Write SHA256 checksum file
		const sha256Filename = `${ zipFilename }.sha256`;
		const sha256Path = join( targetOutDir, sha256Filename );
		await writeFile(
			sha256Path,
			`${ zipResult.sha256 }  ${ zipFilename }\n`,
			'utf8'
		);

		// 8. Discover installed production Composer packages
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

		// 9. Write .files.json release inventory report
		const filesJsonFilename = `${ meta.slug }-starter-${ meta.version }.files.json`;
		const filesJsonPath = join( targetOutDir, filesJsonFilename );
		const filesReport = {
			slug: meta.slug,
			version: meta.version,
			packageType: 'boilerplate-starter',
			archive: zipFilename,
			sha256: zipResult.sha256,
			size: zipResult.size,
			formattedSize: `${ ( zipResult.size / ( 1024 * 1024 ) ).toFixed( 2 ) } MB`,
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
		// Clean up staging directory
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
		console.log( '📦 Building boilerplate starter distribution archive...' );
		const result = await buildBoilerplatePackage( {
			root: resolve( values.root ),
			outDir: values[ 'out-dir' ],
			skipBuild: values[ 'skip-build' ],
			skipComposer: values[ 'skip-composer' ],
			unsafeSkipComposer: values[ 'unsafe-skip-composer' ],
		} );

		if ( values.json ) {
			console.log( JSON.stringify( result, null, 2 ) );
		} else {
			const sizeMb = ( result.size / ( 1024 * 1024 ) ).toFixed( 2 );
			console.log( '\n✅ Boilerplate Starter Package Created Successfully:' );
			console.log( `   Archive:    ${ result.zipPath }` );
			console.log( `   Checksum:   ${ result.sha256Path }` );
			console.log( `   Inventory:  ${ result.filesJsonPath }` );
			console.log( `   SHA256:     ${ result.sha256 }` );
			console.log( `   Size:       ${ sizeMb } MB` );
			console.log(
				`   Files:      ${ result.totalFiles } entries in "${ result.slug }/"\n`
			);
		}
	} catch ( error ) {
		console.error( `Error: ${ error.message }` );
		process.exit( 1 );
	}
}
