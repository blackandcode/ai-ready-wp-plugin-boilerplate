import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { resolve, normalize } from 'node:path';
import process from 'node:process';

/**
 * Detect the current operating system environment.
 * Identifies 'windows', 'macos', 'wsl', or 'linux'.
 *
 * @param {Object}   [options]
 * @param {string}   [options.platform]       Override process.platform
 * @param {string}   [options.arch]           Override process.arch
 * @param {Object}   [options.env]            Override process.env
 * @param {Function} [options.readFileSyncFn] Custom readFileSync for testing
 * @return {{ id: 'windows'|'macos'|'wsl'|'linux'|string, name: string, isWsl: boolean, arch: string, platform: string }}
 */
export function detectPlatform( options = {} ) {
	const plat = options.platform || process.platform;
	const arch = options.arch || process.arch;
	const env = options.env || process.env;
	const readFn = options.readFileSyncFn || readFileSync;

	if ( plat === 'win32' ) {
		return {
			id: 'windows',
			name: 'Windows Native',
			isWsl: false,
			arch,
			platform: plat,
		};
	}

	if ( plat === 'darwin' ) {
		return {
			id: 'macos',
			name: 'macOS',
			isWsl: false,
			arch,
			platform: plat,
		};
	}

	if ( plat === 'linux' ) {
		let isWsl = Boolean( env.WSL_DISTRO_NAME || env.WSL_INTEROP );
		if ( ! isWsl ) {
			try {
				const procVersion = readFn( '/proc/version', 'utf8' );
				if ( /microsoft|wsl/i.test( procVersion ) ) {
					isWsl = true;
				}
			} catch {
				// Not readable or not found
			}
		}

		if ( isWsl ) {
			const distro = env.WSL_DISTRO_NAME
				? ` (${ env.WSL_DISTRO_NAME })`
				: '';
			return {
				id: 'wsl',
				name: `Linux / WSL2${ distro }`,
				isWsl: true,
				arch,
				platform: plat,
			};
		}

		return {
			id: 'linux',
			name: 'Native Linux',
			isWsl: false,
			arch,
			platform: plat,
		};
	}

	return {
		id: plat,
		name: plat,
		isWsl: false,
		arch,
		platform: plat,
	};
}

/**
 * Parse a semver string like "24.16.1" or "v11.0.0" into numeric components.
 *
 * @param {string} versionStr
 * @return {{ major: number, minor: number, patch: number } | null}
 */
export function parseSemver( versionStr ) {
	if ( ! versionStr || typeof versionStr !== 'string' ) {
		return null;
	}
	const match = versionStr.trim().match( /v?(\d+)\.(\d+)(?:\.(\d+))?/ );
	if ( ! match ) {
		return null;
	}
	return {
		major: Number.parseInt( match[ 1 ], 10 ),
		minor: Number.parseInt( match[ 2 ], 10 ),
		patch: match[ 3 ] ? Number.parseInt( match[ 3 ], 10 ) : 0,
	};
}

/**
 * Compare two semver strings.
 * Returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2.
 *
 * @param {string} v1
 * @param {string} v2
 * @return {number}
 */
export function compareSemver( v1, v2 ) {
	const p1 = parseSemver( v1 );
	const p2 = parseSemver( v2 );
	if ( ! p1 || ! p2 ) {
		return 0;
	}
	if ( p1.major !== p2.major ) {
		return p1.major > p2.major ? 1 : -1;
	}
	if ( p1.minor !== p2.minor ) {
		return p1.minor > p2.minor ? 1 : -1;
	}
	if ( p1.patch !== p2.patch ) {
		return p1.patch > p2.patch ? 1 : -1;
	}
	return 0;
}

/**
 * Check if version satisfies minimum required version.
 *
 * @param {string} current
 * @param {string} required
 * @return {boolean}
 */
export function satisfiesMinVersion( current, required ) {
	return compareSemver( current, required ) >= 0;
}

/**
 * Default command execution runner.
 *
 * @param {string}   cmd
 * @param {string[]} args
 * @param {Object}   [options]
 * @return {{ status: number|null, stdout: string, stderr: string, error?: Error }}
 */
