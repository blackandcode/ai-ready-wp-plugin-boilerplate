#!/usr/bin/env node

/**
 * set-adr-status.mjs
 *
 * Safely changes the lifecycle status of an Architecture Decision Record.
 *
 * Capabilities:
 * - Finds ADR by sequence number, filename, or relative path
 * - Safely updates Status header (supports bullet, inline, and frontmatter styles)
 * - Supports bidirectional supersession linking:
 *     old ADR gets "Superseded by: [ADR-YYYY](...)"
 *     new ADR gets "Supersedes: [ADR-XXXX](...)"
 * - Optionally updates status in index table (README.md)
 * - Appends dated transition rationale without rewriting historical decision text
 * - Supports --dry-run and --json
 * - Zero external dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { detectAdrConventions } from './detect-adr-conventions.mjs';

function toPosix(p) {
  return p.split(path.sep).join('/');
}

const VALID_STATUSES = ['proposed', 'accepted', 'rejected', 'deprecated', 'superseded'];

function parseArgs(argv) {
  const args = {
    targetDir: '.',
    adr: null,
    status: null,
    supersededBy: null,
    supersedes: null,
    reason: null,
    dir: null,
    updateIndex: false,
    dryRun: false,
    json: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--update-index') {
      args.updateIndex = true;
    } else if (arg === '--adr' || arg === '-a') {
      args.adr = argv[++i];
    } else if (arg === '--status' || arg === '-s') {
      args.status = (argv[++i] || '').toLowerCase();
    } else if (arg === '--superseded-by') {
      args.supersededBy = argv[++i];
    } else if (arg === '--supersedes') {
      args.supersedes = argv[++i];
    } else if (arg === '--reason' || arg === '-r') {
      args.reason = argv[++i];
    } else if (arg === '--dir' || arg === '-d') {
      args.dir = argv[++i];
    } else if (!arg.startsWith('-') && !args.adr) {
      args.adr = arg;
    }
  }

  return args;
}

function printHelp() {
  process.stdout.write(`Usage: node set-adr-status.mjs --adr <id|path> --status <status> [options]

Options:
  --adr, -a <id|path>         Target ADR sequence number, filename, or path (required)
  --status, -s <status>       New status: proposed | accepted | rejected | deprecated | superseded (required)
  --superseded-by <id|path>   Successor ADR when marking as superseded
  --supersedes <id|path>      Prior ADR that this record replaces
  --reason, -r <text>         Reason for status transition
  --dir, -d <path>            ADR directory override
  --update-index              Update status in README index table
  --dry-run                   Simulate update without modifying files
  --json                      Output results as formatted JSON
  --help, -h                  Show this help message
`);
}

function resolveAdrFile(absRoot, adrInput, adrDir) {
  // If adrInput is an existing file directly
  const directPath = path.resolve(absRoot, adrInput);
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return directPath;
  }

  const conventions = detectAdrConventions(absRoot, adrDir);
  const searchDir = conventions.hasAdrDirectory ? path.join(absRoot, conventions.adrDirectory) : path.join(absRoot, 'docs/adr');

  if (!fs.existsSync(searchDir)) return null;

  const files = fs.readdirSync(searchDir).filter((f) => f.endsWith('.md') && !f.toLowerCase().includes('readme'));

  // Normalize adrInput: strip "ADR-", leading zeros, etc.
  const cleanInput = String(adrInput).trim().replace(/^ADR-/i, '');
  const isNumeric = /^\d+$/.test(cleanInput);
  const targetNum = isNumeric ? parseInt(cleanInput, 10) : null;

  for (const f of files) {
    if (f.toLowerCase() === adrInput.toLowerCase()) {
      return path.join(searchDir, f);
    }
    const match = f.match(/^(\d+)-/);
    if (match) {
      if (isNumeric && parseInt(match[1], 10) === targetNum) {
        return path.join(searchDir, f);
      }
      if (match[1] === cleanInput) {
        return path.join(searchDir, f);
      }
    }
    if (f.includes(cleanInput)) {
      return path.join(searchDir, f);
    }
  }

  return null;
}

function updateStatusInContent(content, newStatus, supersededByLink = null, supersedesLink = null, reason = null) {
  let updated = content;
  const today = new Date().toISOString().slice(0, 10);

  // 1. Update status
  const bulletPattern = /(-\s+\*\*Status:\*\*|\bStatus:\s*|\bstatus:\s*)([^\r\n]+)/i;
  if (bulletPattern.test(updated)) {
    updated = updated.replace(bulletPattern, `$1 ${newStatus}`);
  }

  // 2. Update Superseded by link if supplied
  if (supersededByLink) {
    const supByPattern = /(?:-\s+\*\*Superseded by:\*\*|\bSuperseded by:\s*)([^\r\n]+)/i;
    if (supByPattern.test(updated)) {
      updated = updated.replace(supByPattern, `- **Superseded by:** ${supersededByLink}`);
    } else {
      // Append if related section exists
      updated = updated.replace(/(## Related Decisions[\s\S]*?)(?=\n##|\n---|$)/i, `$1\n- **Superseded by:** ${supersededByLink}`);
    }
  }

  // 3. Update Supersedes link if supplied
  if (supersedesLink) {
    const supPattern = /(?:-\s+\*\*Supersedes:\*\*|\bSupersedes:\s*)([^\r\n]+)/i;
    if (supPattern.test(updated)) {
      updated = updated.replace(supPattern, `- **Supersedes:** ${supersedesLink}`);
    } else {
      updated = updated.replace(/(## Related Decisions[\s\S]*?)(?=\n##|\n---|$)/i, `$1\n- **Supersedes:** ${supersedesLink}`);
    }
  }

  // 4. Append reason / transition note if provided
  if (reason) {
    const note = `\n\n### Status Transition (${today})\n- **Changed to:** \`${newStatus}\`\n- **Reason:** ${reason}\n`;
    if (updated.includes('## Additional Information')) {
      updated = updated.replace('## Additional Information', `## Additional Information${note}`);
    } else if (updated.includes('## Implementation References')) {
      updated = updated.replace('## Implementation References', `## Status History${note}\n## Implementation References`);
    } else {
      updated += note;
    }
  }

  return updated;
}

function updateIndexStatus(absIndexFile, fileName, newStatus) {
  if (!fs.existsSync(absIndexFile)) return false;
  let content = fs.readFileSync(absIndexFile, 'utf8');
  const baseName = path.basename(fileName);
  const capStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

  // Match table row containing fileName link
  const rowRegex = new RegExp(`(\\|\\s*\\[ADR-[^\\]]+\\]\\(${baseName}\\)\\s*\\|[^\\|]+\\|)\\s*([a-zA-Z]+)(\\s*\\|)`, 'i');
  if (rowRegex.test(content)) {
    content = content.replace(rowRegex, `$1 ${capStatus} $3`);
    fs.writeFileSync(absIndexFile, content, 'utf8');
    return true;
  }

  return false;
}

export function setAdrStatus(targetDir = '.', options = {}) {
  const absRoot = path.resolve(targetDir);
  const adrInput = options.adr;
  const newStatus = (options.status || '').toLowerCase().trim();

  if (!adrInput) {
    return { success: false, error: 'Target ADR is required (--adr <number|filename>).' };
  }

  if (!VALID_STATUSES.includes(newStatus)) {
    return {
      success: false,
      error: `Invalid status '${newStatus}'. Must be one of: ${VALID_STATUSES.join(', ')}`,
    };
  }

  const targetFile = resolveAdrFile(absRoot, adrInput, options.dir);
  if (!targetFile) {
    return { success: false, error: `Could not find ADR matching '${adrInput}'.` };
  }

  const dryRun = Boolean(options.dryRun);
  const originalContent = fs.readFileSync(targetFile, 'utf8');
  const relTargetFile = toPosix(path.relative(absRoot, targetFile));

  let supersededByLink = null;
  let linkedSuccessorFile = null;

  if (newStatus === 'superseded' && options.supersededBy) {
    const successorFile = resolveAdrFile(absRoot, options.supersededBy, options.dir);
    if (successorFile) {
      linkedSuccessorFile = toPosix(path.relative(absRoot, successorFile));
      const successorBase = path.basename(successorFile);
      const match = successorBase.match(/^(\d+)-/);
      const numTag = match ? `ADR-${match[1]}` : successorBase;
      supersededByLink = `[${numTag}](${successorBase})`;
    } else {
      supersededByLink = options.supersededBy;
    }
  }

  let supersedesLink = null;
  if (options.supersedes) {
    const priorFile = resolveAdrFile(absRoot, options.supersedes, options.dir);
    if (priorFile) {
      const priorBase = path.basename(priorFile);
      const match = priorBase.match(/^(\d+)-/);
      const numTag = match ? `ADR-${match[1]}` : priorBase;
      supersedesLink = `[${numTag}](${priorBase})`;
    } else {
      supersedesLink = options.supersedes;
    }
  }

  const updatedContent = updateStatusInContent(
    originalContent,
    newStatus,
    supersededByLink,
    supersedesLink,
    options.reason
  );

  let indexUpdated = false;

  if (!dryRun) {
    fs.writeFileSync(targetFile, updatedContent, 'utf8');

    // Also update successor ADR backlink if bidirectional
    if (linkedSuccessorFile && options.supersededBy) {
      const absSuccessor = path.join(absRoot, linkedSuccessorFile);
      if (fs.existsSync(absSuccessor)) {
        const succContent = fs.readFileSync(absSuccessor, 'utf8');
        const targetBase = path.basename(targetFile);
        const match = targetBase.match(/^(\d+)-/);
        const priorTag = match ? `ADR-${match[1]}` : targetBase;
        const backLink = `[${priorTag}](${targetBase})`;
        const updatedSucc = updateStatusInContent(succContent, 'accepted', null, backLink, null);
        fs.writeFileSync(absSuccessor, updatedSucc, 'utf8');
      }
    }

    if (options.updateIndex) {
      const conventions = detectAdrConventions(absRoot, options.dir);
      if (conventions.indexFile) {
        const absIndex = path.join(absRoot, conventions.indexFile);
        indexUpdated = updateIndexStatus(absIndex, targetFile, newStatus);
      }
    }
  }

  return {
    success: true,
    dryRun,
    targetFile: relTargetFile,
    status: newStatus,
    supersededBy: supersededByLink,
    supersedes: supersedesLink,
    indexUpdated,
    message: dryRun
      ? `[DRY-RUN] Would update status of ${relTargetFile} to '${newStatus}'`
      : `Successfully updated status of ${relTargetFile} to '${newStatus}'`,
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.adr || !args.status) {
    process.stderr.write("ERROR: Both --adr and --status are required.\n");
    process.exit(1);
  }

  const result = setAdrStatus(args.targetDir, {
    adr: args.adr,
    status: args.status,
    supersededBy: args.supersededBy,
    supersedes: args.supersedes,
    reason: args.reason,
    dir: args.dir,
    updateIndex: args.updateIndex,
    dryRun: args.dryRun,
  });

  if (args.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    if (result.success) {
      process.stdout.write(`${result.message}\n`);
      if (result.supersededBy) {
        process.stdout.write(`  Superseded by: ${result.supersededBy}\n`);
      }
      if (result.indexUpdated) {
        process.stdout.write(`  Index updated: YES\n`);
      }
    } else {
      process.stderr.write(`ERROR: ${result.error}\n`);
      process.exit(1);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main();
}
