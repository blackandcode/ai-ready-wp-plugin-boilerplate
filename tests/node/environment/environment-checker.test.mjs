import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  checkComposer,
  checkDockerCli,
  checkDockerCompose,
  checkDockerDaemon,
  checkFilesystemSanity,
  checkGit,
  checkNode,
  checkNpm,
  checkPhp,
  checkPorts,
  checkProjectArtifacts,
  compareSemver,
  detectPlatform,
  parseSemver,
  runEnvironmentCheck,
  satisfiesMinVersion,
} from '../../../scripts/lib/environment-checker.mjs';

const testDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testDir, '../../..');
const cliPath = join(projectRoot, 'scripts/check-environment.mjs');

test('detectPlatform correctly identifies OS families', () => {
  // 1. Windows
  const win = detectPlatform({ platform: 'win32', arch: 'x64' });
  assert.equal(win.id, 'windows');
  assert.equal(win.isWsl, false);

  // 2. macOS
  const mac = detectPlatform({ platform: 'darwin', arch: 'arm64' });
  assert.equal(mac.id, 'macos');
  assert.equal(mac.isWsl, false);

  // 3. WSL via env
  const wslEnv = detectPlatform({
    platform: 'linux',
    arch: 'x64',
    env: { WSL_DISTRO_NAME: 'Ubuntu-24.04' },
  });
  assert.equal(wslEnv.id, 'wsl');
  assert.equal(wslEnv.isWsl, true);
  assert.match(wslEnv.name, /Ubuntu-24\.04/);

  // 4. WSL via /proc/version
  const wslProc = detectPlatform({
    platform: 'linux',
    arch: 'x64',
    env: {},
    readFileSyncFn: () => 'Linux version 6.6.87.2-microsoft-standard-WSL2',
  });
  assert.equal(wslProc.id, 'wsl');
  assert.equal(wslProc.isWsl, true);

  // 5. Native Linux
  const linux = detectPlatform({
    platform: 'linux',
    arch: 'x64',
    env: {},
    readFileSyncFn: () => 'Linux version 6.5.0-generic (buildd@canonical)',
  });
  assert.equal(linux.id, 'linux');
  assert.equal(linux.isWsl, false);
});

test('parseSemver and compareSemver parse and compare versions accurately', () => {
  assert.deepEqual(parseSemver('24.16.1'), { major: 24, minor: 16, patch: 1 });
  assert.deepEqual(parseSemver('v11.0.0'), { major: 11, minor: 0, patch: 0 });
  assert.deepEqual(parseSemver('8.3.33-cli'), { major: 8, minor: 3, patch: 33 });
  assert.equal(parseSemver('not-a-version'), null);
  assert.equal(parseSemver(''), null);

  assert.equal(compareSemver('24.18.1', '24.16.0'), 1);
  assert.equal(compareSemver('24.16.0', '24.16.0'), 0);
  assert.equal(compareSemver('22.10.0', '24.16.0'), -1);

  assert.equal(satisfiesMinVersion('24.18.1', '24.16.0'), true);
  assert.equal(satisfiesMinVersion('20.0.0', '24.16.0'), false);
});

test('checkNode validates Node engine constraints', () => {
  const plat = { id: 'linux', isWsl: false };
  const res = checkNode(null, plat, '24.16.0');
  assert.ok(['pass', 'fail'].includes(res.status));
  assert.equal(res.id, 'node');
});

test('checkNpm validates npm version and handles failure', () => {
  const plat = { id: 'macos', isWsl: false };

  // Pass scenario
  const passRunner = () => ({ status: 0, stdout: '11.16.0\n', stderr: '' });
  const passRes = checkNpm(passRunner, plat, '11.0.0');
  assert.equal(passRes.status, 'pass');
  assert.match(passRes.message, /v11\.16\.0/);

  // Fail scenario
  const failRunner = () => ({ status: 0, stdout: '10.8.2\n', stderr: '' });
  const failRes = checkNpm(failRunner, plat, '11.0.0');
  assert.equal(failRes.status, 'fail');
  assert.match(failRes.remediation, /npm install -g npm@latest/);
});

test('checkGit validates git existence and OS remediation', () => {
  const macPlat = { id: 'macos', isWsl: false };
  const winPlat = { id: 'windows', isWsl: false };

  const passRunner = () => ({ status: 0, stdout: 'git version 2.43.0\n', stderr: '' });
  assert.equal(checkGit(passRunner, macPlat).status, 'pass');

  const failRunner = () => ({ status: 1, stdout: '', stderr: 'command not found' });
  const macFail = checkGit(failRunner, macPlat);
  assert.equal(macFail.status, 'fail');
  assert.match(macFail.remediation, /xcode-select --install/);

  const winFail = checkGit(failRunner, winPlat);
  assert.match(winFail.remediation, /winget install Git\.Git/);
});