export function defaultCommandRunner( cmd, args, options = {} ) {
	try {
		const res = spawnSync( cmd, args, {
			encoding: 'utf8',
			shell: process.platform === 'win32',
			stdio: [ 'pipe', 'pipe', 'pipe' ],
			...options,
		} );
		return {
			status: res.status,
			stdout: res.stdout || '',
			stderr: res.stderr || '',
			error: res.error,
		};
	} catch ( err ) {
		return {
			status: null,
			stdout: '',
			stderr: err.message || '',
			error: err,
		};
	}
}

/**
 * Check Node.js version.
 * @param runner
 * @param platform
 * @param minVersion
 */
export function checkNode( runner, platform, minVersion = '24.16.0' ) {
	const current = process.versions?.node || '';
	const parsed = parseSemver( current );
	const ok = parsed && satisfiesMinVersion( current, minVersion );

	let remediation = '';
	if ( ! ok ) {
		if ( platform.id === 'macos' ) {
			remediation = `Install Node.js >= ${ minVersion } using nvm:\n  nvm install 24 && nvm use 24\nor Homebrew:\n  brew install node@24`;
		} else if ( platform.id === 'windows' ) {
			remediation = `Install Node.js >= ${ minVersion } using winget:\n  winget install OpenJS.NodeJS.LTS\nor nvm-windows:\n  nvm install ${ minVersion } && nvm use ${ minVersion }`;
		} else {
			remediation = `Install Node.js >= ${ minVersion } using nvm:\n  nvm install 24 && nvm use 24\nor NodeSource:\n  https://github.com/nodesource/distributions`;
		}
	}

	return {
		id: 'node',
		name: 'Node.js Runtime',
		category: 'runtime',
		status: ok ? 'pass' : 'fail',
		found: current ? `v${ current }` : 'Not found',
		required: `>= ${ minVersion }`,
		message: ok
			? `Node.js v${ current } meets engine requirement (>= ${ minVersion })`
			: `Node.js ${
					current ? `v${ current }` : 'missing'
			  } is below requirement (>= ${ minVersion })`,
		remediation,
	};
}

/**
 * Check npm version.
 * @param runner
 * @param platform
 * @param minVersion
 */
export function checkNpm( runner, platform, minVersion = '11.0.0' ) {
	const res = runner( 'npm', [ '--version' ] );
	const output = ( res.stdout || '' ).trim();
	const parsed = parseSemver( output );
	const ok =
		res.status === 0 && parsed && satisfiesMinVersion( output, minVersion );

	let remediation = '';
	if ( ! ok ) {
		remediation = `Upgrade npm globally:\n  npm install -g npm@latest\nor update your Node.js distribution.`;
	}

	return {
		id: 'npm',
		name: 'npm Package Manager',
		category: 'runtime',
		status: ok ? 'pass' : 'fail',
		found: output ? `v${ output }` : 'Not found',
		required: `>= ${ minVersion }`,
		message: ok
			? `npm v${ output } meets engine requirement (>= ${ minVersion })`
			: `npm ${
					output ? `v${ output }` : 'missing'
			  } is below requirement (>= ${ minVersion })`,
		remediation,
	};
}

/**
 * Check Git.
 * @param runner
 * @param platform
 */
export function checkGit( runner, platform ) {
	const res = runner( 'git', [ '--version' ] );
	const output = ( res.stdout || '' ).trim();
	const ok = res.status === 0 && output.toLowerCase().includes( 'git' );

	let remediation = '';
	if ( ! ok ) {
		if ( platform.id === 'macos' ) {
			remediation =
				'Install Git via Xcode Command Line Tools:\n  xcode-select --install\nor via Homebrew:\n  brew install git';
		} else if ( platform.id === 'windows' ) {
			remediation =
				'Install Git for Windows via winget:\n  winget install Git.Git\nor download from https://git-scm.com/download/win';
		} else {
			remediation =
				'Install Git via your package manager:\n  sudo apt install git  # Debian/Ubuntu\n  sudo dnf install git  # Fedora/RHEL';
		}
	}

	return {
		id: 'git',
		name: 'Git Version Control',
		category: 'runtime',
		status: ok ? 'pass' : 'fail',
		found: ok ? output.split( '\n' )[ 0 ] : 'Not found in PATH',
		required: 'Installed and available in PATH',
		message: ok
			? output.split( '\n' )[ 0 ]
			: 'Git command not found in PATH',
		remediation,
	};
}

/**
 * Check Docker CLI.
 * @param runner
 * @param platform
 */
