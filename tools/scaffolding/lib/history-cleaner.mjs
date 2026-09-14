import { readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileExists, normalizePath } from './detect.mjs';

function todayIso() {
	return new Date().toISOString().slice( 0, 10 );
}

/**
 * Clean and reset CHANGELOG.md to an initial baseline.
 */
export async function cleanChangelog( {
	root,
	targetName,
	targetVersion = '1.0.0',
	date = todayIso(),
	dryRun = false,
} ) {
	const changelogPath = join( root, 'CHANGELOG.md' );
	if ( ! ( await fileExists( changelogPath ) ) ) {
		return null;
	}

	const original = await readFile( changelogPath, 'utf8' );
	const newContent = [
		'# Changelog',
		'',
		'All notable changes to this project are documented in this file.',
		'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),',
		'and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).',
		'',
		'## [Unreleased]',
		'',
		`## [${ targetVersion }] - ${ date }`,
		'',
		'### Added',
		'',
		`- Initial release of ${ targetName }.`,
		'',
	].join( '\n' );

	if ( original === newContent ) {
		return null;
	}

	return {
		path: changelogPath,
		relativePath: normalizePath( root, changelogPath ),
		before: original,
		after: newContent,
	};
}

/**
 * Clean and reset readme.txt changelog section to an initial baseline.
 */
export async function cleanReadmeChangelog( {
	root,
	targetName,
	targetVersion = '1.0.0',
} ) {
	const readmePath = join( root, 'readme.txt' );
	if ( ! ( await fileExists( readmePath ) ) ) {
		return null;
	}

	const original = await readFile( readmePath, 'utf8' );
	const changelogSectionRegex = /(== Changelog ==\r?\n\r?\n)([\s\S]*?)(\r?\n== |$)/;
	const match = original.match( changelogSectionRegex );
	const newline = original.includes( '\r\n' ) ? '\r\n' : '\n';
	const newSection = `= ${ targetVersion } =${ newline }* Initial release of ${ targetName }.${ newline }`;

	let newContent;
	if ( match ) {
		newContent = original.replace(
			changelogSectionRegex,
			`$1${ newSection }$3`
		);
	} else {
		newContent = `${ original.trimEnd() }${ newline }${ newline }== Changelog ==${ newline }${ newline }${ newSection }`;
	}

	if ( original === newContent ) {
		return null;
	}

	return {
		path: readmePath,
		relativePath: normalizePath( root, readmePath ),
		before: original,
		after: newContent,
	};
}

/**
 * Clean boilerplate ADRs (0002+) while preserving and resetting ADR-0001 and docs/adr/README.md.
 */
export async function cleanAdrs( {
	root,
	date = todayIso(),
} ) {
	const adrDir = join( root, 'docs/adr' );
	if ( ! ( await fileExists( adrDir ) ) ) {
		return { filesToDelete: [], filesToModify: [] };
	}

	const filesToDelete = [];
	const filesToModify = [];

	const entries = await readdir( adrDir, { withFileTypes: true } );
	for ( const entry of entries ) {
		if ( ! entry.isFile() || ! entry.name.endsWith( '.md' ) ) {
			continue;
		}

		// Preserve foundational ADR-0001
		if ( /^0001[-_]/i.test( entry.name ) ) {
			const adr1Path = join( adrDir, entry.name );
			const original = await readFile( adr1Path, 'utf8' );
			let updated = original;

			// Update Date if present
			updated = updated.replace(
				/(- \*\*Date:\*\*\s*)\d{4}-\d{2}-\d{2}/,
				`$1${ date }`
			);

			// Remove any references to superseded/related decisions from boilerplate
			updated = updated.replace(
				/(- \*\*Supersedes:\*\*\s*).*/,
				'$1None'
			);
			updated = updated.replace(
				/(- \*\*Superseded by:\*\*\s*).*/,
				'$1None'
			);
			updated = updated.replace(
				/(- \*\*Related ADRs:\*\*\s*).*/,
				'$1None'
			);

			if ( updated !== original ) {
				filesToModify.push( {
					path: adr1Path,
					relativePath: normalizePath( root, adr1Path ),
					before: original,
					after: updated,
				} );
			}
			continue;
		}

		// If README.md, reset the decision log table
		if ( entry.name.toLowerCase() === 'readme.md' ) {
			const readmePath = join( adrDir, entry.name );
			const original = await readFile( readmePath, 'utf8' );

			const tableRegex =
				/(## Architectural Decision Log\r?\n\r?\n)(\|[\s\S]*?)(\r?\n---|\r?\n## |$)/;
			const match = original.match( tableRegex );
			if ( match ) {
				const newline = original.includes( '\r\n' ) ? '\r\n' : '\n';
				const cleanTable = [
					'| Number | Title | Status | Date | Supersedes / Superseded by |',
					'| :---: | :--- | :---: | :---: | :--- |',
					`| [ADR-0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | ${ date } | — |`,
				].join( newline );

				const updated = original.replace(
					tableRegex,
					`$1${ cleanTable }${ newline }$3`
				);

				if ( updated !== original ) {
					filesToModify.push( {
						path: readmePath,
						relativePath: normalizePath( root, readmePath ),
						before: original,
						after: updated,
					} );
				}
			}
			continue;
		}

		// Delete all other 0002..9999 ADR files
		if ( /^\d{4}[-_]/i.test( entry.name ) ) {
			const absPath = join( adrDir, entry.name );
			const original = await readFile( absPath, 'utf8' );
			const fileStat = await stat( absPath );
			filesToDelete.push( {
				path: absPath,
				relativePath: normalizePath( root, absPath ),
				content: original,
				mode: fileStat.mode,
			} );
		}
	}

	return { filesToDelete, filesToModify };
}

/**
 * Clean historical implementation logs (docs/implementation-logs/*.md), keeping .gitkeep.
 */
export async function cleanImplementationLogs( { root } ) {
	const logsDir = join( root, 'docs/implementation-logs' );
	if ( ! ( await fileExists( logsDir ) ) ) {
		return { filesToDelete: [], filesToCreate: [] };
	}

	const filesToDelete = [];
	const filesToCreate = [];

	const entries = await readdir( logsDir, { withFileTypes: true } );
	let hasGitkeep = false;

	for ( const entry of entries ) {
		if ( entry.name === '.gitkeep' ) {
			hasGitkeep = true;
			continue;
		}

		if ( entry.isFile() && entry.name.endsWith( '.md' ) ) {
			const absPath = join( logsDir, entry.name );
			const content = await readFile( absPath, 'utf8' );
			const fileStat = await stat( absPath );
			filesToDelete.push( {
				path: absPath,
				relativePath: normalizePath( root, absPath ),
				content,
				mode: fileStat.mode,
			} );
		}
	}

	if ( ! hasGitkeep ) {
		const gitkeepPath = join( logsDir, '.gitkeep' );
		filesToCreate.push( {
			path: gitkeepPath,
			relativePath: normalizePath( root, gitkeepPath ),
			content: '',
		} );
	}

	return { filesToDelete, filesToCreate };
}

/**
 * Clean legacy decision logs if present (docs/decision-log.md).
 */
export async function cleanLegacyDecisionLog( { root } ) {
	const legacyLog = join( root, 'docs/decision-log.md' );
	if ( await fileExists( legacyLog ) ) {
		const content = await readFile( legacyLog, 'utf8' );
		const fileStat = await stat( legacyLog );
		return {
			path: legacyLog,
			relativePath: normalizePath( root, legacyLog ),
			content,
			mode: fileStat.mode,
		};
	}
	return null;
}
