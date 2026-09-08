import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const PLUGIN_SLUG = 'ai-ready-wp-plugin-boilerplate';
const TEST_USER = 'airwp_api_test';

function wp(...args) {
  return execFileSync('npx', ['wp-env', 'run', 'cli', 'wp', ...args], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'inherit'],
    shell: process.platform === 'win32',
  });
}

function wpInherit(...args) {
  execFileSync('npx', ['wp-env', 'run', 'cli', 'wp', ...args], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

function updateDotEnvPassword(password) {
  const envPath = resolve(process.cwd(), '.env');
  try {
    if (!existsSync(envPath)) {
      const examplePath = resolve(process.cwd(), '.env.example');
      if (existsSync(examplePath)) {
        writeFileSync(envPath, readFileSync(examplePath, 'utf-8'), 'utf-8');
      }
    }
    let envContent = readFileSync(envPath, 'utf-8');
    if (envContent.includes('BRUNO_APPLICATION_PASSWORD=')) {
      envContent = envContent.replace(
        /^BRUNO_APPLICATION_PASSWORD=.*$/m,
        `BRUNO_APPLICATION_PASSWORD=${password}`
      );
    } else {
      envContent += `\nBRUNO_APPLICATION_PASSWORD=${password}\n`;
    }
    writeFileSync(envPath, envContent, 'utf-8');
    console.log('Synchronized .env with fresh BRUNO_APPLICATION_PASSWORD.');
  } catch (err) {
    console.warn('Notice: .env file not found or failed to update:', err.message);
  }
}

// 1. Theme activation
wpInherit('theme', 'activate', 'twentytwentyfive');

// 2. Plugin activation
wpInherit('plugin', 'activate', PLUGIN_SLUG);

// 3. Rewrites
wpInherit('rewrite', 'structure', '/%postname%/', '--hard');
wpInherit('rewrite', 'flush', '--hard');

// 4. Admin credentials
try {
  wpInherit('user', 'update', 'admin', '--user_pass=password');
} catch {
  // admin user might not exist yet on fresh init
}

// 5. Bruno API test user
try {
  wp('user', 'get', TEST_USER, '--field=ID');
  console.log(`Test user ${TEST_USER} already exists.`);
} catch {
  console.log(`Creating test user ${TEST_USER}...`);
  wpInherit('user', 'create', TEST_USER, `${TEST_USER}@example.test`, '--role=administrator', '--user_pass=testpass');
}

// 6. Application Password for Bruno
try {
  try {
    wp('user', 'application-password', 'delete', TEST_USER, 'bruno-test');
  } catch {
    // ignore
  }
  const appPassOutput = wp('user', 'application-password', 'create', TEST_USER, 'bruno-test');
  const match = appPassOutput.match(/Password:\s*([A-Za-z0-9\s]+)/);
  if (match && match[1]) {
    const cleanPassword = match[1].replace(/\s+/g, '');
    updateDotEnvPassword(cleanPassword);
  }
} catch (err) {
  console.error('Failed to configure application password:', err.message);
}

console.log('Environment setup and credential synchronization complete.');