export function checkDockerCli( runner, platform ) {
	const res = runner( 'docker', [ '--version' ] );
	const output = ( res.stdout || '' ).trim();
	const ok = res.status === 0 && output.toLowerCase().includes( 'docker' );

	let remediation = '';
	if ( ! ok ) {
		if ( platform.id === 'wsl' ) {
			remediation =
				'Docker is not available in this WSL2 distribution.\n' +
				'1. Ensure Docker Desktop is installed on Windows: https://www.docker.com/products/docker-desktop/\n' +
				'2. In Docker Desktop, go to Settings > General > check "Use the WSL 2 based engine".\n' +
				'3. Go to Settings > Resources > WSL Integration > toggle ON your Ubuntu/WSL distro.\n' +
				'4. Click "Apply & restart", then restart your WSL shell.';
		} else if ( platform.id === 'windows' ) {
			remediation =
				'Docker Desktop is required for containerized WordPress.\n' +
				'Download and install Docker Desktop for Windows:\n  https://www.docker.com/products/docker-desktop/';
		} else if ( platform.id === 'macos' ) {
			remediation =
				'Docker is required for containerized WordPress.\n' +
				'Download Docker Desktop for Mac:\n  https://www.docker.com/products/docker-desktop/\n' +
				'or install OrbStack:\n  brew install orbstack';
		} else {
			remediation =
				'Install Docker Engine on Linux:\n' +
				'  sudo apt update && sudo apt install docker.io docker-compose-plugin\n' +
				'  sudo usermod -aG docker $USER\n' +
				'  newgrp docker';
		}
	}

	const displayFound = ok ? output.split( '\n' )[ 0 ] : 'Not found in PATH';

	return {
		id: 'docker-cli',
		name: 'Docker CLI',
		category: 'container',
		status: ok ? 'pass' : 'fail',
		found: displayFound,
		required: 'Installed and available in PATH',
		message: ok
			? output.split( '\n' )[ 0 ]
			: 'Docker command not found in PATH',
		remediation,
	};
}

/**
 * Check Docker daemon status and accessibility.
 * @param runner
 * @param platform
 * @param dockerCliPassed
 */
export function checkDockerDaemon( runner, platform, dockerCliPassed ) {
	if ( ! dockerCliPassed ) {
		return {
			id: 'docker-daemon',
			name: 'Docker Daemon Service',
			category: 'container',
			status: 'fail',
			found: 'Skipped',
			required: 'Docker daemon running and socket accessible',
			message:
				'Docker daemon could not be verified because Docker CLI is not found',
			remediation: 'Resolve Docker CLI installation first.',
		};
	}

	const res = runner( 'docker', [
		'info',
		'--format',
		'{{.ServerVersion}}',
	] );
	const output = ( res.stdout || '' ).trim();
	const ok =
		res.status === 0 &&
		output.length > 0 &&
		! res.stderr?.includes( 'permission denied' );

	let remediation = '';
	if ( ! ok ) {
		const errText = ( res.stderr || res.stdout || '' ).toLowerCase();
		if (
			errText.includes( 'permission denied' ) &&
			( platform.id === 'linux' || platform.id === 'wsl' )
		) {
			remediation =
				'Docker socket permission denied.\n' +
				'Add your user to the docker group:\n' +
				'  sudo usermod -aG docker $USER\n' +
				'Then reload group permissions: newgrp docker';
		} else if ( platform.id === 'wsl' ) {
			remediation =
				'Docker daemon is not responding in WSL2.\n' +
				'1. Verify Docker Desktop is running on Windows.\n' +
				'2. Verify Settings > Resources > WSL Integration has this distro checked.\n' +
				'3. Test inside WSL terminal: docker ps';
		} else if ( platform.id === 'windows' ) {
			remediation =
				'Docker Desktop daemon is not running.\n' +
				'Start Docker Desktop from the Start Menu and wait until the status bar shows "Engine running".';
		} else if ( platform.id === 'macos' ) {
			remediation =
				'Docker daemon is not running.\n' +
				'Open Docker Desktop (or OrbStack) from Applications and wait for engine initialization.';
		} else {
			remediation =
				'Docker service is not running.\n' +
				'Start the service:\n' +
				'  sudo systemctl start docker\n' +
				'Enable auto-start on boot:\n' +
				'  sudo systemctl enable docker';
		}
	}

	return {
		id: 'docker-daemon',
		name: 'Docker Daemon Service',
		category: 'container',
		status: ok ? 'pass' : 'fail',
		found: ok ? `Server v${ output }` : 'Not responding',
		required: 'Docker daemon active and accessible',
		message: ok
			? `Docker daemon is active (Server v${ output })`
			: 'Docker daemon is not running or socket is inaccessible',
		remediation,
	};
}

