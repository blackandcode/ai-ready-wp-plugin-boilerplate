import { readdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { fileExists, normalizePath } from './detect.mjs';

/**
 * Plans file renames for main plugin file and translation files.
 *
 * @param {Object} options
 * @param {string} options.root
 * @param {Object} options.current
 * @param {Object} options.target
 * @return {Promise<Array<Object>>}
 */
export async function planRenames( { root, current, target } ) {
	const fileRenames = [];

	// 1. Plan rename of the main plugin file if changed
	const oldMainPhpPath = join( root, current.mainPhpFile );
	const newMainPhpPath = join( root, `${ target.slug }.php` );
	if (
		oldMainPhpPath !== newMainPhpPath &&
		( await fileExists( oldMainPhpPath ) )
	) {
		fileRenames.push( {
			from: oldMainPhpPath,
			to: newMainPhpPath,
			relativeFrom: normalizePath( root, oldMainPhpPath ),
			relativeTo: normalizePath( root, newMainPhpPath ),
		} );
	}

	// 2. Plan rename of language catalog files if slug changed
	if ( current.slug !== target.slug ) {
		const languagesDir = join( root, 'languages' );
		if ( await fileExists( languagesDir ) ) {
			try {
				const langEntries = await readdir( languagesDir, {
					withFileTypes: true,
				} );
				for ( const entry of langEntries ) {
					if (
						entry.isFile() &&
						entry.name.startsWith( current.slug )
					) {
						const oldPath = join( languagesDir, entry.name );
						const newName = entry.name.replace(
							current.slug,
							target.slug
						);
						const newPath = join( languagesDir, newName );
						if ( oldPath !== newPath ) {
							fileRenames.push( {
								from: oldPath,
								to: newPath,
								relativeFrom: normalizePath( root, oldPath ),
								relativeTo: normalizePath( root, newPath ),
							} );
						}
					}
				}
			} catch {
				// ignore readdir error
			}
		}
	}

	return fileRenames;
}

/**
 * Commits planned file renames.
 *
 * @param {Array<Object>} fileRenames
 * @param {Array<Object>} committedRenames
 * @return {Promise<void>}
 */
export async function commitRenames( fileRenames, committedRenames ) {
	for ( const renameOp of fileRenames ) {
		await rename( renameOp.from, renameOp.to );
		committedRenames.push( renameOp );
	}
}

/**
 * Rolls back committed renames in reverse.
 *
 * @param {Array<Object>} committedRenames
 * @return {Promise<void>}
 */
export async function rollbackCommittedRenames( committedRenames ) {
	for ( const renameOp of committedRenames.reverse() ) {
		try {
			await rename( renameOp.to, renameOp.from );
		} catch {
			// ignore rollback error on best-effort
		}
	}
}
