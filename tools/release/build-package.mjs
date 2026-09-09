#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
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
enforcing .distignore rules and packaging the root {plugin-slug}/ folder.

Options:
  --root <path>        Project root directory. Default: current directory.
  --out-dir <path>     Output directory for the ZIP archive. Default: dist.
  --skip-build         Skip running 'npm run build' before packaging.
  --skip-composer      Skip running 'composer install --no-dev'.
  --json               Output structured JSON format.
  -h, --help           Show this help message.
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
	const textDomainMatch = phpSource.match( /\*\s*Text Domain:\s*([^\r\n]+)/i );
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
 * Recursively collects eligible files respecting .distignore.
 *
 * @param {string} root Directory to scan
 * @param {Array} distignoreRules Compiled distignore patterns
 * @return {Promise<Array<string>>} List of relative file paths
 */
async function collectFiles( root, distignoreRules ) {
	const collected = [];

	async function walk( currentDir ) {
		const entries = await readdir( currentDir, { withFileTypes: true } );
		for ( const entry of entries ) {
			const fullPath = join( currentDir, entry.name );
			const relPath = relative( root, fullPath ).replace( /\\/g, '/' );

			if ( entry.isDirectory() ) {
				if ( isPathIgnored( relPath, true, distignoreRules ) ) {
					continue;
				}
				await walk( fullPath );
			} else if ( entry.isFile() ) {
				if ( isPathIgnored( relPath, false, distignoreRules ) ) {
					continue;
				}
				collected.push( relPath );
			}
		}
	}

	await walk( root );
	return collected;
}

/**
 * Builds the distribution package ZIP and .sha256 checksum file.
 *
 * @param {object} options Build options
 * @return {Promise<{ zipPath: string, sha256Path: string, size: number, sha256: string, totalFiles: number, slug: string, version: string }>} Result
 */
export async function buildPackage( {
	root = process.cwd(),
	outDir = 'dist',
	skipBuild = false,
	skipComposer = false,
} = {} ) {
	const meta = await getPluginMetadata( root );
	const targetOutDir = resolve( root, outDir );

	// 1. Production frontend build
	if ( ! skipBuild ) {
		try {
			execSync( 'npm run build', { cwd: root, stdio: 'pipe' } );
		} catch ( err ) {
			throw new Error( `Production build failed ("npm run build"): ${ err.message }` );
		}
	}

	// 2. Production Composer autoloader optimization (with dev-dependency restoration)
	let composerRestorationNeeded = false;
	if ( ! skipComposer ) {
		try {
			execSync( 'composer --version', { stdio: 'ignore' } );
			// If composer binary is available:
			execSync( 'composer install --no-dev --prefer-dist --optimize-autoloader', {
				cwd: root,
				stdio: 'pipe',
			} );
			composerRestorationNeeded = true;
		} catch {
			// Composer CLI not on PATH; proceed with existing vendor autoloader
		}
	}

	try {
		// 3. Load .distignore rules
		const distignoreRules = await loadDistignore( root );

		// 4. Collect eligible files
		const files = await collectFiles( root, distignoreRules );

		if ( files.length === 0 ) {
			throw new Error( 'No eligible files found to package. Check .distignore rules.' );
		}

		// 5. Build ZIP entries prefixed with {slug}/
		const entries = [];
		for ( const relPath of files ) {
			const absolutePath = join( root, relPath );
			const fileBuffer = await readFile( absolutePath );
			const fileStat = await stat( absolutePath );

			entries.push( {
				path: `${ meta.slug }/${ relPath }`,
				data: fileBuffer,
				mtime: fileStat.mtime,
			} );
		}

		// 6. Write ZIP file
		const zipFilename = `${ meta.slug }-${ meta.version }.zip`;
		const zipPath = join( targetOutDir, zipFilename );
		const zipResult = await createZip( entries, zipPath );

		// 7. Write SHA256 checksum file
		const sha256Filename = `${ zipFilename }.sha256`;
		const sha256Path = join( targetOutDir, sha256Filename );
		await writeFile( sha256Path, `${ zipResult.sha256 }  ${ zipFilename }\n`, 'utf8' );

		return {
			zipPath,
			sha256Path,
			size: zipResult.size,
			sha256: zipResult.sha256,
			totalFiles: entries.length,
			slug: meta.slug,
			version: meta.version,
		};
	} finally {
		// 8. Restore development dependencies if composer install --no-dev was run
		if ( composerRestorationNeeded ) {
			try {
				execSync( 'composer install', { cwd: root, stdio: 'ignore' } );
			} catch {
				// ignore restoration failure
			}
		}
	}
}

// CLI execution
if ( process.argv[ 1 ] && resolve( process.argv[ 1 ] ) === resolve( new URL( import.meta.url ).pathname ) ) {
	const { values } = parseArgs( {
		options: {
			root: { type: 'string', default: process.cwd() },
			'out-dir': { type: 'string', default: 'dist' },
			'skip-build': { type: 'boolean', default: false },
			'skip-composer': { type: 'boolean', default: false },
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
		} );

		if ( values.json ) {
			console.log( JSON.stringify( result, null, 2 ) );
		} else {
			const sizeKb = ( result.size / 1024 ).toFixed( 2 );
			const sizeMb = ( result.size / ( 1024 * 1024 ) ).toFixed( 2 );
			console.log( '\n✅ Distribution Package Created Successfully:' );
			console.log( `   Archive:    ${ result.zipPath }` );
			console.log( `   Checksum:   ${ result.sha256Path }` );
			console.log( `   SHA256:     ${ result.sha256 }` );
			console.log( `   Size:       ${ sizeKb } KB (${ sizeMb } MB)` );
			console.log( `   Files:      ${ result.totalFiles } entries in "${ result.slug }/"\n` );
		}
	} catch ( error ) {
		console.error( `Error: ${ error.message }` );
		process.exit( 1 );
	}
}