/**
 * Check Docker Compose version (Compose v2).
 * @param runner
 * @param platform
 * @param dockerCliPassed
 */
export function checkDockerCompose( runner, platform, dockerCliPassed ) {
	if ( ! dockerCliPassed ) {
		return {
			id: 'docker-compose',
			name: 'Docker Compose v2',
			category: 'container',
			status: 'fail',
			found: 'Skipped',
			required: 'Compose v2 (docker compose)',
			message:
				'Docker Compose check skipped because Docker CLI is missing',
			remediation: 'Install Docker Desktop or Docker Compose plugin.',
		};
	}

	// First try modern "docker compose version"
	const res = runner( 'docker', [ 'compose', 'version' ] );
	let output = ( res.stdout || '' ).trim();
	let isV2 =
		res.status === 0 && /version\s+v?([2-9]|\d{2,})\./i.test( output );

	// Fallback to legacy docker-compose if needed
	if ( ! isV2 ) {
		const fallbackRes = runner( 'docker-compose', [ '--version' ] );
		const fallbackOutput = ( fallbackRes.stdout || '' ).trim();
		if (
			fallbackRes.status === 0 &&
			/version\s+v?([2-9]|\d{2,})\./i.test( fallbackOutput )
		) {
			isV2 = true;
			output = fallbackOutput;
		} else if ( fallbackRes.status === 0 ) {
			output = fallbackOutput;
		}
	}

	let remediation = '';
	if ( ! isV2 ) {
		if ( platform.id === 'linux' || platform.id === 'wsl' ) {
			remediation =
				'Docker Compose v2 is required for @wordpress/env.\n' +
				'Install Compose v2 plugin:\n' +
				'  sudo apt update && sudo apt install docker-compose-plugin';
		} else {
			remediation =
				'Docker Compose v2 is required for @wordpress/env.\n' +
				'Update Docker Desktop to the latest version to obtain Compose v2.';
		}
	}

	return {
		id: 'docker-compose',
		name: 'Docker Compose v2',
		category: 'container',
		status: isV2 ? 'pass' : 'fail',
		found: output || 'Not found',
		required: 'Docker Compose v2.x',
		message: isV2 ? output : 'Docker Compose v2 is not detected',
		remediation,
	};
}

/**
 * Check host PHP version (advisory / non-blocking).
 * @param runner
 * @param platform
 * @param minVersion
 */
export function checkPhp( runner, platform, minVersion = '8.3.0' ) {
	const res = runner( 'php', [ '-v' ] );
	const output = ( res.stdout || '' ).trim();
	const firstLine = output.split( '\n' )[ 0 ] || '';
	const parsed = parseSemver( firstLine );
	const ok =
		res.status === 0 &&
		parsed &&
		satisfiesMinVersion( firstLine, minVersion );

	let remediation = '';
	if ( ! ok ) {
		if ( platform.id === 'macos' ) {
			remediation =
				'Host PHP 8.3 is recommended for running local PHPUnit and WPCS linting.\n' +
				'Install via Homebrew:\n  brew install php@8.3';
		} else if ( platform.id === 'windows' ) {
			remediation =
				'Host PHP 8.3 is recommended for local PHPUnit and WPCS linting.\n' +
				'Install via Scoop:\n  scoop install php\nor Chocolatey:\n  choco install php --version=8.3';
		} else {
			remediation =
				'Host PHP 8.3 is recommended for local PHPUnit and WPCS linting.\n' +
				'Install on Ubuntu/Debian:\n' +
				'  sudo add-apt-repository ppa:ondrej/php\n' +
				'  sudo apt update\n' +
				'  sudo apt install php8.3-cli php8.3-xml php8.3-mbstring php8.3-curl';
		}
	}

	return {
		id: 'php',
		name: 'Host PHP CLI (Advisory)',
		category: 'php',
		status: ok ? 'pass' : 'warn',
		found: firstLine || 'Not found on host',
		required: `>= ${ minVersion } (for host testing & static analysis)`,
		message: ok
			? `${ firstLine } meets host development requirements`
			: `Host PHP ${
					firstLine ? `(${ firstLine })` : 'missing'
			  }: WP runs in Docker (PHP 8.3), but host PHP 8.3 is needed for 'composer lint' and 'composer test'`,
		remediation,
	};
}

