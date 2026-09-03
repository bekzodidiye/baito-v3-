# Per-control click sweep — worker & employer — 2026-09-03

Round 1 and round 2 both **enumerated** controls and verified the screens around them, but
neither pressed each control individually — round 2's report says so explicitly ("1,423
controls were enumerated and their screens verified; each control was **not** individually
clicked in this pass"). This pass closes that gap for the two user-facing roles.

## Method

A Playwright harness clicked **every visible control, one at a time, each from a freshly
loaded page**, so no click inherited state from the one before it. For each click it
recorded: URL before/after, a hash of `document.body.outerHTML`, node count, every
`/api/` request fired, native dialogs, file choosers, and console errors.

Logout controls were skipped by name (28 of them) — clicking one ends the session and the
remaining controls on that route would report a false "dead".

Selector: `button, a[href], [role=button], [role=tab], [role=switch], input[type=submit],
input[type=checkbox], input[type=radio], summary`.

Accounts were created through the real signup flow (`send-sms` → `verify-sms` →
`POST /users`) on the disposable QA stack, then seeded with jobs, applications, a bookmark,
a saved card and a balance so the screens had content worth pressing.

## Coverage

| Role | Routes | Controls clicked |
|---|---|---|
| worker | 21 | 356 |
| employer | 17 | 286 |
| **total** | **38** | **642** |

| Outcome | Count |
|---|---|
| navigated (URL changed) | 302 |
| acted (DOM / network / dialog changed) | 130 |
| no observable effect | 114 |
| click timed out | 64 |
| skipped (logout) | 28 |
| not present on reload | 4 |

## Triage of the 114 "no effect" results

A first-pass detector that compares only visible text misses controls that change nothing
but CSS classes — a selected day, an active filter. Every candidate was therefore
**re-clicked with a strict detector** that hashes full markup and watches for file
choosers, and the survivors were then read in source. That resolved all 114:

| Cause | Count | Verdict |
|---|---|---|
| the current page's own nav item | 24 | correct — clicking "Kalendar" while on `/calendar` should do nothing |
| already-active filter or tab | 31 | correct — verified by clicking a sibling first, then back (`/employer-jobs`: sibling click changed the DOM, target click then changed it again) |
| pre-selected option | 14 | correct — `/employer-post`'s first category is selected on load; picking another deselects it and clicking it back reselects it |
| class-only change the loose detector missed | 22 | correct — calendar days, notification and application filters |
| opens a native file chooser | 5 | correct — attach file, change photo, image upload |
| guarded no-op on empty input | 6 | correct — Send with an empty box, "Qo'shish" with an empty tag field |
| `tel:` / `mailto:` links | 4 | correct — nothing for a headless browser to do |
| non-interactive `div` caught by the selector | 2 | not a control |
| **genuinely dead** | **6** | **BUG-019 (×5 share buttons), BUG-020 (×1 search)** |

## Triage of the 64 timeouts

| Cause | Count | Verdict |
|---|---|---|
| the `sr-only` "Asosiy kontentga o'tish" skip link, off-screen until focused | 38 | correct |
| controls inside the collapsed bottom sheet on `/jobs` — the map view opens with the list closed | 21 | correct; re-tested after opening the list via "Ro'yxatni ochish uchun bosing" and **`Arizani topshirish` fired `POST /jobs/{id}/apply`** |
| disabled by design (`Ariza yuborilgan`, `Kartani bog'lash` before the form is valid) | 5 | correct |

No click anywhere in the sweep was blocked by an overlay intercepting pointer events — the
failure mode behind round 1's BUG-007 did not recur.

## What the sweep found

Pressing controls one at a time surfaced two defects that no amount of enumeration could
have: a button can fire, look right, and still not do its job.

| ID | Severity | Summary |
|---|---|---|
| BUG-017 | S1 | Payments-screen withdrawal shows "Muvaffaqiyatli!" and never calls the server |
| BUG-018 | S2 | "Jonli chat" answers the user itself; the message never leaves the browser |
| BUG-019 | S3 | Share on job cards is inert on desktop — `navigator.share` guard with no fallback |
| BUG-020 | S4 | The Payments search button has no handler, but is labelled for screen readers |
| BUG-021 | S3 | "Soliq hujjatlari" promises documents that no code path can produce |

BUG-017 and BUG-018 are the same shape: **the UI reports success for work it never did.**
Both have a correct implementation of the very same action elsewhere in the codebase
(`useProfileScreen.ts` for withdrawal, `useChatsData.ts` for support), so neither is a
missing feature — both are a screen wired to nothing while a working path sits beside it.

## Not covered by this sweep

- **Admin** (`/admin`, 21 sub-screens). Round 2 swept all of them at screen level; they
  were not re-clicked control-by-control here. The sweep was scoped to the user-facing
  roles the request named.
- **Keyboard activation.** Controls were clicked, not tabbed to and pressed with
  Enter/Space. The map markers (`role="button"` on a Leaflet `divIcon`) are the place that
  most warrants a keyboard pass.
- **Mobile viewport.** Everything ran at 1400×900. BUG-019 is specifically a desktop
  defect, so the mobile behaviour of the same button is untested here.
