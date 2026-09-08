# Tests & Acceptance Criteria — Phase 01: [Feature Name]

## 1. Acceptance Criteria Checklist
- [ ] AC-1: Feature functions as specified under normal conditions.
- [ ] AC-2: Edge cases and invalid input return structured errors (400/422).
- [ ] AC-3: Permission checks prevent unauthorized access (401/403).
- [ ] AC-4: UI displays loading, success, and error states gracefully.

## 2. Test Plan by Pyramid Tier
1. **Tier 1 (Static Analysis):** `composer lint && composer analyse && npm run lint` exit with 0 errors.
2. **Tier 2 (PHPUnit):** Unit test cases authored for Domain and Application services.
3. **Tier 3 (Jest):** React component render and user interaction tests.
4. **Tier 4 (Bruno):** Automated `.bru` requests added to `bruno/` verifying REST contracts.
5. **Tier 5 (Playwright):** Browser interaction and visual snapshot comparison.