/**
 * Check host Composer version (advisory / non-blocking).
 * @param runner
 * @param platform
 * @param minVersion
 */
export function checkComposer( runner, platform, minVersion = '2.7.0' ) {
	const res = runner( 'composer', [ '--version' ] );
	const output = ( res.stdout || '' ).trim();
	const parsed = parseSemver( output );
	const ok =
		res.status === 0 && parsed && satisfiesMinVersion( output, minVersion );

	let remediation = '';
	if ( ! ok ) {
		if ( platform.id === 'macos' ) {
			remediation =
				'Install Composer via Homebrew:\n  brew install composer';
		} else if ( platform.id === 'windows' ) {
			remediation =
				'Install Composer via Scoop:\n  scoop install composer\nor download Windows installer from https://getcomposer.org/download/';
		} else {
			remediation =
				'Install Composer on Linux:\n' +
				'  sudo apt install composer\n' +
				'or via the official script: https://getcomposer.org/download/';
		}
	}

	return {
		id: 'composer',
		name: 'Host Composer (Advisory)',
		category: 'php',
		status: ok ? 'pass' : 'warn',
		found: output ? output.split( '\n' )[ 0 ] : 'Not found on host',
		required: `>= ${ minVersion }`,
		message: ok
			? `${ output.split( '\n' )[ 0 ] } detected`
			: 'Composer is missing or outdated on host; needed for installing PHP dependencies and running WPCS/PHPStan',
		remediation,
	};
}

/**
 * Check filesystem health and path safety.
 * @param projectRoot
 * @param platform
 */
export function checkFilesystemSanity( projectRoot, platform ) {
	const normalized = normalize( projectRoot ).replace( /\\/g, '/' );

	if ( platform.id === 'wsl' ) {
		if ( normalized.startsWith( '/mnt/' ) ) {
			return {
				id: 'filesystem',
				name: 'WSL Filesystem Location',
				category: 'filesystem',
				status: 'warn',
				found: projectRoot,
				required: 'Linux root filesystem (/home/<user>/...)',
				message:
					'Project is located inside Windows 9P mount (/mnt/c/...). This causes severe I/O latency and breaks Webpack/Playwright file watchers.',
				remediation:
					'Move the repository to your WSL Linux home directory:\n' +
					'  mkdir -p ~/workspace/wp-plugins-development\n' +
					`  mv ${ projectRoot } ~/workspace/wp-plugins-development/`,
			};
		}

		return {
			id: 'filesystem',
			name: 'WSL Filesystem Location',
			category: 'filesystem',
			status: 'pass',
			found: projectRoot,
			required: 'Linux root filesystem (/home/<user>/...)',
			message:
				'Project resides in native Linux filesystem; optimal I/O and inotify watcher performance.',
			remediation: '',
		};
	}

	// For Windows, macOS, Linux: check for spaces or problematic characters
	if ( /\s/.test( projectRoot ) ) {
		return {
			id: 'filesystem',
			name: 'Filesystem Path Check',
			category: 'filesystem',
			status: 'warn',
			found: projectRoot,
			required: 'Path without spaces',
			message:
				'Project path contains whitespace. Some Docker volume mounts and shell tools can misbehave with unquoted paths.',
			remediation:
				'Consider cloning the repository into a path without spaces if you encounter volume mount errors.',
		};
	}

	return {
		id: 'filesystem',
		name: 'Filesystem Path Check',
		category: 'filesystem',
		status: 'pass',
		found: projectRoot,
		required: 'Standard path',
		message: 'Project filesystem path is clean and accessible.',
		remediation: '',
	};
}

/**
 * Check if a TCP port is in use on localhost.
 *
 * @param {number} port
 * @param {string} [host]
 * @return {Promise<boolean>} True if port is free (listening succeeded), false if occupied
 */
