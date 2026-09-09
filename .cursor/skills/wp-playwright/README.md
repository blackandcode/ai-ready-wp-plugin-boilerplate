# `wp-playwright` agent skill

A focused WordPress Playwright skill designed to complement:

- `playwright-best-practices`
- WordPress project/plugin/block skills

It covers only WordPress-specific E2E concerns:

- `@wordpress/e2e-test-utils-playwright`
- WordPress admin authentication and storage state
- `wp-env`
- `@wordpress/scripts` Playwright configuration
- `admin`, `editor`, `pageUtils`, and `requestUtils`
- Block Editor iframe handling
- REST-first test setup
- plugin, admin, editor, Site Editor, and front-end flows
- WordPress-specific troubleshooting

## Installation

Copy the `wp-playwright` folder into the agent-skills directory used by your coding tool.

Examples:

```text
.cursor/skills/wp-playwright/
.claude/skills/wp-playwright/
.github/skills/wp-playwright/
.codex/skills/wp-playwright/
```

Keep the complete folder, including `references/`.

The skill expects the existing Currents skill to remain installed for general Playwright best practices.
