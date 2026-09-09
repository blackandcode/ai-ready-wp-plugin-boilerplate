import assert from 'node:assert/strict';
import test from 'node:test';
import { extractReleaseNotes } from '../../../tools/release/extract-release-notes.mjs';

const SAMPLE_CHANGELOG = `# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- Work in progress feature

## [1.3.2] - 2026-09-08

### Added
- Added new Gutenberg block and REST endpoint.

### Fixed
- Fixed null pointer in DI container.

## [1.3.2] - 2026-08-01

### Added
- Initial v1.3.2 changes.
`;

test( 'extractReleaseNotes extracts release markdown cleanly between version headers', () => {
	const res = extractReleaseNotes( SAMPLE_CHANGELOG, '1.3.2' );
	assert.equal( res.version, '1.3.2' );
	assert.equal( res.date, '2026-09-08' );
	assert.match( res.notes, /### Added/ );
	assert.match( res.notes, /Added new Gutenberg block/ );
	assert.match( res.notes, /### Fixed/ );
	assert.doesNotMatch( res.notes, /1\.1\.0/ );
	assert.doesNotMatch( res.notes, /Work in progress/ );
} );

test( 'extractReleaseNotes throws when target version is missing', () => {
	assert.throws(
		() => extractReleaseNotes( SAMPLE_CHANGELOG, '9.9.9' ),
		/Version \[9\.9\.9\] not found in CHANGELOG\.md/
	);
} );
