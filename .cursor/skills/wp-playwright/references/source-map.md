# Research source map

Research snapshot: 2026-08-01.

This skill intentionally prioritizes official WordPress/Gutenberg and Playwright sources. Community issue reports are used only for concrete package failure modes.

## Canonical package and API

- WordPress package documentation  
  https://developer.wordpress.org/block-editor/reference-guides/packages/packages-e2e-test-utils-playwright/

- Gutenberg package source  
  https://github.com/WordPress/gutenberg/tree/trunk/packages/e2e-test-utils-playwright

- Current package manifest  
  https://raw.githubusercontent.com/WordPress/gutenberg/trunk/packages/e2e-test-utils-playwright/package.json

- Extended Playwright fixture implementation  
  https://raw.githubusercontent.com/WordPress/gutenberg/trunk/packages/e2e-test-utils-playwright/src/test.ts

- RequestUtils implementation  
  https://raw.githubusercontent.com/WordPress/gutenberg/trunk/packages/e2e-test-utils-playwright/src/request-utils/index.ts

- REST setup and nonce handling  
  https://raw.githubusercontent.com/WordPress/gutenberg/trunk/packages/e2e-test-utils-playwright/src/request-utils/rest.ts

- Standard WordPress login implementation  
  https://raw.githubusercontent.com/WordPress/gutenberg/trunk/packages/e2e-test-utils-playwright/src/request-utils/login.ts

## Official WordPress E2E guidance

- WordPress E2E testing handbook  
  https://developer.wordpress.org/block-editor/contributors/code/testing-overview/e2e/

- Official 2026 tutorial with plugin/theme examples  
  https://developer.wordpress.org/news/2026/05/getting-started-writing-wordpress-e2e-tests-with-playwright/

- `@wordpress/scripts` package documentation  
  https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/

- Current WordPress Scripts Playwright configuration  
  https://raw.githubusercontent.com/WordPress/gutenberg/trunk/packages/scripts/config/playwright.config.js

- Current WordPress Scripts global setup  
  https://raw.githubusercontent.com/WordPress/gutenberg/trunk/packages/scripts/config/playwright/global-setup.js

## WordPress environment

- `wp-env` guide  
  https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-env/

- `@wordpress/env` package  
  https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/

## Companion generic Playwright skill

- Currents Playwright Best Practices Skill  
  https://github.com/currents-dev/playwright-best-practices-skill

This `wp-playwright` skill deliberately avoids reproducing its generic Playwright material.

## Relevant package issues

- External-project packaging regression reported in 1.48.0  
  https://github.com/WordPress/gutenberg/issues/78963

- Authentication misunderstanding and browser-context question  
  https://github.com/WordPress/gutenberg/issues/70390

- External URL / REST nonce endpoint issue  
  https://github.com/WordPress/gutenberg/issues/52598

- REST readiness race while starting `wp-env`  
  https://github.com/WordPress/gutenberg/issues/61627

- Theme activation failure when the expected theme is absent  
  https://github.com/WordPress/gutenberg/issues/50741

## Version notes

At the research date, the Gutenberg trunk package manifest reported:

- `@wordpress/e2e-test-utils-playwright`: `1.51.0`
- Node engine: `>=18.12.0`
- peer dependency: `@playwright/test >=1`

Do not treat these numbers as permanent. Check the repository lockfile and installed package whenever updating dependencies.
