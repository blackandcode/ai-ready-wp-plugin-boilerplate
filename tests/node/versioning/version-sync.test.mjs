import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { recordUnreleasedChange } from '../../../tools/changelog/record-unreleased-change.mjs';

const testDirectory = dirname( fileURLToPath( import.meta.url ) );
const projectRoot = resolve( testDirectory, '../../..' );
const fixtureRoot = join(
	projectRoot,
	'tests/fixtures/versioning/sample-plugin'
);
const cliPath = join( projectRoot, 'tools/versioning/increase-plugin-version.mjs' );
const changelogCliPath = join(
	projectRoot,
	'tools/changelog/record-unreleased-change.mjs'
);

async function createFixture() {
	const directory = await mkdtemp( join( tmpdir(), 'airwp-version-sync-' ) );
	await cp( fixtureRoot, directory, { recursive: true } );
	return directory;
}

function runCli( root, args = [] ) {
	return spawnSync(
		process.execPath,
		[ cliPath, '--root', root, '--env', 'version.env', ...args ],
		{
			cwd: projectRoot,
			encoding: 'utf8',
		}
	);
}

function runCliWithoutEnv( root, args = [] ) {
	return spawnSync(
		process.execPath,
		[ cliPath, '--root', root, '--env', 'nonexistent.env', ...args ],
		{
			cwd: projectRoot,
			encoding: 'utf8',
		}
	);
}

function runChangelogCli( root, args = [] ) {
	return spawnSync(
		process.execPath,
		[ changelogCliPath, '--root', root, ...args ],
		{
			cwd: projectRoot,
			encoding: 'utf8',
		}
	);
}

