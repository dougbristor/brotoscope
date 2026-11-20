# Brotoscope

**Status: the first scope is here.** The **brim wave** scope runs in your browser (2-D canvas, no GPU needed):
**[open it](https://demo.bristorbrot.org/brotoscope/scopes/brimwave/)**. It draws the border of the brotoid's map (where the
Jacobian determinant is zero) as a wave, and marks where a ball of chosen centre and radius meets it. The rest of the
Brotoscope is still a plan, described below; more scopes will arrive here as each one is checked.

**Website: [bristorbrot.org](https://bristorbrot.org)** · Main code: [dougbristor/bristorbrot](https://github.com/dougbristor/bristorbrot)
(reusable algebra blocks and the simple player) · Try the player now: [bristorbrot.org/beta/viewer](https://bristorbrot.org/beta/viewer/)

## What is here now

- **[`scopes/brimwave/`](scopes/brimwave/)**: one scope. `wave.js` is the part (`mount(canvas, settings)` returns `set`, `state`,
  `still`, `destroy`, `checks`); `index.html` and `scope.js` are the page around it; `host.html` is a bare host that
  mounts the part twice and tests the interface (H1 to H6). The page's own checks C1 to C7 run in the page, and each
  has a planted fault that must make it fail. `code/` holds the four checked blocks it uses, and `manifest.json` lists
  every file with its hash.
- **[`tools/check_manifest.py`](tools/check_manifest.py)**: `python3 tools/check_manifest.py scopes/brimwave` checks that
  every listed file is present with its hash, nothing is unlisted, and every import resolves.

The blocks in `code/` come from the project's CodeT source tree. For publication their comments were rewritten to
remove internal references; the code is the same (the parsed syntax trees are identical, and `manifest.json` records
both hashes).

## What it is for

The Bristorbrot player shows one set at a time, cleanly. The Brotoscope is the instrument for asking questions of
the sets:

- **Compare two algebras at the same point.** Evaluate the Bristorian set and the quaternion set at the same sample,
  section, map and iteration budget. Classify each sample by finite no-escape tests at that stated budget: both orbits
  stay inside the escape radius (shared), only the Bristorian orbit does (B-only), or only the quaternion orbit does
  (Q-only).
  These are finite tests, not proofs that a point belongs to the set.
- **Move inside the structure, not only around it.** Navigate to a chosen focus, clip the front and the back of the
  sampled depth, and spend resolution on the feature you approach rather than magnifying a fixed grid.
- **Keep the controls that change the answer separate and visible.** Iteration budget, spatial sampling, point size,
  screen raster and lighting are independent settings, so a change in the picture can be traced to its cause. Light
  colour stays separate from algebra colour.
- **Cover the families together:** parameter (Mandelbrot) and Julia modes, square and cube maps, both bracketings of
  the Bristorian cube (`(zz)z` and `z(zz)`), and sections through the four-slot space.
- **Make every view a recipe.** A view is a link that carries all of its declared settings, so an observation can be
  shared, repeated and checked. The same recipe on a different engine or GPU may differ in its exact pixels.

## How it will be built

- **Algebra comes from the blocks.** The plan is for the Brotoscope to use the conformance-tested blocks from
  [dougbristor/bristorbrot](https://github.com/dougbristor/bristorbrot) (`core/`) rather than its own copies of the
  products, so a change to the algebra happens once, in the block, with its tests. Each build records its coordinate
  convention, and moving a build onto the public blocks is checked against its earlier results.
- **Every release states what it shows and what it does not.** Bounded sets here are finite no-escape tests at a
  stated budget, not proofs of membership. Surfaces, where used, are approximations, and the release notes say so.
- **A build arrives with a test that can fail.** Each feature ships with a check that passes as shipped and fails
  when the feature is deliberately broken.
- **Current first, history second.** The README describes what the tool does now. [RECEIPTS.md](RECEIPTS.md) records
  every change and every correction, newest first, with what proved it.

The project's thinking gets more precise over time and sometimes overturns an earlier view. When that happens, the
correction is recorded in the receipts with the reason, not quietly rewritten.

## Bristorian is not quaternion

They share the symbols i, j and k but are different algebras. Bristorian numbers (imordials) have ranked imaginary
units, with `i·j = j` and `j·i = −i`. Their product depends on order and on brackets. Quaternions depend on order
only. The Brotoscope exists to show exactly where that difference changes the shape.

## Licence

Code is [MIT](LICENSE). Copyright (c) 2026 Doug Bristor.
