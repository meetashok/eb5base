# AGENTS.md

## Cursor Cloud specific instructions

### Branch & PR workflow
- Keep ALL changes on the current working branch. Do NOT create a new branch per
  change/fix. Only create a new branch when the maintainer explicitly asks for one
  (e.g. "start a new branch"). Multiple unrelated fixes on one branch/PR is expected.

### Testing preferences
- Do NOT record screen-recording video demos of GUI changes. The maintainer prefers
  to test UI changes themselves in the browser and give feedback. Verify GUI work with
  lighter evidence instead — dev-server run + non-visual checks (e.g. `curl` of the
  rendered HTML, `tsc --noEmit`, `next lint`), or a single screenshot only if truly
  needed. Skip the `RecordScreen` flow.

### Chart footer / "How to read" convention
- All analysis chart explorers (I-526, I-485, and any future ones) should use the
  shared footer in `src/components/analysis/ChartFooter.tsx`:
  - `ChartFooter` renders two links only: `Source data · How to read the data`.
  - The per-selection USCIS suppression caveat is NOT shown inline in the footer; it
    lives at the top of the collapsible `HowToReadCard` (passed via `suppressedCells`).
  - Dataset-specific "how to read" bullets are passed as `children` to `HowToReadCard`.
  - Keep new chart footers on this shared component for consistency.
