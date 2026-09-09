import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Default patterns to ignore if no .distignore file is found.
 */
export const DEFAULT_DISTIGNORE = [
	'/.git',
	'/.github',
	'/.cursor',
	'/.agents',
	'/.codex',
	'/docs',
	'/tests',
	'/tools',
	'/node_modules',
	'/.wp-env',
	'/dist',
	'/.editorconfig',
	'/.env',
	'/.env.*',
	'/.gitignore',
	'/.markdownlint-cli2.jsonc',
	'/.wp-env.json',
	'/jest.config.js',
	'/playwright.config.ts',
	'/phpcs.xml.dist',
	'/phpstan.neon.dist',
	'/phpunit.xml.dist',
	'/tsconfig.json',
	'/webpack.config.js',
	'/package.json',
	'/package-lock.json',
	'/composer.json',
	'/composer.lock',
	'/AGENTS.md',
	'/MANIFEST.md',
	'/CHANGELOG.md',
	'.distignore',
	'*.zip',
	'*.tar.gz',
	'*.tgz',
	'*.log',
	'.DS_Store',
	'Thumbs.db',
];

/**
 * Converts a gitignore/distignore pattern into a RegExp.
 *
 * @param {string} pattern Pattern line from .distignore
 * @return {{ regex: RegExp, isNegative: boolean, dirOnly: boolean, anchored: boolean }} Pattern definition
 */
export function compilePattern( pattern ) {
	let str = pattern.trim();
	const isNegative = str.startsWith( '!' );
	if ( isNegative ) {
		str = str.slice( 1 ).trim();
	}

	const dirOnly = str.endsWith( '/' );
	if ( dirOnly ) {
		str = str.slice( 0, -1 );
	}

	const anchored = str.startsWith( '/' );
	if ( anchored ) {
		str = str.slice( 1 );
	}

	let regexStr = '';
	for ( let i = 0; i < str.length; i++ ) {
		const char = str[ i ];
		if ( char === '*' ) {
			if ( str[ i + 1 ] === '*' ) {
				i++;
				if ( str[ i + 1 ] === '/' ) {
					i++;
					regexStr += '(?:.+/)?';
				} else {
					regexStr += '.*';
				}
			} else {
				regexStr += '[^/]*';
			}
		} else if ( char === '?' ) {
			regexStr += '[^/]';
		} else if (
			[
				'.',
				'+',
				'^',
				'$',
				'(',
				')',
				'[',
				']',
				'{',
				'}',
				'|',
				'\\',
			].includes( char )
		) {
			regexStr += '\\' + char;
		} else {
			regexStr += char;
		}
	}

	let finalPattern;
	if ( anchored ) {
		finalPattern = `^${ regexStr }(?:/.*)?$`;
	} else {
		finalPattern = `(?:^|/)${ regexStr }(?:/.*)?$`;
	}

	return {
		raw: pattern,
		regex: new RegExp( finalPattern ),
		isNegative,
		dirOnly,
		anchored,
	};
}

/**
 * Parses .distignore file contents into compiled matchers.
 *
 * @param {string} content Content of .distignore
 * @return {Array} Compiled patterns
 */
export function parseDistignore( content ) {
	const lines = content.split( /\r?\n/ );
	const patterns = [];

	for ( const rawLine of lines ) {
		const line = rawLine.trim();
		if ( ! line || line.startsWith( '#' ) ) {
			continue;
		}
		patterns.push( compilePattern( line ) );
	}

	return patterns;
}

/**
 * Loads .distignore from the given directory (or falls back to defaults).
 *
 * @param {string} root Project root directory
 * @return {Promise<Array>} Compiled patterns
 */
export async function loadDistignore( root ) {
	const filePath = join( root, '.distignore' );
	try {
		const content = await readFile( filePath, 'utf8' );
		return parseDistignore( content );
	} catch {
		return parseDistignore( DEFAULT_DISTIGNORE.join( '\n' ) );
	}
}

/**
 * Tests whether a relative path should be ignored according to the parsed patterns.
 *
 * @param {string}  relativePath Path relative to project root (forward slashes)
 * @param {boolean} isDirectory  Whether the path is a directory
 * @param {Array}   patterns     Compiled distignore patterns
 * @return {boolean} True if the path should be ignored
 */
export function isPathIgnored( relativePath, isDirectory, patterns ) {
	const normalized = relativePath
		.replace( /\\/g, '/' )
		.replace( /^\/+|\/+$/g, '' );
	if ( ! normalized ) {
		return false;
	}

	let ignored = false;

	for ( const rule of patterns ) {
		if ( rule.dirOnly && ! isDirectory ) {
			continue;
		}

		if ( rule.regex.test( normalized ) ) {
			ignored = ! rule.isNegative;
		}
	}

	return ignored;
}
