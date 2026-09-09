#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, realpathSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const PROTECTED_IN_TREE_SKILLS = new Set( [
	'versioning',
	'changelog',
	'wp-admin-ui-ux',
	'wp-openapi-spec-writer',
] );

const SOURCES = [
	{
		repo: 'https://github.com/WordPress/agent-skills.git',
		branch: 'trunk',
		skillsDir: 'skills',
		skills: [
			'wordpress-router',
			'wp-project-triage',
			'wp-plugin-development',
			'wp-rest-api',
			'wp-phpstan',
			'wp-wpcli-and-ops',
			'wp-plugin-directory-guidelines',
			'wp-playground',
			'blueprint',
			'wp-block-development',
			'wp-block-themes',
			'wp-interactivity-api',
			'wpds',
		],
	},
	{
		repo: 'https://github.com/luckys/agent-skills.git',
		branch: 'main',
		skillsDir: 'skills',
		skills: [
			'ddd-best-practices',
			'oop-best-practices',
			'design-patterns-best-practices',
			'tdd-best-practices',
			'refactoring-best-practices',
		],
	},
	{
		repo: 'https://github.com/bruno-collections/bruno-agent-skills.git',
		branch: 'main',
		skillsDir: '',
		skills: [
			'bruno-collection-generator',
			'bruno-test-writer',
			'bruno-ci-setup',
		],
	},
	{
		repo: 'https://github.com/blackandcode/wp-architecture-decision-records.git',
		branch: 'main',
		skillsDir: '',
		skills: [ 'wp-architecture-decision-records' ],
	},
];

const RAW_TARGETS = [
	resolve( process.cwd(), '.cursor/skills' ),
	resolve( process.cwd(), '.agents/skills' ),
];

// Deduplicate targets if symlinked (e.g. .agents -> .cursor)
const seenPaths = new Set();
const TARGET_DIRECTORIES = RAW_TARGETS.filter( ( targetPath ) => {
	const real = existsSync( targetPath )
		? realpathSync( targetPath )
		: targetPath;
	if ( seenPaths.has( real ) ) {
		return false;
	}
	seenPaths.add( real );
	return true;
} );

for ( const targetDir of TARGET_DIRECTORIES ) {
	mkdirSync( targetDir, { recursive: true } );
}

console.log( 'Synchronizing external agent skills...' );

for ( const source of SOURCES ) {
	const tempCloneDir = join(
		tmpdir(),
		`skills-${ Date.now() }-${ Math.random().toString( 36 ).slice( 2 ) }`
	);
	try {
		console.log( `Fetching from ${ source.repo }...` );
		execSync(
			`git clone --depth 1 --branch ${ source.branch } ${ source.repo } "${ tempCloneDir }"`,
			{
				stdio: [ 'ignore', 'ignore', 'inherit' ],
			}
		);

		for ( const skillName of source.skills ) {
			if ( PROTECTED_IN_TREE_SKILLS.has( skillName ) ) {
				console.warn(
					`  [Protected] Skipping '${ skillName }' because it is a protected in-tree skill.`
				);
				continue;
			}

			let isRootSkill = false;
			let sourceSkillPath = source.skillsDir
				? join( tempCloneDir, source.skillsDir, skillName )
				: join( tempCloneDir, skillName );

			if (
				! existsSync( sourceSkillPath ) &&
				existsSync( join( tempCloneDir, 'SKILL.md' ) )
			) {
				sourceSkillPath = tempCloneDir;
				isRootSkill = true;
			} else if ( ! existsSync( sourceSkillPath ) ) {
				console.warn(
					`Warning: skill '${ skillName }' not found in ${ source.repo }`
				);
				continue;
			}

			for ( const targetDir of TARGET_DIRECTORIES ) {
				const dest = join( targetDir, skillName );
				rmSync( dest, { recursive: true, force: true } );
				if ( isRootSkill ) {
					mkdirSync( dest, { recursive: true } );
					execSync( `cp -r "${ sourceSkillPath }/." "${ dest }/"` );
					rmSync( join( dest, '.git' ), {
						recursive: true,
						force: true,
					} );
				} else {
					execSync( `cp -r "${ sourceSkillPath }" "${ dest }"` );
				}
			}
			console.log( `  - Synced: ${ skillName }` );
		}
	} catch ( err ) {
		console.error( `Failed to sync from ${ source.repo }:`, err.message );
	} finally {
		rmSync( tempCloneDir, { recursive: true, force: true } );
	}
}

console.log( 'Verifying in-tree protected skills integrity...' );
for ( const targetDir of TARGET_DIRECTORIES ) {
	for ( const protectedSkill of PROTECTED_IN_TREE_SKILLS ) {
		const protectedSkillFile = join(
			targetDir,
			protectedSkill,
			'SKILL.md'
		);
		if ( ! existsSync( protectedSkillFile ) ) {
			throw new Error(
				`Integrity check failed: Protected in-tree skill '${ protectedSkill }' missing at ${ protectedSkillFile }`
			);
		}
	}
}
console.log( 'All protected in-tree skills verified successfully.' );

console.log( 'Skill synchronization completed successfully.' );
