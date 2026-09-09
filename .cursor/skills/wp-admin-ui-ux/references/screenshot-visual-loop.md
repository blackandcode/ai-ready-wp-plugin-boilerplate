# Screenshot Visual Review Loop

Use this reference for every UI change that affects a WordPress admin screen.

## Minimum Three-Cycle Loop

For visual UI work, complete at least three cycles:

1. Analyze the current screenshot.
2. Implement a small improvement set.
3. Rebuild/reload and capture screenshots again.
4. Inspect the new screenshot before choosing the next improvement.

Repeat until at least three cycles are complete and no actionable visual issues
remain. If the first cycle looks good, the next cycles should still verify
responsive states, alternate data states, or interaction states.

## Cycle Template

Cycle 1: structure and hierarchy

- Capture baseline screenshots for the target screen.
- Check title duplication, navigation, section grouping, action placement,
  loading/empty/error states, and WordPress admin fit.
- Improve layout, component choice, obvious hierarchy, and state coverage.

Cycle 2: interaction and microcopy

- Capture screenshots after cycle 1 changes.
- Check labels, help text, count summaries, status badges, notices,
  disabled/saving/error states, and keyboard/focus visibility.
- Improve wording, i18n coverage, action eligibility, feedback, and trust cues.

Cycle 3: polish and resilience

- Capture screenshots after cycle 2 changes.
- Check spacing, alignment, wrapping, responsive behavior, long labels, dense
  data, narrow viewport, and visual regressions.
- Improve final polish and update baselines only when the new visual output is
  intentional.

Additional cycles are required when screenshots still show overlap, broken
hierarchy, unreadable text, missing states, inconsistent components, or
non-native wp-admin styling.

## Screenshots To Capture

Choose the smallest meaningful set, but include all states touched by the
change:

- Settings default section.
- Settings dirty/saving/error state when save behavior changes.
- DataViews populated state.
- DataViews empty state.
- DataViews filtered-empty state.
- Create/edit page loaded state.
- Create/edit page dirty, validation, saving, and success states.
- Permission denied or disabled action state when capability logic changes.
- Desktop viewport.
- Narrow/mobile viewport for responsive layout changes.

Prefer existing project Playwright tests when available:

```bash
npm run test:e2e
npm run test:e2e:update
npx playwright test
npx playwright test --update-snapshots
```

Use the actual available scripts from `package.json` and the target test files.
Do not update snapshots casually; inspect the screenshot first and update only
when the new UI is intentionally better.

## How To Inspect

- Open generated screenshots from `tests/e2e/playwright/__screenshots__/` or the
  configured Playwright output directory.
- Use image inspection tools when available, including local image viewing.
- Check browser console output and Playwright failures for hidden UI errors.
- Compare screenshots against the visual review checklist in
  `wp-admin-ux-rules.md`.

## Evidence Requirement

Record:

- The three cycle numbers.
- The screenshot paths inspected in each cycle.
- The concrete visual issues found.
- The changes made after each cycle.
- The final commands and pass/fail status.

If Playwright cannot run, state the exact blocker, the command attempted, and
what visual evidence is missing. Do not claim the UI is visually verified
without screenshots.
