### [BUG-014] Mixed-script typos and a missing empty state on three admin screens

- **Severity:** S4      **Priority (proposed):** P3
- **Type:** content / cosmetic
- **Component:** `frontend/src/features/admin/AdminAutoMatching.tsx`,
  `AdminAutoEscrowDocs.tsx`, `AdminCategories.tsx`
- **Environment:** branch `claude/qa-protokol-2`, disposable local QA stack
- **Reproduction rate:** always (static text / structural, not data-dependent)
- **Status:** **Fixed**, same PR as this report
- **Traces to:** §9.1 UI sweep — the remaining admin automation tabs not yet clicked through in
  this pass

**Three unrelated small defects, found back to back while sweeping the tabs under
"Avtomatlashtirish & AI" and "Kategoriyalar":**

**1. Cyrillic dropped into a Latin-script label** — `AdminAutoMatching.tsx:101`. The max-distance
control read "Maksimal Masofa **Радиуси** (km)" — every other word on the screen is Uzbek Latin
script; this one word is Russian Cyrillic for "radius". Almost certainly typed with the wrong
keyboard layout active and never proofread, since the Latin word "Radiusi" was clearly intended.

**2. Turkish/non-Uzbek characters in the escrow guarantee text** — `AdminAutoEscrowDocs.tsx:138`.
"**Mablağ** Baito **trasst** hamyonida muzlatiladi" uses a Turkish `ğ` (Uzbek Latin uses an
apostrophe: `Mablag'`) and a doubled consonant in "trasst" (should be "trast", the standard
Uzbek transliteration of "trust"). Both read as foreign/misspelled to a native Uzbek speaker on
a screen otherwise written cleanly.

**3. No empty state on the categories grid** — `AdminCategories.tsx`. `{filtered.map(...)}` over
an empty array renders nothing: no "no categories yet" message, no distinction between "database
has zero categories" and "your search matched nothing" and "still loading". A blank content area
below a header and a search box is indistinguishable from the screen being broken — the exact
anti-pattern already fixed elsewhere in this codebase (`AdminPayouts.tsx` correctly shows
"Kutilayotgan so'rov yo'q" for its own empty list).

**Impact**
Low on all three — none block a workflow or lose data. Grouped as one finding because they are
the same class of defect (unproofread/unfinished content and UI state) on screens that otherwise
looked complete, and because QA.md's own bar for this pass is "click every button, confirm every
screen" — these are exactly the kind of thing that bar is meant to catch.

**Fix applied**
- `AdminAutoMatching.tsx`: "Радиуси" → "Radiusi".
- `AdminAutoEscrowDocs.tsx`: "Mablağ ... trasst" → "Mablag' ... trast".
- `AdminCategories.tsx`: added a centered message — "Hozircha kategoriya qo'shilmagan" when the
  underlying list is genuinely empty, "Qidiruvga mos kategoriya topilmadi" when a search term
  filtered everything out — shown in place of the grid whenever `filtered.length === 0` and the
  screen isn't still loading.

**Verified**
Live in the browser: both labels read correctly after the fix; the categories screen (genuinely
empty in this QA environment — confirmed via `GET /admin/categories` → `[]`) now shows "Hozircha
kategoriya qo'shilmagan" instead of a blank grid.

Frontend typecheck (`tsc --noEmit`): clean. Frontend unit tests: **49 passed, 0 failed**.
