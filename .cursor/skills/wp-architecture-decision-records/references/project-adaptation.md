# Project Adaptation & Convention Discovery

A core requirement of `wp-architecture-decision-records` is that it must **adapt seamlessly to existing repositories** rather than forcing a rigid, foreign convention on an established project.

---

## 1. Automated Convention Discovery Order

When executed in any repository, the skill runs `scripts/detect-adr-conventions.mjs` to discover existing patterns before making any modifications:

```text
Target Repository
       │
       ▼
1. Scan for ADR directory
   Candidates: docs/adr/ ──► docs/decisions/ ──► adr/ ──► decisions/ ──► custom
       │
       ▼
2. Scan for Index/Registry file
   Candidates: README.md ──► index.md ──► INDEX.md
       │
       ▼
3. Detect Numbering & Slug Convention
   - 4-digit padded (0001-slug.md)
   - 3-digit padded (001-slug.md)
   - Slug-only / unnumbered (slug.md)
       │
       ▼
4. Detect Metadata Header Format
   - Markdown list bullet: - **Status:** accepted
   - Inline header: Status: accepted
   - YAML frontmatter: status: accepted
```

---

## 2. Decision Rules for Project Adaptation

1. **Never Overwrite Established Conventions:** If a project already uses `docs/decisions/` with 3-digit numbering (`001-foo.md`), continue using `docs/decisions/` and 3-digit numbers. Do not rename or renumber existing files.
2. **Safe Fallbacks for Greenfields:** If no ADR directory is found:
   - Default directory: `docs/adr/`
   - Default numbering: 4-digit zero-padded (`0001-`, `0002-`)
   - Default index: `docs/adr/README.md`
   - Default template: `adr-simple.md`
3. **No Brittle Configuration Files:** The skill does not require `.adr-config.json` or external setup files to function. It infers conventions directly from the filesystem.
4. **CLI Flag Overrides:** If an engineer or agent needs to override auto-detected conventions, standard CLI flags are available:
   - `--dir <path>`: Explicitly set the ADR directory.
   - `--template <simple|madr>`: Explicitly select the template.
   - `--status <status>`: Set the initial lifecycle state.
