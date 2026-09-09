#!/usr/bin/env node

/**
 * bootstrap-adrs.mjs
 *
 * Safely bootstraps the ADR directory, registry index, and foundational
 * ADR-0001 ("Record architecture decisions") in a repository.
 *
 * Safety guarantees:
 * - Non-destructive: Aborts if ADRs already exist unless --force is provided.
 * - Supports --dry-run for pre-flight simulation.
 * - Emits structured JSON via --json for agent integration.
 * - Zero external dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

function toPosix( p ) {
	return p.split( path.sep ).join( '/' );
}

function parseArgs( argv ) {
	const args = {
		targetDir: '.',
		adrDir: 'docs/adr',
		dryRun: false,
		force: false,
		json: false,
		help: false,
	};

	for ( let i = 2; i < argv.length; i++ ) {
		const arg = argv[ i ];
		if ( arg === '--help' || arg === '-h' ) {
			args.help = true;
		} else if ( arg === '--json' ) {
			args.json = true;
		} else if ( arg === '--dry-run' ) {
			args.dryRun = true;
		} else if ( arg === '--force' ) {
			args.force = true;
		} else if ( arg === '--dir' || arg === '-d' ) {
			args.adrDir = argv[ ++i ] || 'docs/adr';
		} else if ( ! arg.startsWith( '-' ) ) {
			args.targetDir = arg;
		}
	}

	return args;
}

function printHelp() {
	process.stdout
		.write( `Usage: node bootstrap-adrs.mjs [options] [target-directory]

Options:
  --dir, -d <path>   ADR directory to create (default: docs/adr)
  --dry-run          Simulate creation without writing any files
  --force            Force initialization even if files exist
  --json             Output results as formatted JSON
  --help, -h         Show this help message
` );
}

function getInitialAdr0001Content( today ) {
	return `# ADR-0001: Record architecture decisions

- **Status:** accepted
- **Date:** ${ today }
- **Deciders:** Development Team & AI Engineering Assistants
- **Consulted:** Architecture Stakeholders
- **Informed:** All Contributors

---

## Context

We need to record architectural, design, and structural decisions made in this WordPress plugin. Without an explicit, durable record of decisions, team members and autonomous AI coding agents lack visibility into past trade-offs, leading to repeated debates, accidental architectural drift, and regressions.

## Decision

We will capture all architecturally significant decisions using Architecture Decision Records (ADRs) stored directly in this repository under the version-controlled decision directory.

## Rationale

Storing ADRs as plain Markdown files in version control keeps architectural rationale co-located with the source code. Both human engineers and AI coding agents can read, verify, and consult past decisions before proposing modifications.

## Consequences

### Positive
- Decisions are documented close to the code, searchable, and version-tracked with Git history.
- AI coding agents can consult existing accepted ADRs to adhere strictly to project invariants.
- Historical context is preserved when developers or agents join the codebase.

### Negative & Trade-offs
- Slight overhead before making major architectural changes (interview, intent capture, review).
- Requires discipline to update statuses when decisions are superseded.

### Risks & Mitigations
- **Risk:** Stale records after refactoring.
  **Mitigation:** The ADR owns durable architectural decisions and invariants, not ephemeral file paths or line numbers.

## Non-Goals
- Recording trivial bug fixes, styling tweaks, cosmetic changes, or routine WordPress hook registrations.
- Serving as a temporary sprint task tracker or detailed work-order document.

## Architectural Constraints
- All architecturally significant changes must reference or create an ADR.
- Accepted ADRs are immutable historical records; modifying a past architectural choice requires drafting a new ADR that explicitly supersedes the prior one.

## Verification & Fitness Functions
- **Verification Mechanism:** Periodic repository audit using \`validate-adr.mjs\`.
- **Target Condition:** All ADRs have valid frontmatter, non-broken references, and status consistency.

## Reconsider When
- An alternative architectural record standard is officially adopted across the organization.

## Implementation References
- **Directory:** \`docs/adr/\`
- **Tooling:** \`wp-architecture-decision-records\` agent skill

## Related Decisions
- **Supersedes:** None
- **Superseded by:** None
- **Related ADRs:** None
`;
}

function getInitialIndexContent( today ) {
	return `# Architecture Decision Records

This directory contains the **Architecture Decision Records (ADRs)** for this project.

ADRs capture significant architectural decisions, their context, rationale, consequences, durable constraints, and verification mechanisms. They represent the **durable architectural memory** of the codebase.

---

## Decision Lifecycle

Decisions move through the following lifecycle states:

- **Proposed:** The ADR is currently under review and open for feedback. It does not yet constrain production implementation.
- **Accepted:** The ADR has been approved. Its architectural constraints and invariants are binding on all future code and AI agents.
- **Rejected:** The ADR was evaluated and declined. The record remains intact as historical documentation of why the approach was not taken.
- **Deprecated:** The decision is no longer enforced or relevant, but has not been directly superseded by a single replacement record.
- **Superseded:** A newer accepted ADR has replaced this decision. The record links forward to its replacement, and the replacement links back.

---

## Architectural Decision Log

| Number | Title | Status | Date | Supersedes / Superseded by |
|:---:|:---|:---:|:---:|:---|
| [ADR-0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | ${ today } | — |

---

## How to Propose an ADR

1. Check whether an existing accepted ADR already governs the architectural area.
2. Determine if the decision is **architecturally significant** (cross-cutting, difficult to reverse, data-model significant, security/performance sensitive).
3. Run the creation script or activate the \`wp-architecture-decision-records\` agent skill:
   \`\`\`bash
   node /path/to/scripts/new-adr.mjs --title "Your Decision Title"
   \`\`\`
4. Complete the intent capture and review checklist before submitting for team or agent consensus.
`;
}

export function bootstrapAdrs( targetDir = '.', options = {} ) {
	const absRoot = path.resolve( targetDir );
	const relDir = options.adrDir || 'docs/adr';
	const absDir = path.join( absRoot, relDir );
	const dryRun = Boolean( options.dryRun );
	const force = Boolean( options.force );

	const today = new Date().toISOString().slice( 0, 10 );
	const indexFileRel = toPosix( path.join( relDir, 'README.md' ) );
	const adr0001FileRel = toPosix(
		path.join( relDir, '0001-record-architecture-decisions.md' )
	);

	const absIndexFile = path.join( absRoot, indexFileRel );
	const absAdr0001File = path.join( absRoot, adr0001FileRel );

	// Check if directory already has ADRs
	if ( fs.existsSync( absDir ) && ! force ) {
		const existing = fs
			.readdirSync( absDir )
			.filter( ( f ) => f.endsWith( '.md' ) );
		if ( existing.length > 0 ) {
			return {
				success: false,
				error: `ADR directory '${ relDir }' already contains ${ existing.length } markdown file(s). Use --force to override.`,
				adrDirectory: relDir,
				existingFiles: existing,
			};
		}
	}

	const createdFiles = [ indexFileRel, adr0001FileRel ];

	if ( ! dryRun ) {
		fs.mkdirSync( absDir, { recursive: true } );
		fs.writeFileSync(
			absIndexFile,
			getInitialIndexContent( today ),
			'utf8'
		);
		fs.writeFileSync(
			absAdr0001File,
			getInitialAdr0001Content( today ),
			'utf8'
		);
	}

	return {
		success: true,
		dryRun,
		adrDirectory: relDir,
		createdFiles,
		message: dryRun
			? `[DRY-RUN] Would create ADR directory '${ relDir }' with index and ADR-0001.`
			: `Successfully bootstrapped ADR directory '${ relDir }' with index and ADR-0001.`,
	};
}

function main() {
	const args = parseArgs( process.argv );
	if ( args.help ) {
		printHelp();
		process.exit( 0 );
	}

	const result = bootstrapAdrs( args.targetDir, {
		adrDir: args.adrDir,
		dryRun: args.dryRun,
		force: args.force,
	} );

	if ( args.json ) {
		process.stdout.write( JSON.stringify( result, null, 2 ) + '\n' );
	} else if ( result.success ) {
		process.stdout.write( `${ result.message }\n` );
		for ( const f of result.createdFiles ) {
			process.stdout.write( `  + ${ f }\n` );
		}
	} else {
		process.stderr.write( `ERROR: ${ result.error }\n` );
		process.exit( 1 );
	}
}

if (
	process.argv[ 1 ] &&
	path.resolve( process.argv[ 1 ] ) ===
		path.resolve( new URL( import.meta.url ).pathname )
) {
	main();
}
