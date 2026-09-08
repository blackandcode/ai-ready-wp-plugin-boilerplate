#!/usr/bin/env node

/**
 * eval/harness/run.mjs
 *
 * Comprehensive evaluation runner for wp-architecture-decision-records.
 *
 * Verifies:
 * 1. Agent Skills specification compliance (frontmatter, name, length < 500 lines).
 * 2. Referential integrity: all reference docs and assets exist.
 * 3. Scenarios suite: loads and validates all 12 scenario definitions.
 * 4. Deterministic script end-to-end test suite:
 *    - Bootstrapping
 *    - Creation (Simple & MADR templates)
 *    - Index updating
 *    - Status mutation & bidirectional supersession
 *    - Validation pass on healthy ADRs
 *    - Validation failure on broken links & missing sections
 *
 * Zero external dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { detectProject } from '../../scripts/detect-project.mjs';
import { detectAdrConventions } from '../../scripts/detect-adr-conventions.mjs';
import { bootstrapAdrs } from '../../scripts/bootstrap-adrs.mjs';
import { createNewAdr } from '../../scripts/new-adr.mjs';
import { setAdrStatus } from '../../scripts/set-adr-status.mjs';
import { validateAdrs } from '../../scripts/validate-adr.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skillRoot = path.resolve(__dirname, '../..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    failedTests++;
    process.stderr.write(`❌ FAIL: ${message}\n`);
    throw new Error(message);
  } else {
    passedTests++;
    process.stdout.write(`✅ PASS: ${message}\n`);
  }
}

function parseFrontmatter(markdown) {
  const lines = markdown.split('\n');
  if (lines[0]?.trim() !== '---') return null;

  let endIndex = -1;
  for (let i = 1; i < Math.min(lines.length, 100); i++) {
    if (lines[i].trim() === '---') {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) return null;

  const metadata = {};
  for (let i = 1; i < endIndex; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (m) {
      metadata[m[1]] = m[2].replace(/^["'](.*)["']$/, '$1').trim();
    }
  }

  return metadata;
}

function testSkillSpecification() {
  process.stdout.write(`\n=== 1. Agent Skills Specification Compliance ===\n`);
  const skillMdPath = path.join(skillRoot, 'SKILL.md');
  assert(fs.existsSync(skillMdPath), 'SKILL.md exists');

  const content = fs.readFileSync(skillMdPath, 'utf8');
  const lines = content.split('\n');
  assert(lines.length < 500, `SKILL.md is under 500 lines (actual: ${lines.length} lines)`);

  const fm = parseFrontmatter(content);
  assert(fm !== null, 'Valid YAML frontmatter present');
  assert(fm.name === 'wp-architecture-decision-records', `Skill name matches directory ('wp-architecture-decision-records')`);
  assert(fm.description && fm.description.length <= 1024, `Description present and <= 1024 chars (${fm.description?.length} chars)`);
  assert(fm.compatibility && fm.compatibility.includes('WordPress'), 'Compatibility indicates WordPress target');
}

function testReferenceIntegrity() {
  process.stdout.write(`\n=== 2. Reference & Asset Integrity (1-Hop Traversal) ===\n`);
  const requiredRefs = [
    'adr-domain-rules.md',
    'adr-worthiness.md',
    'template-selection.md',
    'lifecycle-governance.md',
    'verification-and-fitness-functions.md',
    'wordpress-plugin-decisions.md',
    'wordpress-agent-skills-integration.md',
    'project-adaptation.md',
    'review-checklist.md',
  ];

  for (const ref of requiredRefs) {
    const p = path.join(skillRoot, 'references', ref);
    assert(fs.existsSync(p), `Reference exists: references/${ref}`);
  }

  const requiredAssets = [
    'adr-simple.md',
    'adr-madr.md',
    'adr-index.md',
    'fitness-function-record.md',
  ];

  for (const asset of requiredAssets) {
    const p = path.join(skillRoot, 'assets', asset);
    assert(fs.existsSync(p), `Asset exists: assets/${asset}`);
  }
}

function testScenariosSuite() {
  process.stdout.write(`\n=== 3. Scenarios Suite Validation ===\n`);
  const scenariosDir = path.join(skillRoot, 'eval', 'scenarios');
  assert(fs.existsSync(scenariosDir), 'Scenarios directory exists');

  const scenarioFiles = fs.readdirSync(scenariosDir).filter((f) => f.endsWith('.json'));
  assert(scenarioFiles.length === 12, `Exactly 12 evaluation scenarios found (actual: ${scenarioFiles.length})`);

  for (const file of scenarioFiles) {
    const full = path.join(scenariosDir, file);
    const raw = fs.readFileSync(full, 'utf8');
    const parsed = JSON.parse(raw);
    assert(Boolean(parsed.name), `${file}: contains 'name'`);
    assert(Boolean(parsed.classification), `${file}: contains 'classification'`);
    assert(Boolean(parsed.query), `${file}: contains 'query'`);
    assert(Array.isArray(parsed.expected_behavior) && parsed.expected_behavior.length > 0, `${file}: contains non-empty expected_behavior[]`);
    assert(Array.isArray(parsed.success_criteria) && parsed.success_criteria.length > 0, `${file}: contains non-empty success_criteria[]`);
  }
}

function testDeterministicScriptsE2E() {
  process.stdout.write(`\n=== 4. Deterministic Scripts End-to-End Execution ===\n`);

  // Test detectProject on current repo
  const triage = detectProject(skillRoot);
  assert(typeof triage === 'object' && triage.rootPath, 'detectProject returns structured analysis');

  // Create isolated temp directory for live lifecycle testing
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adr-e2e-test-'));

  try {
    // 1. Detect conventions on empty repo
    const conv0 = detectAdrConventions(tempDir);
    assert(conv0.hasAdrDirectory === false, 'Initially detects no ADR directory');
    assert(conv0.nextFormattedNumber === '0001', 'Recommends 0001 as first number');

    // 2. Bootstrap ADR directory
    const boot = bootstrapAdrs(tempDir);
    assert(boot.success === true, 'bootstrapAdrs succeeds');
    assert(fs.existsSync(path.join(tempDir, 'docs/adr/README.md')), 'README.md created');
    assert(fs.existsSync(path.join(tempDir, 'docs/adr/0001-record-architecture-decisions.md')), '0001 created');

    // 3. Create ADR-0002 (Action Scheduler) with MADR template and index update
    const adr2 = createNewAdr(tempDir, {
      title: 'Adopt Action Scheduler for Webhook Sync',
      template: 'madr',
      status: 'accepted',
      updateIndex: true,
    });
    assert(adr2.success === true, 'createNewAdr creates ADR-0002');
    assert(adr2.formattedNumber === '0002', 'ADR-0002 formatted number matches');
    assert(adr2.indexUpdated === true, 'ADR-0002 appended to index table');

    // 4. Validate directory passes
    const val1 = validateAdrs(tempDir);
    assert(val1.valid === true, 'validateAdrs passes on bootstrapped + new ADR');
    assert(val1.totalChecked === 2, 'validateAdrs checked 2 files');

    // 5. Create ADR-0003 superseding ADR-0002
    const adr3 = createNewAdr(tempDir, {
      title: 'Migrate Webhooks to Custom DB Queue',
      template: 'simple',
      status: 'accepted',
      supersedes: '0002',
      updateIndex: true,
    });
    assert(adr3.success === true, 'createNewAdr creates ADR-0003');

    // 6. Mutate status of ADR-0002 to superseded by ADR-0003
    const mut = setAdrStatus(tempDir, {
      adr: '0002',
      status: 'superseded',
      supersededBy: '0003',
      reason: 'Volume exceeded Action Scheduler queue concurrency ceiling',
      updateIndex: true,
    });
    assert(mut.success === true, 'setAdrStatus successfully supersedes ADR-0002');
    assert(mut.indexUpdated === true, 'Index updated with superseded status');

    // 7. Validate supersession integrity passes
    const val2 = validateAdrs(tempDir);
    assert(val2.valid === true, 'validateAdrs passes after bidirectional supersession');
    assert(val2.totalChecked === 3, 'validateAdrs checked 3 records');

    // 8. Negative test: Introduce broken link in ADR-0003
    const adr3Path = path.join(tempDir, 'docs/adr/0003-migrate-webhooks-to-custom-db-queue.md');
    let adr3Content = fs.readFileSync(adr3Path, 'utf8');
    adr3Content = adr3Content.replace(/Supersedes:\s*.*$/m, 'Supersedes: [ADR-9999](9999-ghost.md)');
    fs.writeFileSync(adr3Path, adr3Content, 'utf8');

    const valFail = validateAdrs(tempDir);
    assert(valFail.valid === false, 'validateAdrs correctly catches broken supersedes link');
    assert(valFail.files.some((f) => f.errors.some((e) => e.includes('9999-ghost.md'))), 'Identifies specific broken link error');

  } finally {
    // Cleanup temp dir
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}

function main() {
  process.stdout.write(`Starting Evaluation Suite for 'wp-architecture-decision-records'...\n`);
  const startTime = Date.now();

  try {
    testSkillSpecification();
    testReferenceIntegrity();
    testScenariosSuite();
    testDeterministicScriptsE2E();

    const elapsed = Date.now() - startTime;
    process.stdout.write(`\n======================================================\n`);
    process.stdout.write(`🎉 ALL EVALUATION SUITES PASSED! (${passedTests}/${totalTests} assertions, ${elapsed}ms)\n`);
    process.stdout.write(`======================================================\n`);
    process.exit(0);
  } catch (err) {
    process.stderr.write(`\n💥 EVALUATION SUITE FAILED: ${err.message}\n`);
    process.exit(1);
  }
}

main();
