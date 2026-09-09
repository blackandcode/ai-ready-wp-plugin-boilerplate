# Development Prerequisites and Environment Setup

This document defines the system requirements, toolchains, and setup steps required to develop, test, and build plugins using the **WordPress AI Plugin Development Boilerplate**.

It leverages `@wordpress/env` (`wp-env`), the [official WordPress local development environment](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-env/), supporting all major operating systems: **macOS**, **native Windows**, **Windows Subsystem for Linux (WSL2)**, and **native Linux**.

---

## 1. Quick Requirements Matrix

| Tool / Runtime | Minimum Version | Scope | Purpose |
|:---|:---|:---|:---|
| **Node.js** | `>= 24.16.0` | Host | Asset compilation (`@wordpress/scripts`), test runners, scaffolding CLI |
| **npm** | `>= 11.0.1` | Host | Package management and script orchestration |
| **Docker** | Docker 24+ / Desktop 4+ | Host / Virtualization | Containerized WordPress, MariaDB, and CLI environments (`wp-env`) |
| **Docker Compose** | Compose `v2.x` or `v5.x` | Host / Docker | Multi-container orchestration driven by `@wordpress/env` |
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
```

---

## 3. OS-Specific Setup Guides

### A. macOS (Apple Silicon / Intel)

1. **Install Homebrew & Node.js 24:**

   ```bash
   brew install node@24
   brew link node@24
   ```

2. **Install Docker:**
   Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) or [OrbStack](https://orbstack.dev/).
3. **Install Host PHP 8.3 & Composer (Optional but recommended):**

   ```bash
   brew install php@8.3 composer
   brew link php@8.3
   ```

### B. Windows Subsystem for Linux (WSL2 - Recommended for Windows)

1. **Ensure WSL2 & Ubuntu are installed:**

   ```powershell
   wsl --install -d Ubuntu
   ```

2. **Configure Docker Desktop:**
   In Docker Desktop: Settings > General > check **Use the WSL 2 based engine**. Under Settings > Resources > WSL Integration > enable Ubuntu.
3. **Install Node.js, PHP 8.3 & Composer in Ubuntu:**

   ```bash
   sudo apt update
   sudo apt install -y curl git unzip software-properties-common
   sudo add-apt-repository ppa:ondrej/php -y
   sudo apt update
   sudo apt install -y php8.3-cli php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip
   curl -sS https://getcomposer.org/installer | php
   sudo mv composer.phar /usr/local/bin/composer
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   source ~/.bashrc
   nvm install 24
   ```

### C. Native Linux (Ubuntu / Debian / Fedora)

1. **Install Docker Engine & Compose plugin:** Follow official Docker instructions.
2. **Install Node 24:** Via NodeSource or nvm.
3. **Install PHP 8.3 CLI & Composer:** Via `ppa:ondrej/php` (Ubuntu) or system packages.

---

## 4. Bootstrapping the Repository

Once prerequisites are satisfied:

```bash
# 1. Install Node dependencies
npm install

# 2. Install PHP dependencies & stubs
composer install

# 3. Boot containerized WordPress sandbox
npm run env:start

# 4. Run automated post-start provisioning
npm run wp:setup
```
