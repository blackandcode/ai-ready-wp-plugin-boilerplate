# Development Prerequisites and Environment Setup

This document defines the system requirements, toolchains, and setup steps required to develop, test, and build plugins using the **WordPress AI Plugin Development Boilerplate**.

It supports all major operating systems: **macOS**, **native Windows**, **Windows Subsystem for Linux (WSL2)**, and **native Linux**.

---

## 1. Quick Requirements Matrix

| Tool / Runtime | Minimum Version | Scope | Purpose |
|---|---|---|---|
| **Node.js** | `>= 24.16.0` | Host | Asset compilation (`@wordpress/scripts`), test runners, scaffolding CLI |
| **npm** | `>= 11.0.1` | Host | Package management and script orchestration |
| **Docker** | Docker 24+ / Desktop 4+ | Host / Virtualization | Containerized WordPress, MariaDB, and CLI environments (`wp-env`) |
| **Docker Compose** | Compose `v2.x` | Host / Docker | Multi-container orchestration driven by `@wordpress/env` |
| **PHP CLI** | `>= 8.3.0` | Host (Advisory) | Local PHPUnit unit testing, WPCS coding standards linting, and PHPStan |
| **Composer** | `>= 2.7.0` | Host (Advisory) | Installing dev-dependencies (`wpcs`, `phpstan`, `phpunit`) |
| **Git** | Any modern version | Host | Version control and submodules |

> **Note on Containerized vs. Host PHP:**
> When you run `npm run env:start`, WordPress and MariaDB execute inside Docker containers running **PHP 8.3**.
> Installing PHP 8.3 and Composer on your host machine is an advisory recommendation for running local static analysis (`composer lint`, `composer analyse`) and sub-millisecond in-memory PHPUnit tests directly in your IDE or terminal.

---

## 2. Pre-Flight Verification (`npm run pre-check`)

Before starting development, run the automated environment analyzer to inspect your system:

```bash
npm run pre-check
```

### CLI Output Categories

The pre-check script categorizes each tool into three states:

- `[PASS]`: The component meets or exceeds all requirements.
- `[WARN]`: Non-blocking advisory. The core WordPress container can still run, but certain developer tools (like host linting or local PHPUnit) may be limited until installed.
- `[FAIL]`: Blocking error. You must resolve this issue before executing `npm run env:start` (e.g. missing Docker or outdated Node.js).

### Advanced CLI Flags

```bash
# Preview results in strict mode (fails on warnings)
npm run pre-check -- --strict

# Output machine-readable JSON for CI/CD pipelines or AI agents
npm run pre-check -- --json

# Skip local port availability checks (ports 8888 and 8890)
npm run pre-check -- --skip-ports

# Disable ANSI terminal colors
npm run pre-check -- --no-color
```

---

## 3. Platform Setup Guides

### A. macOS (Apple Silicon & Intel)

