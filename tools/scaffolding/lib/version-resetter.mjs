import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileExists, normalizePath } from './detect.mjs';

function stringifyJson( value, originalSource ) {
	const indentationMatch = originalSource.match( /\n([ \t]+)"/ );
	const indentation = indentationMatch ? indentationMatch[ 1 ] : '  ';
	const newline = originalSource.includes( '\r\n' ) ? '\r\n' : '\n';
	return `${ JSON.stringify( value, null, indentation ).replaceAll(
		'\n',
		newline
	) }${ newline }`;
}

async function getFileContent( path, stagedChanges ) {
	if ( stagedChanges && stagedChanges.has( path ) ) {
		return stagedChanges.get( path ).after;
	}
	if ( await fileExists( path ) ) {
		return await readFile( path, 'utf8' );
	}
	return null;
}

/**
 * Resets versioning across project manifests, PHP headers, constants, and block manifests to targetVersion.
 *
 * @param {Object} options
 * @param {string} options.root
 * @param {string} options.currentVersion
 * @param {string} options.targetVersion Default '1.0.0'
 * @param {string} [options.mainPhpFile]
 * @param {string} [options.targetPrefix]
 * @param {Map<string, Object>} [options.changes] Staged changes from prior steps
 * @return {Promise<Array<{ path: string, relativePath: string, before: string, after: string }>>}
 */
export async function resetProjectVersion( {
	root,
	currentVersion,
	targetVersion = '1.0.0',
	mainPhpFile,
	targetPrefix,
	changes: stagedChanges = new Map(),
} ) {
	const changes = [];

	// 1. package.json
	const packagePath = join( root, 'package.json' );
	const packageSource = await getFileContent( packagePath, stagedChanges );
	if ( packageSource ) {
		try {
			const pkg = JSON.parse( packageSource );
			if ( pkg.version !== targetVersion ) {
				pkg.version = targetVersion;
				const updated = stringifyJson( pkg, packageSource );
				changes.push( {
					path: packagePath,
					relativePath: normalizePath( root, packagePath ),
					before: packageSource,
					after: updated,
				} );
			}
		} catch {
			// ignore JSON parse error
		}
	}

	// 2. package-lock.json / npm-shrinkwrap.json
	for ( const lockName of [ 'package-lock.json', 'npm-shrinkwrap.json' ] ) {
		const lockPath = join( root, lockName );
		const lockSource = await getFileContent( lockPath, stagedChanges );
		if ( lockSource ) {
			try {
				const lock = JSON.parse( lockSource );
				let modified = false;
				if ( lock.version && lock.version !== targetVersion ) {
					lock.version = targetVersion;
					modified = true;
				}
				if (
					lock.packages?.[ '' ]?.version &&
					lock.packages[ '' ].version !== targetVersion
				) {
					lock.packages[ '' ].version = targetVersion;
					modified = true;
				}
				if ( modified ) {
					const updated = stringifyJson( lock, lockSource );
					changes.push( {
						path: lockPath,
						relativePath: normalizePath( root, lockPath ),
						before: lockSource,
						after: updated,
					} );
				}
			} catch {
				// ignore JSON parse error
			}
		}
	}

	// 3. composer.json
	const composerPath = join( root, 'composer.json' );
	const composerSource = await getFileContent( composerPath, stagedChanges );
	if ( composerSource ) {
		try {
			const comp = JSON.parse( composerSource );
			if ( comp.version !== undefined && comp.version !== targetVersion ) {
				comp.version = targetVersion;
				const updated = stringifyJson( comp, composerSource );
				changes.push( {
					path: composerPath,
					relativePath: normalizePath( root, composerPath ),
					before: composerSource,
					after: updated,
				} );
			}
		} catch {
			// ignore JSON parse error
		}
	}

	// 4. Main PHP file(s)
	const phpCandidates = new Set();
	if ( mainPhpFile ) {
		phpCandidates.add( join( root, mainPhpFile ) );
	}
	try {
		const { glob } = await import( 'node:fs/promises' );
		for await ( const entry of glob( [ '*.php' ], {
			cwd: root,
			followSymlinks: false,
		} ) ) {
			phpCandidates.add( join( root, entry ) );
		}
	} catch {
		// ignore
	}

	for ( const phpPath of phpCandidates ) {
		const source = await getFileContent( phpPath, stagedChanges );
		if ( ! source ) {
			continue;
		}
		let updated = source;

		// Plugin Header Version: X.Y.Z
		updated = updated.replace(
			/(\*\s*Version:\s*)[^\r\n]+/g,
			`$1${ targetVersion }`
		);

		// Constant define( '<PREFIX>VERSION', 'X.Y.Z' );
		updated = updated.replace(
			/(define\(\s*['"][A-Z0-9_]+?VERSION['"]\s*,\s*['"])[^'"]+(['"]\s*\);)/g,
			`$1${ targetVersion }$2`
		);

		if ( updated !== source ) {
			changes.push( {
				path: phpPath,
				relativePath: normalizePath( root, phpPath ),
				before: source,
				after: updated,
			} );
		}
	}

	// 5. src/framework/Kernel/Plugin.php (Plugin::VERSION constant)
	const pluginClassPath = join( root, 'src/framework/Kernel/Plugin.php' );
	const pluginSource = await getFileContent(
		pluginClassPath,
		stagedChanges
	);
	if ( pluginSource ) {
		const updated = pluginSource.replace(
			/(public\s+const\s+VERSION\s*=\s*['"])[^'"]+(['"];)/,
			`$1${ targetVersion }$2`
		);
		if ( updated !== pluginSource ) {
			changes.push( {
				path: pluginClassPath,
				relativePath: normalizePath( root, pluginClassPath ),
				before: pluginSource,
				after: updated,
			} );
		}
	}

	// 6. Block manifest(s)
	const blockJsonPaths = [
		join( root, 'src/frontend/apps/hello-world/block.json' ),
		join( root, 'block.json' ),
	];
	for ( const blockPath of blockJsonPaths ) {
		const blockSource = await getFileContent( blockPath, stagedChanges );
		if ( blockSource ) {
			try {
				const block = JSON.parse( blockSource );
				if ( block.version && block.version !== targetVersion ) {
					block.version = targetVersion;
					const updated = stringifyJson( block, blockSource );
					changes.push( {
						path: blockPath,
						relativePath: normalizePath( root, blockPath ),
						before: blockSource,
						after: updated,
					} );
				}
			} catch {
				// ignore
			}
		}
	}

	// 7. readme.txt (Stable tag: X.Y.Z)
	const readmePath = join( root, 'readme.txt' );
	const readmeSource = await getFileContent( readmePath, stagedChanges );
	if ( readmeSource ) {
		const updated = readmeSource.replace(
			/(Stable\s+tag:\s*)[^\r\n]+/gi,
			`$1${ targetVersion }`
		);
		if ( updated !== readmeSource ) {
			changes.push( {
				path: readmePath,
				relativePath: normalizePath( root, readmePath ),
				before: readmeSource,
				after: updated,
			} );
		}
	}

	return changes;
}
