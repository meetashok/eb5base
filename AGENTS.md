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

### Analysis chart kit (use it, don't re-derive chrome)
- All analysis chart chrome is centralized so new charts inherit consistency by
  construction. Do NOT paste chart-card / header / toggle class strings inline.
- `src/components/analysis/chart-kit/` (import from the barrel `@/components/analysis/chart-kit`):
  - `ChartCard` - the standard bordered chart/section card.
  - `ChartHeader` - tinted header bar with `title` + `subtitle` (or `metric`/`metricNote`),
    an `action` slot (share button), and a `controls` slot. `ChartHeaderBar` /
    `ChartTitleBlock` / `ChartHeaderControls` are exported for manual composition.
  - `ToggleGroup` (segmented pill toggle) + `ControlLabel`. Values must be strings.
  - Class tokens (`chartCardClass`, `toggleBtnClass`, etc.) for the rare manual case.
- Share: use `AnalysisShareButton` (or the thin per-dataset wrappers). Server side,
  build routes/stores with `createShareRoute` / `createShareStore` and the shared
  `generateShareId`/`isValidShareId` in `src/lib/analysis/shareId.ts`. Don't re-implement.
- Multi-series chart internals live in `src/components/charts/`: `useElementWidth`,
  `useSeriesLegend`, `ChartLegend`, `ChartHoverReadout`. Reuse these for new charts.
- Typography tokens in `globals.css`: `.section-title`, `.eyebrow`, `.control-label`,
  `.body-text`, `.body-muted` (alongside `.page-hero-*`). Prefer them over ad-hoc combos.
- ESLint (`.eslintrc.json`) warns in `src/components/analysis/**` if the chart-card /
  header-bar / toggle-group class strings are inlined - switch to the kit instead.