test('checkDockerCli returns OS-tailored guidance for WSL, Windows, macOS, Linux', () => {
  const failRunner = () => ({ status: 1, stdout: '', stderr: 'docker: command not found' });

  const wslRes = checkDockerCli(failRunner, { id: 'wsl', isWsl: true });
  assert.equal(wslRes.status, 'fail');
  assert.match(wslRes.remediation, /WSL Integration/);

  const winRes = checkDockerCli(failRunner, { id: 'windows', isWsl: false });
  assert.match(winRes.remediation, /Docker Desktop for Windows/);

  const macRes = checkDockerCli(failRunner, { id: 'macos', isWsl: false });
  assert.match(macRes.remediation, /OrbStack/);

  const linuxRes = checkDockerCli(failRunner, { id: 'linux', isWsl: false });
  assert.match(linuxRes.remediation, /sudo apt install docker\.io/);
});

test('checkDockerDaemon validates daemon connectivity and permission states', () => {
  const plat = { id: 'linux', isWsl: false };

  // Skip when CLI missing
  const skipRes = checkDockerDaemon(() => {}, plat, false);
  assert.equal(skipRes.status, 'fail');
  assert.equal(skipRes.found, 'Skipped');

  // Success
  const passRunner = () => ({ status: 0, stdout: '27.5.1\n', stderr: '' });
  const passRes = checkDockerDaemon(passRunner, plat, true);
  assert.equal(passRes.status, 'pass');
  assert.match(passRes.found, /27\.5\.1/);

  // Permission denied
  const permRunner = () => ({ status: 1, stdout: '', stderr: 'permission denied while trying to connect' });
  const permRes = checkDockerDaemon(permRunner, plat, true);
  assert.equal(permRes.status, 'fail');
  assert.match(permRes.remediation, /usermod -aG docker/);
});

test('checkDockerCompose validates Compose v2 and handles legacy fallback', () => {
  const plat = { id: 'macos', isWsl: false };

  // Missing CLI
  assert.equal(checkDockerCompose(() => {}, plat, false).status, 'fail');

  // Modern v2
  const v2Runner = (cmd, args) => {
    if (args.includes('compose')) {
      return { status: 0, stdout: 'Docker Compose version v2.32.4\n', stderr: '' };
    }
    return { status: 1, stdout: '', stderr: '' };
  };
  const v2Res = checkDockerCompose(v2Runner, plat, true);
  assert.equal(v2Res.status, 'pass');

  // Legacy fallback to v2
  const fallbackRunner = (cmd) => {
    if (cmd === 'docker-compose') {
      return { status: 0, stdout: 'docker-compose version 2.20.0\n', stderr: '' };
    }
    return { status: 1, stdout: '', stderr: 'unknown command' };
  };
  const fbRes = checkDockerCompose(fallbackRunner, plat, true);
  assert.equal(fbRes.status, 'pass');

  // Outdated or missing v2
  const failRunner = () => ({ status: 1, stdout: '', stderr: 'not found' });
  const failRes = checkDockerCompose(failRunner, plat, true);
  assert.equal(failRes.status, 'fail');
});

test('checkPhp treats host PHP as advisory warning when missing or outdated', () => {
  const plat = { id: 'wsl', isWsl: true };

  // Pass with 8.3
  const passRunner = () => ({ status: 0, stdout: 'PHP 8.3.12 (cli)\n', stderr: '' });
  const passRes = checkPhp(passRunner, plat, '8.3.0');
  assert.equal(passRes.status, 'pass');

  // Outdated with 8.1: warning, not fatal error
  const outRunner = () => ({ status: 0, stdout: 'PHP 8.1.2 (cli)\n', stderr: '' });
  const outRes = checkPhp(outRunner, plat, '8.3.0');
  assert.equal(outRes.status, 'warn');
  assert.match(outRes.remediation, /ppa:ondrej\/php/);

  // Missing: warning
  const missingRunner = () => ({ status: 1, stdout: '', stderr: 'not found' });
  const missRes = checkPhp(missingRunner, plat, '8.3.0');
  assert.equal(missRes.status, 'warn');
});

test('checkComposer treats Composer as advisory warning when missing', () => {
  const plat = { id: 'windows', isWsl: false };

  const passRunner = () => ({ status: 0, stdout: 'Composer version 2.8.2\n', stderr: '' });
  assert.equal(checkComposer(passRunner, plat, '2.7.0').status, 'pass');

  const failRunner = () => ({ status: 1, stdout: '', stderr: 'not found' });
  const failRes = checkComposer(failRunner, plat, '2.7.0');
  assert.equal(failRes.status, 'warn');
  assert.match(failRes.remediation, /scoop install composer/);
});