export function testPortAvailable( port, host = '127.0.0.1' ) {
	return new Promise( ( resolve ) => {
		const server = createServer();
		server.once( 'error', () => {
			resolve( false ); // Port occupied or permission error
		} );
		server.once( 'listening', () => {
			server.close( () => resolve( true ) ); // Port is free
		} );
		server.listen( port, host );
	} );
}

/**
 * Check WordPress and phpMyAdmin default ports (8888, 8890).
 * @param portTester
 */
export async function checkPorts( portTester = testPortAvailable ) {
	const wpPort = 8888;
	const pmaPort = 8890;

	const [ wpFree, pmaFree ] = await Promise.all( [
		portTester( wpPort ),
		portTester( pmaPort ),
	] );

	if ( ! wpFree || ! pmaFree ) {
		const occupied = [];
		if ( ! wpFree ) {
			occupied.push( `port ${ wpPort } (WordPress)` );
		}
		if ( ! pmaFree ) {
			occupied.push( `port ${ pmaPort } (phpMyAdmin)` );
		}

		return {
			id: 'ports',
			name: 'Local Port Availability (8888, 8890)',
			category: 'networking',
			status: 'warn',
			found: occupied.join( ' and ' ) + ' in use',
			required: 'Ports 8888 and 8890 free',
			message: `${ occupied.join(
				' and '
			) } currently occupied by another process or existing wp-env container`,
			remediation:
				'If a previous wp-env instance is running, stop it with:\n' +
				'  npm run env:stop\n' +
				'Alternatively, configure custom ports using a local .wp-env.override.json.',
		};
	}

	return {
		id: 'ports',
		name: 'Local Port Availability (8888, 8890)',
		category: 'networking',
		status: 'pass',
		found: 'Ports 8888 and 8890 are free',
		required: 'Ports 8888 and 8890 available',
		message:
			'Ports 8888 (WordPress) and 8890 (phpMyAdmin) are available for wp-env.',
		remediation: '',
	};
}

/**
 * Check project artifacts and local configuration files.
 * @param projectRoot
 * @param fileExists
 */
export function checkProjectArtifacts( projectRoot, fileExists = existsSync ) {
	const checks = [];

	// 1. node_modules
	const hasWpEnv = fileExists(
		resolve( projectRoot, 'node_modules/@wordpress/env' )
	);
	const hasNodeModules = fileExists( resolve( projectRoot, 'node_modules' ) );
	if ( hasWpEnv ) {
		checks.push( {
			id: 'artifacts-npm',
			name: 'npm Dependencies (node_modules)',
			category: 'project',
			status: 'pass',
			found: 'node_modules/@wordpress/env present',
			required: 'npm dependencies installed',
			message: 'Node dependencies and @wordpress/env are installed.',
			remediation: '',
		} );
	} else {
		checks.push( {
			id: 'artifacts-npm',
			name: 'npm Dependencies (node_modules)',
			category: 'project',
			status: 'warn',
			found: hasNodeModules
				? 'Incomplete node_modules'
				: 'Missing node_modules',
			required: 'npm dependencies installed',
			message:
				'npm dependencies are missing or incomplete. Run npm install before starting development.',
			remediation: 'Run:\n  npm install',
		} );
	}

	// 2. vendor (Composer)
	const hasVendorAutoload = fileExists(
		resolve( projectRoot, 'vendor/autoload.php' )
	);
	if ( hasVendorAutoload ) {
		checks.push( {
			id: 'artifacts-composer',
			name: 'Composer Dependencies (vendor)',
			category: 'project',
			status: 'pass',
			found: 'vendor/autoload.php present',
			required: 'Composer vendor directory installed',
			message: 'Composer dependencies and autoloader are installed.',
			remediation: '',
		} );
	} else {
		checks.push( {
			id: 'artifacts-composer',
			name: 'Composer Dependencies (vendor)',
			category: 'project',
			status: 'warn',
			found: 'Missing vendor/autoload.php',
			required: 'Composer vendor directory installed',
			message:
				'Composer dependencies not installed on host. Run composer install for local PHP tooling.',
			remediation: 'Run:\n  composer install',
		} );
	}

	// 3. .env file
	const hasEnv = fileExists( resolve( projectRoot, '.env' ) );
	const hasEnvExample = fileExists( resolve( projectRoot, '.env.example' ) );
	if ( hasEnv ) {
		checks.push( {
			id: 'artifacts-env',
			name: 'Local Environment Configuration (.env)',
			category: 'project',
			status: 'pass',
			found: '.env present',
			required: '.env file present',
			message: 'Local .env file is present.',
			remediation: '',
		} );
	} else {
		checks.push( {
			id: 'artifacts-env',
			name: 'Local Environment Configuration (.env)',
			category: 'project',
			status: 'warn',
			found: '.env missing',
			required: '.env file configured',
			message:
				'Local .env file not found. Copy .env.example to .env to enable API and Playwright credentials.',
			remediation: hasEnvExample
				? 'Run:\n  cp .env.example .env'
				: 'Create a .env file with WP_BASE_URL=http://localhost:8888',
		} );
	}

	return checks;
}