test( 'updates WordPress, PHP, npm, Composer, docs, and changelog (legacy env)', async () => {
	const root = await createFixture();
	try {
		const result = runCli( root );
		assert.equal( result.status, 0, result.stderr );
		assert.match( result.stdout, /1\.2\.3 -> 1\.3\.0/ );

		const packageJson = JSON.parse(
			await readFile( join( root, 'package.json' ), 'utf8' )
		);
		assert.equal( packageJson.version, '1.3.0' );
		assert.equal(
			packageJson.dependencies[
				'dependency-that-coincidentally-matches'
			],
			'1.2.3'
		);

		const packageLock = JSON.parse(
			await readFile( join( root, 'package-lock.json' ), 'utf8' )
		);
		assert.equal( packageLock.version, '1.3.0' );
		assert.equal( packageLock.packages[ '' ].version, '1.3.0' );
		assert.equal(
			packageLock.packages[
				'node_modules/dependency-that-coincidentally-matches'
			].version,
			'1.2.3'
		);

		const composer = JSON.parse(
			await readFile( join( root, 'composer.json' ), 'utf8' )
		);
		assert.equal( composer.version, '1.3.0' );

		const plugin = await readFile(
			join( root, 'sample-wordpress-plugin.php' ),
			'utf8'
		);
		assert.match( plugin, /Version: 1\.3\.0/ );
		assert.match( plugin, /SAMPLE_PLUGIN_VERSION', '1\.3\.0'/ );

		const readme = await readFile( join( root, 'readme.txt' ), 'utf8' );
		assert.match( readme, /Stable tag: 1\.3\.0/ );

		const docs = await readFile(
			join( root, 'docs/current-version.md' ),
			'utf8'
		);
		assert.match( docs, /`1\.3\.0`/ );
		assert.match( docs, /`v1\.3\.0`/ );

		const envExample = await readFile(
			join( root, '.env.example' ),
			'utf8'
		);
		assert.match( envExample, /VERSION=1\.3\.0/ );

		const changelog = await readFile(
			join( root, 'CHANGELOG.md' ),
			'utf8'
		);
		assert.match( changelog, /## \[1\.3\.0\] - 2026-08-01/ );
		assert.match( changelog, /A release candidate feature/ );
		assert.match( changelog, /## \[1\.2\.3\] - 2026-07-20/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'dry run reports changes without modifying files', async () => {
	const root = await createFixture();
	try {
		const before = await readFile( join( root, 'package.json' ), 'utf8' );
		const result = runCli( root, [ '--dry-run' ] );
		assert.equal( result.status, 0, result.stderr );
		assert.match( result.stdout, /Dry run completed/i );
		assert.equal(
			await readFile( join( root, 'package.json' ), 'utf8' ),
			before
		);
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'handles target version already implemented gracefully', async () => {
	const root = await createFixture();
	try {
		await writeFile(
			join( root, 'version.env' ),
			'TARGET_VERSION=1.2.3\n',
			'utf8'
		);
		const result = runCli( root );
		assert.equal( result.status, 0, result.stderr );
		assert.match(
			result.stdout,
			/Target version 1\.2\.3 is already implemented/
		);
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'rejects a lower target version by default', async () => {
	const root = await createFixture();
	try {
		await writeFile(
			join( root, 'version.env' ),
			'TARGET_VERSION=1.2.0\n',
			'utf8'
		);
		const result = runCli( root );
		assert.equal( result.status, 1 );
		assert.match( result.stderr, /lower than current version/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'rejects an invalid semantic version', async () => {
	const root = await createFixture();
	try {
		await writeFile(
			join( root, 'version.env' ),
			'TARGET_VERSION=release-next\n',
			'utf8'
		);
		const result = runCli( root );
		assert.equal( result.status, 1 );
		assert.match( result.stderr, /Invalid semantic version/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'rejects a duplicate changelog release entry', async () => {
	const root = await createFixture();
	try {
		const changelogPath = join( root, 'CHANGELOG.md' );
		const changelog = await readFile( changelogPath, 'utf8' );
		await writeFile(
			changelogPath,
			`${ changelog }\n## [1.3.0] - 2026-08-01\n`,
			'utf8'
		);
		const result = runCli( root );
		assert.equal( result.status, 1 );
		assert.match( result.stderr, /already contains version 1\.3\.0/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'updates version via positional CLI argument without .env', async () => {
	const root = await createFixture();
	try {
		const result = runCliWithoutEnv( root, [
			'1.4.0',
			'--date',
			'2026-09-08',
		] );
		assert.equal( result.status, 0, result.stderr );
		assert.match( result.stdout, /1\.2\.3 -> 1\.4\.0/ );

		const packageJson = JSON.parse(
			await readFile( join( root, 'package.json' ), 'utf8' )
		);
		assert.equal( packageJson.version, '1.4.0' );

		const changelog = await readFile(
			join( root, 'CHANGELOG.md' ),
			'utf8'
		);
		assert.match( changelog, /## \[1\.4\.0\] - 2026-09-08/ );
		assert.match( changelog, /A release candidate feature/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'calculates patch bump via --bump patch without .env', async () => {
	const root = await createFixture();
	try {
		const result = runCliWithoutEnv( root, [
			'--bump',
			'patch',
			'--date',
			'2026-09-08',
		] );
		assert.equal( result.status, 0, result.stderr );
		assert.match( result.stdout, /1\.2\.3 -> 1\.2\.4/ );

		const packageJson = JSON.parse(
			await readFile( join( root, 'package.json' ), 'utf8' )
		);
		assert.equal( packageJson.version, '1.2.4' );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'calculates minor bump via positional argument without .env', async () => {
	const root = await createFixture();
	try {
		const result = runCliWithoutEnv( root, [
			'minor',
			'--date',
			'2026-09-08',
		] );
		assert.equal( result.status, 0, result.stderr );
		assert.match( result.stdout, /1\.2\.3 -> 1\.3\.0/ );

		const packageJson = JSON.parse(
			await readFile( join( root, 'package.json' ), 'utf8' )
		);
		assert.equal( packageJson.version, '1.3.0' );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'calculates major bump via --bump major without .env', async () => {
	const root = await createFixture();
	try {
		const result = runCliWithoutEnv( root, [
			'--bump',
			'major',
			'--date',
			'2026-09-08',
		] );
		assert.equal( result.status, 0, result.stderr );
		assert.match( result.stdout, /1\.2\.3 -> 2\.0\.0/ );

		const packageJson = JSON.parse(
			await readFile( join( root, 'package.json' ), 'utf8' )
		);
		assert.equal( packageJson.version, '2.0.0' );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'combines custom changelog message with unreleased notes', async () => {
	const root = await createFixture();
	try {
		const result = runCliWithoutEnv( root, [
			'--target-version',
			'1.3.0',
			'-m',
			'Custom release headline note',
			'--date',
			'2026-09-08',
		] );
		assert.equal( result.status, 0, result.stderr );

		const changelog = await readFile(
			join( root, 'CHANGELOG.md' ),
			'utf8'
		);
		assert.match( changelog, /## \[1\.3\.0\] - 2026-09-08/ );
		assert.match( changelog, /Custom release headline note/ );
		assert.match( changelog, /A release candidate feature/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'fails with clear message when no target version or bump is provided and no .env exists', async () => {
	const root = await createFixture();
	try {
		const result = runCliWithoutEnv( root, [] );
		assert.equal( result.status, 1 );
		assert.match( result.stderr, /Target version is required/ );
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );

test( 'recordUnreleasedChange pure function adds entries under correct category', () => {
	const initial =
		'# Changelog\n\n## [Unreleased]\n\n## [1.1.0] - 2026-08-01\n';
	const updated1 = recordUnreleasedChange( initial, {
		type: 'Added',
		message: 'First new feature',
	} );
	assert.match(
		updated1,
		/## \[Unreleased\]\n\n### Added\n\n- First new feature/
	);

	const updated2 = recordUnreleasedChange( updated1, {
		type: 'Added',
		message: 'Second new feature',
	} );
	assert.match( updated2, /- First new feature\n- Second new feature/ );

	const updated3 = recordUnreleasedChange( updated2, {
		type: 'Fixed',
		message: 'Resolved edge case bug',
	} );
	assert.match(
		updated3,
		/### Added\n\n- First new feature\n- Second new feature\n\n### Fixed\n\n- Resolved edge case bug/
	);
} );

test( 'record-unreleased-change CLI helper appends bullets and packages cleanly on release', async () => {
	const root = await createFixture();
	try {
		// Add an unreleased change using the CLI helper
		const addResult = runChangelogCli( root, [
			'-t',
			'Fixed',
			'Fixed admin sidebar toggle in RTL mode',
		] );
		assert.equal( addResult.status, 0, addResult.stderr );
		assert.match( addResult.stdout, /Successfully recorded unreleased/ );

		const changelogAfterAdd = await readFile(
			join( root, 'CHANGELOG.md' ),
			'utf8'
		);
		assert.match(
			changelogAfterAdd,
			/Fixed admin sidebar toggle in RTL mode/
		);

		// Now execute a patch release
		const releaseResult = runCliWithoutEnv( root, [
			'patch',
			'--date',
			'2026-09-08',
		] );
		assert.equal( releaseResult.status, 0, releaseResult.stderr );

		const changelogAfterRelease = await readFile(
			join( root, 'CHANGELOG.md' ),
			'utf8'
		);
		// Release header was created
		assert.match( changelogAfterRelease, /## \[1\.2\.4\] - 2026-09-08/ );
		// Both previous unreleased feature and newly added fix are packaged into 1.2.4
		assert.match( changelogAfterRelease, /A release candidate feature/ );
		assert.match(
			changelogAfterRelease,
			/Fixed admin sidebar toggle in RTL mode/
		);
		// Unreleased section is empty at top
		assert.match(
			changelogAfterRelease,
			/## \[Unreleased\]\n\n## \[1\.2\.4\]/
		);
	} finally {
		await rm( root, { recursive: true, force: true } );
	}
} );