1. **Install Node.js & npm:**
   Using [nvm](https://github.com/nvm-sh/nvm):
   ```bash
   nvm install 24
   nvm use 24
   ```
   Or using [Homebrew](https://brew.sh/):
   ```bash
   brew install node@24
   brew link node@24
   ```

2. **Install Docker:**
   - Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/).
   - Alternatively, install [OrbStack](https://orbstack.dev/) (fast, lightweight Docker runtime):
     ```bash
     brew install orbstack
     ```
   - Launch Docker Desktop or OrbStack, open settings, and verify the engine is running.

3. **Install Host PHP 8.3 & Composer (Optional but recommended):**
   ```bash
   brew install php@8.3 composer
   brew link php@8.3
   ```

---

### B. Windows Native (PowerShell & cmd.exe)

1. **Install Node.js & npm:**
   Using Windows Package Manager (`winget`):
   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```
   Or download the official installer from [nodejs.org](https://nodejs.org/).

2. **Install Docker Desktop:**
   - Install Docker Desktop using winget:
     ```powershell
     winget install Docker.DockerDesktop
     ```
   - After installation, reboot your computer if prompted.
   - Launch Docker Desktop from the Start menu and confirm "Engine running" appears in the status bar.

3. **Install Host PHP 8.3 & Composer (Optional but recommended):**
   Using [Scoop](https://scoop.sh/):
   ```powershell
   scoop install php composer
   ```
   Or using [Chocolatey](https://chocolatey.org/):
   ```powershell
   choco install php --version=8.3.0 composer
   ```

4. **Shell Conventions:**
   When running terminal commands in native Windows PowerShell or cmd.exe, refer to `.cursor/rules/windows-coreutils-shell.mdc` for recommended Coreutils and execution syntax.

---

### C. Windows Subsystem for Linux (WSL2 Ubuntu)

WSL2 provides a near-native Linux environment on Windows.

1. **Install WSL2 & Ubuntu:**
   From Windows PowerShell (Run as Administrator):
   ```powershell
   wsl --install -d Ubuntu
   ```

2. **Filesystem Rule (Critical for Performance):**
   - Store all project repositories inside the native Linux root filesystem (e.g. `/home/<username>/workspace/...`).
   - **Never** develop under `/mnt/c/...` (Windows 9P mount). Doing so causes severe disk I/O slowdowns and breaks Webpack and Playwright file watchers (`inotify`).

3. **Docker Desktop WSL2 Integration:**
   - Open **Docker Desktop on Windows**.
   - Navigate to **Settings > General** and verify **Use the WSL 2 based engine** is checked.
   - Navigate to **Settings > Resources > WSL Integration**.
   - Turn **ON** the toggle switch next to your Ubuntu distribution (e.g. `Ubuntu`).
   - Click **Apply & restart**.
   - In your Ubuntu terminal, verify Docker access:
     ```bash
     docker ps
     ```

4. **Install Node.js via nvm:**
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   source ~/.bashrc
   nvm install 24
   nvm use 24
   ```

5. **Install Host PHP 8.3 & Composer (Optional but recommended):**
   ```bash
   sudo add-apt-repository ppa:ondrej/php -y
   sudo apt update
   sudo apt install -y php8.3-cli php8.3-xml php8.3-mbstring php8.3-curl composer
   ```

---

### D. Native Linux (Ubuntu, Debian, Fedora, Arch)

1. **Install Node.js & npm:**
   Using NodeSource:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. **Install Docker Engine & Compose Plugin:**
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose-plugin
   sudo systemctl enable --now docker
   ```
   Add your current user to the `docker` group so you can run Docker without `sudo`:
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Install Host PHP 8.3 & Composer:**
   ```bash
   sudo add-apt-repository ppa:ondrej/php -y
   sudo apt update
   sudo apt install -y php8.3-cli php8.3-xml php8.3-mbstring php8.3-curl composer
   ```

---

## 4. Troubleshooting Common Issues

### Issue 1: "The command 'docker' could not be found in this WSL 2 distro"
**Cause:** Docker Desktop WSL integration is not enabled for your distribution.  
**Fix:**
1. Open Docker Desktop in Windows.
2. Go to **Settings > Resources > WSL Integration**.
3. Toggle the switch next to your active Ubuntu distribution.
4. Click **Apply & restart**, then close and re-open your terminal.

### Issue 2: "permission denied while trying to connect to the Docker daemon socket"
**Cause:** On Linux or WSL, your user does not belong to the `docker` user group.  
**Fix:**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Issue 3: "Port 8888 or 8890 is already in use"
**Cause:** Another service (or an earlier `wp-env` instance) is listening on port 8888 (WordPress) or 8890 (phpMyAdmin).  
**Fix:**
1. Stop previous `wp-env` containers:
   ```bash
   npm run env:stop
   ```
2. Or configure custom ports in a local `.wp-env.override.json`:
   ```json
   {
     "port": 9000,
     "phpmyadminPort": 9001
   }
   ```

### Issue 4: "Node.js is below requirement (>= 24.16.0)"
**Cause:** An older version of Node is active in your terminal shell.  
**Fix:**
If you have `nvm` installed:
```bash
nvm install 24
nvm use 24
nvm alias default 24
```

---

## 5. Next Steps

Once all checks pass in `npm run pre-check`:

1. Install project dependencies:
   ```bash
   npm install
   composer install
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Start the local containerized WordPress environment:
   ```bash
   npm run env:start
   ```
4. Access the WordPress Admin dashboard at [http://localhost:8888/wp-admin/](http://localhost:8888/wp-admin/) (`admin` / `password`).
