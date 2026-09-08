#!/usr/bin/env node

/**
 * new-adr.mjs
 *
 * Deterministically creates a new Architecture Decision Record file
 * using project conventions, templates, and collision-free numbering.
 *
 * Capabilities:
 * - Auto-detects ADR directory, numbering format, and index file
 * - Converts title to clean, present-tense imperative slug
 * - Populates metadata (Date, Status, Deciders, Supersedes)
 * - Supports Simple and MADR templates
 * - Optionally updates the ADR index table in README.md
 * - Supports --dry-run and --json
 * - Zero external dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { detectAdrConventions } from './detect-adr-conventions.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '') || 'decision';
}

function parseArgs(argv) {
  const args = {
    targetDir: '.',
    title: null,
    template: 'simple', // simple | madr
    status: 'proposed',
    deciders: 'Development Team & AI Coding Agents',
    consulted: 'Architecture Stakeholders',
    informed: 'All Contributors',
    dir: null,
    supersedes: null,
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
    } else if (arg === '--title' || arg === '-t') {
      args.title = argv[++i];
    } else if (arg === '--template') {
      args.template = (argv[++i] || 'simple').toLowerCase();
    } else if (arg === '--status') {
      args.status = (argv[++i] || 'proposed').toLowerCase();
    } else if (arg === '--deciders') {
      args.deciders = argv[++i];
    } else if (arg === '--supersedes') {
      args.supersedes = argv[++i];
    } else if (arg === '--dir' || arg === '-d') {
      args.dir = argv[++i];
    } else if (!arg.startsWith('-') && !args.title) {
      args.title = arg;
    }
  }

  return args;
}

function printHelp() {
  process.stdout.write(`Usage: node new-adr.mjs --title "<Decision Title>" [options]

Options:
  --title, -t <title>     Title of the architectural decision (required)
  --template <name>       Template to use: simple | madr (default: simple)
  --status <status>       Initial status: proposed | accepted (default: proposed)
  --deciders <string>     Decision owners / deciders list
  --supersedes <num/path> Prior ADR that this decision supersedes
  --dir, -d <path>        ADR directory override (default: auto-detected or docs/adr)
  --update-index          Automatically append new record to index table
  --dry-run               Simulate creation without writing any files
  --json                  Output results as formatted JSON
  --help, -h              Show this help message
`);
}

function getTemplatePath(templateName) {
  const baseName = templateName === 'madr' ? 'adr-madr.md' : 'adr-simple.md';
  const localAsset = path.resolve(__dirname, '..', 'assets', baseName);
  if (fs.existsSync(localAsset)) return localAsset;

  // Fallback if assets are moved
  return path.resolve(__dirname, 'assets', baseName);
}

function formatIndexRow(numStr, slugName, title, status, date, supersedes) {
  const capStatus = status.charAt(0).toUpperCase() + status.slice(1);
  const supersedesText = supersedes ? `Supersedes ${supersedes}` : '—';
  return `| [ADR-${numStr}](${numStr}-${slugName}.md) | ${title} | ${capStatus} | ${date} | ${supersedesText} |`;
}

function appendToIndexFile(absIndexFile, rowText) {
  if (!fs.existsSync(absIndexFile)) return false;
  let content = fs.readFileSync(absIndexFile, 'utf8');

  // Look for the table separator line |:---:|:---|...
  const tableIndex = content.lastIndexOf('|:---:|');
  if (tableIndex !== -1) {
    const endOfSepLine = content.indexOf('\n', tableIndex);
    if (endOfSepLine !== -1) {
      // Find end of current table
      let insertPos = content.indexOf('\n\n', endOfSepLine);
      if (insertPos === -1) insertPos = content.length;
      content = content.slice(0, insertPos) + '\n' + rowText + content.slice(insertPos);
      fs.writeFileSync(absIndexFile, content, 'utf8');
      return true;
    }
  }

  // Fallback: append to end of file
  content += '\n' + rowText + '\n';
  fs.writeFileSync(absIndexFile, content, 'utf8');
  return true;
}

export function createNewAdr(targetDir = '.', options = {}) {
  const absRoot = path.resolve(targetDir);
  const title = (options.title || '').trim();

  if (!title) {
    return { success: false, error: 'A decision title is required (e.g. --title "Adopt Action Scheduler")' };
  }

  const conventions = detectAdrConventions(absRoot, options.dir);
  const adrRelDir = conventions.hasAdrDirectory ? conventions.adrDirectory : (options.dir || 'docs/adr');
  const absAdrDir = path.join(absRoot, adrRelDir);

  const numStr = conventions.nextFormattedNumber;
  const numInt = conventions.nextNumber;
  const slug = slugify(title);
  const fileName = `${numStr}-${slug}.md`;
  const relFilePath = toPosix(path.join(adrRelDir, fileName));
  const absFilePath = path.join(absRoot, relFilePath);

  if (fs.existsSync(absFilePath)) {
    return { success: false, error: `File collision: '${relFilePath}' already exists.` };
  }

  const templateName = options.template === 'madr' ? 'madr' : 'simple';
  const templatePath = getTemplatePath(templateName);

  if (!fs.existsSync(templatePath)) {
    return { success: false, error: `Template file not found at: ${templatePath}` };
  }

  let templateContent = fs.readFileSync(templatePath, 'utf8');
  const today = new Date().toISOString().slice(0, 10);
  const status = (options.status || 'proposed').toLowerCase();
  const deciders = options.deciders || 'Development Team & AI Coding Agents';
  const consulted = options.consulted || 'Architecture Stakeholders';
  const informed = options.informed || 'All Contributors';
  const supersedes = options.supersedes || 'None';

  // Replace placeholders
  templateContent = templateContent
    .replace(/\{\{NUMBER\}\}/g, numStr)
    .replace(/\{\{TITLE\}\}/g, title)
    .replace(/\{\{STATUS\}\}/g, status)
    .replace(/\{\{DATE\}\}/g, today)
    .replace(/\{\{DECIDERS\}\}/g, deciders)
    .replace(/\{\{CONSULTED\}\}/g, consulted)
    .replace(/\{\{INFORMED\}\}/g, informed)
    .replace(/\{\{SUPERSEDES\}\}/g, supersedes)
    .replace(/\{\{SUPERSEDED_BY\}\}/g, 'None')
    .replace(/\{\{RELATED_ADRS\}\}/g, 'None')
    .replace(/\{\{ENTRY_POINT\}\}/g, 'TBD')
    .replace(/\{\{ISSUE_PR\}\}/g, 'TBD')
    .replace(/\{\{VERIFICATION_COMMAND\}\}/g, 'composer test')
    .replace(/\{\{OPTION_1_NAME\}\}/g, 'Option 1')
    .replace(/\{\{OPTION_2_NAME\}\}/g, 'Option 2')
    .replace(/\{\{OPTION_3_NAME\}\}/g, 'Option 3')
    .replace(/\{\{CHOSEN_OPTION\}\}/g, 'Option 1');

  const dryRun = Boolean(options.dryRun);
  let indexUpdated = false;

  if (!dryRun) {
    fs.mkdirSync(absAdrDir, { recursive: true });
    fs.writeFileSync(absFilePath, templateContent, 'utf8');

    if (options.updateIndex && conventions.indexFile) {
      const absIndex = path.join(absRoot, conventions.indexFile);
      const row = formatIndexRow(numStr, slug, title, status, today, supersedes !== 'None' ? supersedes : null);
      indexUpdated = appendToIndexFile(absIndex, row);
    }
  }

  return {
    success: true,
    dryRun,
    number: numInt,
    formattedNumber: numStr,
    title,
    fileName,
    filePath: relFilePath,
    template: templateName,
    status,
    indexUpdated,
    message: dryRun
      ? `[DRY-RUN] Would create ADR: ${relFilePath}`
      : `Successfully created ADR: ${relFilePath}`,
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.title) {
    process.stderr.write("ERROR: Missing required option --title (e.g. --title \"Adopt Action Scheduler\")\n");
    process.exit(1);
  }

  const result = createNewAdr(args.targetDir, {
    title: args.title,
    template: args.template,
    status: args.status,
    deciders: args.deciders,
    supersedes: args.supersedes,
    dir: args.dir,
    updateIndex: args.updateIndex,
    dryRun: args.dryRun,
  });

  if (args.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    if (result.success) {
      process.stdout.write(`${result.message}\n`);
      process.stdout.write(`  Number: ADR-${result.formattedNumber}\n`);
      process.stdout.write(`  Template: ${result.template}\n`);
      process.stdout.write(`  Status: ${result.status}\n`);
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
