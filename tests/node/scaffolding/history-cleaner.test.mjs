import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
	cleanAdrs,
	cleanChangelog,
	cleanImplementationLogs,
	cleanLegacyDecisionLog,
	cleanReadmeChangelog,
} from '../../../tools/scaffolding/lib/history-cleaner.mjs';

test( 'cleanChangelog resets CHANGELOG.md to Keep a Changelog baseline', async () => {
	const dir = await mkdtemp( join( tmpdir(), 'clean-changelog-test-' ) );
	try {
		const original = `# Changelog

## [Unreleased]
### Added
- Some unreleased feature

## [1.4.0] - 2026-09-09
### Changed
- Huge legacy changelog with many versions
`;
		await writeFile( join( dir, 'CHANGELOG.md' ), original, 'utf8' );

		const result = await cleanChangelog( {
			root: dir,
			targetName: 'Acme Plugin',
			targetVersion: '1.0.0',
			date: '2026-09-14',
		} );

		assert.ok( result );
		assert.match( result.after, /# Changelog/ );
		assert.match( result.after, /## \[Unreleased\]/ );
		assert.match( result.after, /## \[1\.0\.0\] - 2026-09-14/ );
		assert.match( result.after, /- Initial release of Acme Plugin\./ );
		assert.doesNotMatch( result.after, /\[1\.3\.3\]/ );
		assert.doesNotMatch( result.after, /Some unreleased feature/ );
	} finally {
		await rm( dir, { recursive: true, force: true } );
	}
} );

test( 'cleanReadmeChangelog resets == Changelog == in readme.txt', async () => {
	const dir = await mkdtemp( join( tmpdir(), 'clean-readme-test-' ) );
	try {
		const original = `=== Sample Plugin ===
Stable tag: 1.4.0

== Changelog ==

= 1.4.0 =
* Big release.

= 1.0.0 =
* Initial release.

== Upgrade Notice ==
= 1.0.0 =
Upgrade immediately.
`;
		await writeFile( join( dir, 'readme.txt' ), original, 'utf8' );

		const result = await cleanReadmeChangelog( {
			root: dir,
			targetName: 'Acme Plugin',
			targetVersion: '1.0.0',
		} );

		assert.ok( result );
		assert.match( result.after, /== Changelog ==\s*=\s*1\.0\.0\s*=\s*\* Initial release of Acme Plugin\./ );
		assert.match( result.after, /== Upgrade Notice ==/ );
		assert.doesNotMatch( result.after, /= 1\.3\.3 =/ );
	} finally {
		await rm( dir, { recursive: true, force: true } );
	}
} );

test( 'cleanAdrs prunes 0002+ ADRs, preserves 0001, and resets README.md table', async () => {
	const dir = await mkdtemp( join( tmpdir(), 'clean-adrs-test-' ) );
	try {
		const adrDir = join( dir, 'docs/adr' );
		await mkdir( adrDir, { recursive: true } );

		await writeFile(
			join( adrDir, '0001-record-architecture-decisions.md' ),
			`# ADR-0001: Record architecture decisions\n- **Status:** accepted\n- **Date:** 2026-09-08\n## Context\nTest\n`,
			'utf8'
		);
		await writeFile(
			join( adrDir, '0002-di-container.md' ),
			`# ADR-0002: DI\n- **Status:** accepted\n`,
			'utf8'
		);
		await writeFile(
			join( adrDir, '0015-scaffold-pipeline.md' ),
			`# ADR-0015: Pipeline\n- **Status:** accepted\n`,
			'utf8'
		);
		await writeFile(
			join( adrDir, 'README.md' ),
			`# ADR Index\n\n## Architectural Decision Log\n\n| Number | Title | Status | Date | Supersedes / Superseded by |\n| :---: | :--- | :---: | :---: | :--- |\n| [ADR-0001](0001-record-architecture-decisions.md) | Record | Accepted | 2026-09-08 | — |\n| [ADR-0002](0002-di-container.md) | DI | Accepted | 2026-09-08 | — |\n\n---\n`,
			'utf8'
		);

		const result = await cleanAdrs( {
			root: dir,
			date: '2026-09-14',
		} );

		assert.equal( result.filesToDelete.length, 2 );
		const deletedNames = result.filesToDelete.map( ( f ) => f.relativePath );
		assert.ok( deletedNames.includes( 'docs/adr/0002-di-container.md' ) );
		assert.ok( deletedNames.includes( 'docs/adr/0015-scaffold-pipeline.md' ) );

		const modifiedReadme = result.filesToModify.find( ( f ) =>
			f.relativePath.endsWith( 'README.md' )
		);
		assert.ok( modifiedReadme );
		assert.match( modifiedReadme.after, /\[ADR-0001\]\(0001-record-architecture-decisions\.md\)/ );
		assert.doesNotMatch( modifiedReadme.after, /ADR-0002/ );
	} finally {
		await rm( dir, { recursive: true, force: true } );
	}
} );

test( 'cleanImplementationLogs deletes logs and generates .gitkeep', async () => {
	const dir = await mkdtemp( join( tmpdir(), 'clean-impl-test-' ) );
	try {
		const logsDir = join( dir, 'docs/implementation-logs' );
		await mkdir( logsDir, { recursive: true } );
		await writeFile( join( logsDir, '2026-09-09-phase-10.md' ), '# Log 10', 'utf8' );
		await writeFile( join( logsDir, '2026-09-09-phase-11.md' ), '# Log 11', 'utf8' );

		const result = await cleanImplementationLogs( { root: dir } );

		assert.equal( result.filesToDelete.length, 2 );
		assert.equal( result.filesToCreate.length, 1 );
		assert.equal( result.filesToCreate[ 0 ].relativePath, 'docs/implementation-logs/.gitkeep' );
	} finally {
		await rm( dir, { recursive: true, force: true } );
	}
} );

test( 'cleanLegacyDecisionLog targets docs/decision-log.md if present', async () => {
	const dir = await mkdtemp( join( tmpdir(), 'clean-legacy-test-' ) );
	try {
		await mkdir( join( dir, 'docs' ), { recursive: true } );
		await writeFile( join( dir, 'docs/decision-log.md' ), '# Legacy Log', 'utf8' );

		const result = await cleanLegacyDecisionLog( { root: dir } );
		assert.ok( result );
		assert.equal( result.relativePath, 'docs/decision-log.md' );
	} finally {
		await rm( dir, { recursive: true, force: true } );
	}
} );
