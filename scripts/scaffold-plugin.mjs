#!/usr/bin/env node
import process from 'node:process';
import { parseArgs } from 'node:util';
import readline from 'node:readline/promises';
import { detectCurrentPlugin, scaffoldPlugin, slugify, toPascalCase } from './lib/scaffold-engine.mjs';

const HELP = `
Usage: npm run scaffold -- [options]
       npm run rename -- [options]

Rebrands and adapts this WordPress AI Boilerplate into a new, custom-tailored plugin.
Atomically updates plugin slug, PHP namespace, constant prefix, Composer & npm packages,
Gutenberg block names, REST endpoints, text domain, and file names.

Options:
  --name <string>            New plugin display name (e.g. "Mermaid Diagrams")
  --slug <string>            New plugin slug (e.g. "mermaid-diagrams")
  --namespace <string>       New PHP namespace (e.g. "WebFalcon\\MermaidDiagrams")
  --prefix <string>          Constant prefix (e.g. "MDM_")
  --author <string>          Author or vendor name (e.g. "WebFalcon")
  --text-domain <string>     WordPress translation text domain (defaults to slug)
  --rest-namespace <string>  REST API namespace (e.g. "mdm/v1")
  --block-name <string>      Gutenberg block identifier (e.g. "mdm/diagram")
  --composer-name <string>   Composer package name (e.g. "vendor/slug")
  --root <path>              Project root directory (defaults to current working directory)
  --dry-run                  Preview all changes without modifying any files
  --interactive              Prompt for all values interactively
  --help                     Show this help message
`;

const { values } = parseArgs({
  options: {
    name: { type: 'string' },
    slug: { type: 'string' },
    namespace: { type: 'string' },
    prefix: { type: 'string' },
    author: { type: 'string' },
    'text-domain': { type: 'string' },
    'rest-namespace': { type: 'string' },
    'block-name': { type: 'string' },
    'composer-name': { type: 'string' },
    root: { type: 'string', default: process.cwd() },
    'dry-run': { type: 'boolean', default: false },
    interactive: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
  allowPositionals: false,
  strict: true,
});

if (values.help) {
  console.log(HELP.trim());
  process.exit(0);
}

async function main() {
  const root = values.root;
  const current = await detectCurrentPlugin(root);

  let name = values.name;
  let slug = values.slug;
  let namespace = values.namespace;
  let prefix = values.prefix;
  let author = values.author;
  let textDomain = values['text-domain'];
  let restNamespace = values['rest-namespace'];
  let blockName = values['block-name'];
  let composerName = values['composer-name'];

  const shouldPrompt = values.interactive || (!name && process.stdin.isTTY);

  if (shouldPrompt) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log('\n======================================================');
    console.log('  WordPress AI Plugin Scaffolding & Rebranding CLI    ');
    console.log('======================================================\n');
    console.log(`Current plugin: "${current.name}" (${current.slug})\n`);

    name = await rl.question(`Plugin Display Name [${name || 'Custom WordPress Plugin'}]: `) || name || 'Custom WordPress Plugin';
    const defaultSlug = slugify(name);
    slug = await rl.question(`Plugin Slug [${slug || defaultSlug}]: `) || slug || defaultSlug;
    
    author = await rl.question(`Author / Vendor [${author || 'MyVendor'}]: `) || author || 'MyVendor';
    const defaultNamespace = `${toPascalCase(author)}\\${toPascalCase(slug)}`;
    namespace = await rl.question(`PHP Namespace [${namespace || defaultNamespace}]: `) || namespace || defaultNamespace;

    const defaultPrefix = `${slug.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_`;
    prefix = await rl.question(`Constant Prefix [${prefix || defaultPrefix}]: `) || prefix || defaultPrefix;

    rl.close();
  }

  if (!name) {
    name = current.name;
  }
  if (!slug) {
    slug = slugify(name);
  }

  console.log('\nProcessing project transformations...');
  if (values['dry-run']) {
    console.log('[MODE: DRY RUN — No disk modifications will occur]');
  }

  const result = await scaffoldPlugin({
    root,
    name,
    slug,
    namespace,
    prefix,
    textDomain,
    author,
    restNamespace,
    blockName,
    composerName,
    dryRun: values['dry-run'],
  });

  console.log('\n======================================================');
  console.log('  Scaffolding Summary:');
  console.log('======================================================');
  console.log(`  Name:           ${result.target.name}`);
  console.log(`  Slug:           ${result.target.slug}`);
  console.log(`  Main PHP File:  ${result.target.mainPhpFile}`);
  console.log(`  PHP Namespace:  ${result.target.namespace}`);
  console.log(`  Prefix:         ${result.target.prefix}`);
  console.log(`  REST Route:     ${result.target.restNamespace}`);
  console.log(`  Block:          ${result.target.blockName}`);
  console.log(`  Composer Name:  ${result.target.composerName || 'N/A'}`);
  console.log(`  Author:         ${result.target.author}`);
  console.log('------------------------------------------------------');
  console.log(`  Files Modified: ${result.modifiedCount}`);
  console.log(`  Files Renamed:  ${result.renamedCount}`);

  if (result.renamedCount > 0) {
    console.log('\nRenamed:');
    for (const r of result.renamedFiles) {
      console.log(`  ${r.from} -> ${r.to}`);
    }
  }

  if (values['dry-run']) {
    console.log('\nDry run completed successfully. No files were written.');
  } else {
    console.log('\nPlugin successfully scaffolded! You can now run:');
    console.log('  npm run build');
    console.log('  npm run env:start');
    console.log('  npm test\n');
  }
}

main().catch((err) => {
  console.error(`\nError during scaffolding: ${err.message}`);
  process.exit(1);
});
