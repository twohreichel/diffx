# Constitution — diffx View Modes Fork

Governing principles for every feature in `specs/`. A plan that violates a
principle must either be changed or must record an explicit, justified exception
in its "Constitution Check" section.

## I. Comprehension is the product

diffx exists so a human can understand a change quickly. Every feature is judged
by one question: does it reduce the time to understand a diff? Visual polish that
does not move that number is out of scope. Where two designs compete, prefer the
one that requires less eye movement and less mental alignment work.

## II. Additive, never destructive

New view modes are added alongside Split and Unified. The existing modes, their
keyboard behaviour, and their persisted settings keep working exactly as before.
No feature may remove or repurpose an existing control.

## III. Upstream compatibility

The fork tracks `upstream/main`. Changes are localized: prefer adding new modules
over editing existing ones, and prefer a new render branch over rewriting the
shared renderer. Every feature declares in its plan whether it is
UPSTREAM-CANDIDATE or FORK-ONLY.

## IV. Server stays thin

`git` is the source of truth. The server shells out to git (and, for feature 005,
to `difft`) and passes results through. Diff semantics are not reimplemented in
TypeScript when a battle-tested tool already computes them.

## V. Graceful degradation

Every mode must render something useful when its preconditions fail: no language
support, no external binary, a file too large, a binary file, a parse error. The
fallback is always the current Unified view plus a one-line notice. A missing
optional dependency is never a crash.

## VI. Performance budget

Interaction must stay under 100 ms for mode switches on a file already loaded,
and under 1 s for a re-fetch from the server on a typical file (< 2000 lines).
Anything heavier runs asynchronously with a visible loading state and must be
cancellable when the user navigates away.

## VII. State is persisted and per-user

New modes and their options join the existing persisted-settings mechanism, so a
preference survives a restart. Settings are per-user and local; nothing is written
into the reviewed repository.

## VIII. Keyboard first

Every mode and every toggle is reachable by keyboard. New shortcuts must not
collide with existing diffx or browser shortcuts, and are discoverable through a
help overlay or visible hint.

## IX. Accessibility

Meaning is never carried by colour alone: additions, removals, moves and
structural changes each carry a glyph, a border, or a label. Contrast follows
WCAG AA against both GitHub light and dark themes, which Shiki already provides.

## X. Testing

Each feature ships unit tests for its pure logic (diff transformation, parsing,
alignment) independent of the UI. Render behaviour is covered by at least one
snapshot or DOM assertion per mode. A feature without a test for its pure core
is not done.

## Governance

Amendments to this constitution require a commit that states the reason and the
features affected. Plans reference the constitution by principle number.
