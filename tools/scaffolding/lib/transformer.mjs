import {
	chmod,
	readFile,
	rename,
	stat,
	writeFile,
} from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileExists, normalizePath } from './detect.mjs';

export const DEFAULT_EXCLUDES = [
	'.git/**',
	'.svn/**',
	'.hg/**',
	'node_modules/**',
	'vendor/**',
	'build/**',
	'dist/**',
	'coverage/**',
	'tests/coverage/**',
	'playwright-report/**',
	'tests/playwright-report/**',
	'test-results/**',
	'tests/test-results/**',
	'bruno/reports/**',
	'tests/bruno/reports/**',
	'.auth/**',
	'tests/**/.auth/**',
	'.phpunit.cache/**',
	'tests/.phpunit.cache/**',
	'.wp-env/**',
	'tools/scaffolding/**',
	'tests/node/scaffolding/**',
	'scaffold-sandbox/**',
	'tmp/**',
	'temp/**',
	'.tmp/**',
	'**/*.zip',
	'**/*.tar',
	'**/*.tar.gz',
	'**/*.png',
	'**/*.jpg',
	'**/*.jpeg',
	'**/*.gif',
	'**/*.webp',
	'**/*.ico',
	'**/*.woff',
	'**/*.woff2',
	'**/*.ttf',
	'**/*.eot',
	'**/*.pdf',
];

export const MAX_TEXT_FILE_BYTES = 5 * 1024 * 1024;

export function isLikelyBinary( buffer ) {
	const sampleLength = Math.min( buffer.length, 8192 );
	for ( let index = 0; index < sampleLength; index += 1 ) {
		if ( buffer[ index ] === 0 ) {
			return true;
		}
	}
	return false;
}

export function matchesRuleFilter( relativePath, filter ) {
	if ( ! filter ) {
		return false;
	}
	if ( typeof filter === 'function' ) {
		return Boolean( filter( relativePath ) );
	}
	if ( Array.isArray( filter ) ) {
		return filter.some( ( item ) => {
			if ( item.startsWith( '.' ) ) {
				return relativePath.endsWith( item );
			}
			return (
				relativePath === item || relativePath.endsWith( `/${ item }` )
			);
		} );
	}
	if ( typeof filter === 'string' ) {
		if ( filter.startsWith( '.' ) ) {
			return relativePath.endsWith( filter );
		}
		return (
			relativePath === filter || relativePath.endsWith( `/${ filter }` )
		);
	}
	return false;
}

/**
 * Applies token replacements across all eligible project text files.
 *
 * @param {Object} options
 * @param {string} options.root
 * @param {Array<{ from: string, to: string }>} options.replacements
 * @param {Map<string, Object>} options.changes Map of changed files
 * @param {Array<string>} [options.excludes]
 * @return {Promise<Map<string, Object>>}
 */
export async function scanFiles( {
	root,
	replacements,
	changes = new Map(),
	excludes = DEFAULT_EXCLUDES,
} ) {
	for await ( const entry of glob( [ '**/*', '.*', '**/.*' ], {
		cwd: root,
		exclude: excludes,
		followSymlinks: false,
		withFileTypes: true,
	} ) ) {
		if ( ! entry.isFile() ) {
			continue;
		}

		const absolutePath = resolve(
			entry.parentPath ?? dirname( join( root, entry.name ) ),
			entry.name
		);
		const projectPath = normalizePath( root, absolutePath );

		// Skip git, node_modules, vendor
		if (
			projectPath.startsWith( '.git/' ) ||
			projectPath.startsWith( 'node_modules/' ) ||
			projectPath.startsWith( 'vendor/' )
		) {
			continue;
		}

		const fileStat = await stat( absolutePath );
		if ( fileStat.size > MAX_TEXT_FILE_BYTES ) {
			continue;
		}

		const buffer = await readFile( absolutePath );
		if ( isLikelyBinary( buffer ) ) {
			continue;
		}

		let content = buffer.toString( 'utf8' );
		const original = content;

		// Check if file was already staged in changes map
		if ( changes.has( absolutePath ) ) {
			content = changes.get( absolutePath ).after;
		}

		for ( const rule of replacements ) {
			if (
				rule.include &&
				! matchesRuleFilter( projectPath, rule.include )
			) {
				continue;
			}
			if (
				rule.exclude &&
				matchesRuleFilter( projectPath, rule.exclude )
			) {
				continue;
			}
			if (
				rule.from &&
				rule.from !== rule.to &&
				content.includes( rule.from )
			) {
				content = content.replaceAll( rule.from, rule.to );
			}
		}

		if ( content !== original ) {
			changes.set( absolutePath, {
				path: projectPath,
				before: changes.has( absolutePath )
					? changes.get( absolutePath ).before
					: original,
				after: content,
				mode: fileStat.mode,
			} );
		}
	}

	return changes;
}

/**
 * Commits a map of file changes atomically to disk.
 *
 * @param {Map<string, Object>} changes
 * @param {Array<Object>} committedWrites
 * @return {Promise<void>}
 */
export async function commitTextChanges( changes, committedWrites ) {
	for ( const [ absPath, change ] of changes ) {
		const fileState = await stat( absPath );
		const mode = change.mode ?? fileState.mode;
		const tempPath = `${ absPath }.scaffold-${ process.pid }.tmp`;

		await writeFile( tempPath, change.after, {
			encoding: 'utf8',
			mode,
		} );
		await chmod( tempPath, mode );
		await rename( tempPath, absPath );

		committedWrites.push( {
			path: absPath,
			before: change.before,
			mode,
		} );
	}
}

/**
 * Rolls back committed text writes in reverse order.
 *
 * @param {Array<Object>} committedWrites
 * @return {Promise<void>}
 */
export async function rollbackCommittedWrites( committedWrites ) {
	for ( const file of committedWrites.reverse() ) {
		try {
			await writeFile( file.path, file.before, {
				encoding: 'utf8',
				mode: file.mode,
			} );
		} catch {
			// ignore rollback error on best-effort
		}
	}
}