test('checkFilesystemSanity warns on WSL Windows mounts and spaces', () => {
  const wslPlat = { id: 'wsl', isWsl: true };
  const winPlat = { id: 'windows', isWsl: false };

  // WSL mount warning
  const mntRes = checkFilesystemSanity('/mnt/c/Users/black/project', wslPlat);
  assert.equal(mntRes.status, 'warn');
  assert.match(mntRes.message, /Windows 9P mount/);

  // WSL native home pass
  const homeRes = checkFilesystemSanity('/home/black/workspace/project', wslPlat);
  assert.equal(homeRes.status, 'pass');

  // Windows path with spaces warning
  const spaceRes = checkFilesystemSanity('C:\\Users\\Black Folder\\project', winPlat);
  assert.equal(spaceRes.status, 'warn');
  assert.match(spaceRes.message, /whitespace/);

  // Clean path pass
  const cleanRes = checkFilesystemSanity('C:\\workspace\\project', winPlat);
  assert.equal(cleanRes.status, 'pass');
});

test('checkPorts verifies mock free and occupied ports', async () => {
  // Free ports
  const freeTester = async () => true;
  const freeRes = await checkPorts(freeTester);
  assert.equal(freeRes.status, 'pass');

  // Occupied port 8888
  const busyTester = async (port) => port !== 8888;
  const busyRes = await checkPorts(busyTester);
  assert.equal(busyRes.status, 'warn');
  assert.match(busyRes.found, /8888/);
});

test('checkProjectArtifacts checks node_modules, vendor, and .env', () => {
  const mockExists = (filePath) => {
    if (filePath.endsWith('.env')) return true;
    if (filePath.endsWith('autoload.php')) return false;
    if (filePath.endsWith('@wordpress/env')) return true;
    return false;
  };

  const artifacts = checkProjectArtifacts('/dummy/root', mockExists);
  assert.equal(artifacts.length, 3);

  const npmCheck = artifacts.find((a) => a.id === 'artifacts-npm');
  assert.equal(npmCheck.status, 'pass');

  const compCheck = artifacts.find((a) => a.id === 'artifacts-composer');
  assert.equal(compCheck.status, 'warn');

  const envCheck = artifacts.find((a) => a.id === 'artifacts-env');
  assert.equal(envCheck.status, 'pass');
});

test('runEnvironmentCheck integrates checks and computes readiness', async () => {
  const mockRunner = (cmd, args) => {
    if (cmd === 'npm') return { status: 0, stdout: '11.0.0\n', stderr: '' };
    if (cmd === 'git') return { status: 0, stdout: 'git version 2.40.0\n', stderr: '' };
    if (cmd === 'docker' && args[0] === '--version') return { status: 0, stdout: 'Docker version 27.0.0\n', stderr: '' };
    if (cmd === 'docker' && args[0] === 'info') return { status: 0, stdout: '27.0.0\n', stderr: '' };
    if (cmd === 'docker' && args[0] === 'compose') return { status: 0, stdout: 'Docker Compose version v2.25.0\n', stderr: '' };
    if (cmd === 'php') return { status: 0, stdout: 'PHP 8.3.0\n', stderr: '' };
    if (cmd === 'composer') return { status: 0, stdout: 'Composer version 2.7.0\n', stderr: '' };
    return { status: 1, stdout: '', stderr: 'unknown' };
  };

  const report = await runEnvironmentCheck({
    root: '/home/user/project',
    runner: mockRunner,
    portTester: async () => true,
    fileExists: () => true,
    platformOptions: { platform: 'linux', arch: 'x64', env: {} },
    strict: false,
  });

  assert.equal(report.summary.errors, 0);
  assert.equal(report.summary.isReady, true);
  assert.ok(report.checks.length >= 10);
});

test('check-environment CLI runs with --json and --skip-ports', () => {
  const res = spawnSync(process.execPath, [cliPath, '--json', '--skip-ports'], {
    cwd: projectRoot,
    encoding: 'utf8',
  });

  // CLI exit code may be 0 or 1 depending on whether current machine has Docker
  assert.ok(res.status === 0 || res.status === 1);
  const json = JSON.parse(res.stdout);
  assert.ok(json.platform);
  assert.ok(json.summary);
  assert.ok(Array.isArray(json.checks));
  assert.ok(Array.isArray(json.remediations));
});
