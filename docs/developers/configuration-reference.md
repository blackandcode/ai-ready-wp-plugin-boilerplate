# Configuration Templates Reference

This document provides complete, annotated configuration templates for reference across all project subsystems.

---

## 1. `package.json`

```json
{
  "name": "ai-ready-wp-plugin-boilerplate",
  "version": "1.2.0",
  "private": true,
  "engines": {
    "node": ">=24.16.0",
    "npm": ">=11"
  },
  "scripts": {
    "pre-check": "node tools/environment/check-environment.mjs",
    "env:start": "wp-env start",
    "env:stop": "wp-env stop",
    "env:destroy": "wp-env destroy",
    "env:clean": "wp-env clean all",
    "env:reset": "wp-env reset all",
    "env:logs": "wp-env logs",
    "env:cli": "wp-env run cli bash",
    "wp:setup": "node tools/wp-env/after-start.mjs",
    "build": "wp-scripts build",
    "start": "wp-scripts start",
    "lint": "npm run lint:js && npm run lint:css && npm run lint:md && npm run lint:actions",
    "test": "npm run test:unit && npm run test:scaffold && npm run test:versioning && npm run test:environment && npm run test:release",
    "openapi:generate": "wp-env run cli wp ai-ready openapi generate",
    "openapi:check": "wp-env run cli wp ai-ready openapi check",
    "openapi:lint": "redocly lint docs/api/openapi.yaml",
    "release:build": "node tools/release/build-package.mjs",
    "release:validate": "node tools/release/validate-package.mjs",
    "release:check": "node tools/release/validate-release.mjs"
  }
}
```

---

## 2. `composer.json`

```json
{
  "name": "ai-ready/ai-ready-wp-plugin-boilerplate",
  "description": "Production WordPress plugin built with the Agentic Boilerplate.",
  "type": "wordpress-plugin",
  "license": "GPL-2.0-or-later",
  "require": {
    "php": ">=8.3"
  },
  "autoload": {
    "psr-4": {
      "AIReady\\WPPluginBoilerplate\\Framework\\": "src/framework/",
      "AIReady\\WPPluginBoilerplate\\Backend\\": "src/backend/",
      "AIReady\\WPPluginBoilerplate\\Frontend\\": "src/frontend/Bridge/"
    }
  }
}
```

---

## 3. `redocly.yaml`

```yaml
apis:
  main:
    root: docs/api/openapi.yaml

extends:
  - recommended

rules:
  operation-operationId: error
  operation-summary: error
  no-identical-paths: error
  no-ambiguous-paths: error
  operation-4xx-response: off
  info-license: off
```

---

## 4. `.github/dependabot.yml`

```yaml
version: 2
updates:
  # Maintain GitHub Actions dependencies with semantic version tags
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    commit-message:
      prefix: "ci"
      include: "scope"
    allow:
      - dependency-type: "direct"

  # Maintain npm runtime and development dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    commit-message:
      prefix: "deps"
      include: "scope"
    open-pull-requests-limit: 10
    allow:
      - dependency-type: "direct"
    ignore:
      - dependency-name: "react"
        versions: ["19.x", ">= 19"]
      - dependency-name: "react-dom"
        versions: ["19.x", ">= 19"]
      - dependency-name: "typescript"
        versions: ["7.x", ">= 7"]
      - dependency-name: "@wordpress/components"
        versions: ["40.x", ">= 40"]
      - dependency-name: "@wordpress/block-editor"
        versions: ["17.x", ">= 17"]

  # Maintain Composer PHP runtime and dev dependencies
  - package-ecosystem: "composer"
    directory: "/"
    schedule:
      interval: "weekly"
    commit-message:
      prefix: "deps(php)"
      include: "scope"
    open-pull-requests-limit: 10
    allow:
      - dependency-type: "direct"
    ignore:
      - dependency-name: "phpunit/phpunit"
        versions: ["12.x", "13.x", ">= 12"]
      - dependency-name: "php-stubs/wordpress-stubs"
        versions: ["7.x", ">= 7"]
      - dependency-name: "symfony/yaml"
        versions: ["8.x", ">= 8"]
```