/**
 * Execute all environment checks and return categorized report.
 *
 * @param {Object}   [options]
 * @param {string}   [options.root]            Project root directory (default: process.cwd())
 * @param {boolean}  [options.strict]          Treat warnings as failures
 * @param {boolean}  [options.skipPorts]       Skip TCP port probes
 * @param {Function} [options.runner]          Custom command runner
 * @param {Function} [options.portTester]      Custom port tester
 * @param {Function} [options.fileExists]      Custom fileExists function
 * @param {Object}   [options.platformOptions] Options for detectPlatform
 * @return {Promise<{
 *   platform: object,
 *   summary: { total: number, passed: number, warnings: number, errors: number, isReady: boolean },
 *   checks: Array<object>,
 *   remediations: Array<{ id: string, name: string, remediation: string }>
 * }>}
 */
export async function runEnvironmentCheck( options = {} ) {
	const root = options.root ? resolve( options.root ) : process.cwd();
	const runner = options.runner || defaultCommandRunner;
	const portTester = options.portTester || testPortAvailable;
	const fileExists = options.fileExists || existsSync;
	const strict = Boolean( options.strict );
	const skipPorts = Boolean( options.skipPorts );

	const platform = detectPlatform( options.platformOptions );

	// Run host runtimes
	const nodeCheck = checkNode( runner, platform );
	const npmCheck = checkNpm( runner, platform );
	const gitCheck = checkGit( runner, platform );

	// Run container checks
	const dockerCliCheck = checkDockerCli( runner, platform );
	const dockerCliPassed = dockerCliCheck.status === 'pass';
	const dockerDaemonCheck = checkDockerDaemon(
		runner,
		platform,
		dockerCliPassed
	);
	const dockerComposeCheck = checkDockerCompose(
		runner,
		platform,
		dockerCliPassed
	);

	// Run PHP checks
	const phpCheck = checkPhp( runner, platform );
	const composerCheck = checkComposer( runner, platform );

	// Run filesystem check
	const fsCheck = checkFilesystemSanity( root, platform );

	// Run port checks
	let portCheck = null;
	if ( ! skipPorts ) {
		portCheck = await checkPorts( portTester );
	}

	// Run project artifacts
	const artifactChecks = checkProjectArtifacts( root, fileExists );

	const allChecks = [
		nodeCheck,
		npmCheck,
		gitCheck,
		dockerCliCheck,
		dockerDaemonCheck,
		dockerComposeCheck,
		phpCheck,
		composerCheck,
		fsCheck,
		...( portCheck ? [ portCheck ] : [] ),
		...artifactChecks,
	];

	let passed = 0;
	let warnings = 0;
	let errors = 0;
	const remediations = [];

	for ( const check of allChecks ) {
		if ( check.status === 'pass' ) {
			passed++;
		} else if ( check.status === 'warn' ) {
			warnings++;
			if ( check.remediation ) {
				remediations.push( {
					id: check.id,
					name: check.name,
					category: check.category,
					status: 'warn',
					message: check.message,
					remediation: check.remediation,
				} );
			}
		} else if ( check.status === 'fail' ) {
			errors++;
			if ( check.remediation ) {
				remediations.push( {
					id: check.id,
					name: check.name,
					category: check.category,
					status: 'fail',
					message: check.message,
					remediation: check.remediation,
				} );
			}
		}
	}

	const isReady = errors === 0 && ( ! strict || warnings === 0 );

	return {
		platform,
		summary: {
			total: allChecks.length,
			passed,
			warnings,
			errors,
			isReady,
			strict,
		},
		checks: allChecks,
		remediations,
	};
}
