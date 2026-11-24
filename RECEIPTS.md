# Brotoscope receipts

Till receipts: newest first, one per change a reader can see and one per correction. Each is short, and enough to
trace the change back to its commit.

- **change**: what changed, who asked for it, the check that proves it (and the planted fault that check catches), and
  the commit.
- **correction**: what was claimed before, what was wrong with it, and what made someone look.

## 2026-11-20 · change · the first scope: brim wave

- **What:** `scopes/brimwave/` (the part, its page, a bare host, four blocks in `code/`, a generated `manifest.json`) and
  `tools/check_manifest.py`. The README's status changes from "intent only" to "the first scope is here"; the plan
  below it is unchanged.
- **Asked:** Doug Bristor. Minded by insights.
- **Checked by:** on the published copy in a headless browser: the bare host's interface tests H1 to H6 pass, and with
  the planted fault (`?plant=dropq`) only H2 fails; the page's checks C1 to C7 pass; the wave canvas is byte-identical
  to the source page's. The four blocks' syntax trees equal the source blocks' (comments rewritten for publication
  only). The manifest checker passes, and fails when a file's byte changes or an import points outside the manifest.
- **Not checked here:** the in-page checks were run by this repository's author in Chromium only; the numeric claims
  come from the source blocks' own conformance runs, which are not copied into this repository.

## 2026-10-10 · change · repository created

- **What:** intent only: README, receipts and licence, no code.
- **Asked:** Doug Bristor.
- **Checked by:** caro's read of the README (wording: finite no-escape tests rather than membership; recipe links
  carry declared settings, not guaranteed identical pixels; each build records its coordinate convention).
