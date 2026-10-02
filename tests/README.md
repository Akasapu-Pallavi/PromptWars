# NOVA RESCUE Tests

Lightweight, dependency-free QA for the existing decision engine, queue filters, rescue actions, and business-impact math.

## Approach

- No npm packages, test runners, or browsers required.
- `qa_test.js` loads `js/data.js`, `js/engine.js`, and `js/app.js` in a Node sandbox.
- Assertions cover the live product rules: rescue recommendations, risk scoring, Apply Rescue side effects, slider math, search, and filters.

## Run

From the project root:

```bash
node tests/qa_test.js
```

## Coverage

1. Decision engine
2. Risk score calculation
3. Nearby store rescue
4. Product substitution
5. ETA adjustment
6. High-risk manual override
7. Apply Rescue Action
8. At Risk → Rescued status change
9. Rescued order counter
10. Preserved revenue calculation
11. Business impact calculations
12. Rescue-rate slider calculations
13. Search
14. Risk filtering
15. Status filtering

Each run prints `PASS` or `FAIL` per test and a final tally.
