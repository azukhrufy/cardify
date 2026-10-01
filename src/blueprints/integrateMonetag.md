# Blueprint: Monetag Ads on Calculator Pages

## Goal

Show Monetag ads on the calculator pages, triggered only by user interaction with
the two primary action buttons, and rate-limited so a single user sees at most one
ad per 5-minute window.

## Scope

| File | Change |
| --- | --- |
| [src/pages/calculator/tiktok.js](../pages/calculator/tiktok.js) | Trigger + throttle on calculate / export |
| [src/pages/calculator/youtube.js](../pages/calculator/youtube.js) | Trigger + throttle on calculate / export |
| [src/pages/calculator/instagram.js](../pages/calculator/instagram.js) | Trigger + throttle on calculate / export |
| [src/lib/loadMonetag.js](../lib/loadMonetag.js) | Loader helpers (extend if needed) |

## Current State

- The **Calculate** button on all three pages already carries
  `id="calculate-rate-card"`.
- The **Export PDF** button on all three pages already carries
  `id="export-rate-card"`.
- `loadMonetagScript()` is already called from `onSubmit`, guarded by the
  `userClickedSubmitRef` flag so it fires only on a real button click, not on
  programmatic submit.
- `loadMonetagPushNotification()` is called once on page mount from a
  `useEffect`.
- [src/lib/loadMonetag.js](../lib/loadMonetag.js) exposes two independent loaders,
  each guarded against duplicate `<script>` injection:
  - `loadMonetagScript()` — vignette / in-page ad, zone `11930901`.
  - `loadMonetagPushNotification()` — push tag, zone `11930912`.
- The snippet in [Provided Snippet](#provided-snippet-from-monetag) (zone
  `11931554`) is **not wired up yet** — no loader for it exists.

## Provided Snippet (from Monetag)

Zone `11931554`, tag script `https://nap5k.com/tag.min.js`. This is a **third** zone —
neither of the two already wired in [src/lib/loadMonetag.js](../lib/loadMonetag.js).

```html
<script>(function(s){s.dataset.zone='11931554',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
```

The snippet is a self-executing IIFE: it picks `document.body` if present, else
`document.documentElement`, appends the script, and tags it with
`data-zone="11931554"`.

Equivalent inside [src/lib/loadMonetag.js](../lib/loadMonetag.js), matching the
existing loader style (client guard, dedupe by zone, `async`, appended to `body`):

```js
const MONETAG_TAG_SRC = "https://nap5k.com/tag.min.js";
const MONETAG_TAG_ZONE = "11931554";

export function loadMonetagTag() {
  if (typeof window === "undefined") return;
  if (document.querySelector(`script[data-zone="${MONETAG_TAG_ZONE}"]`)) return;

  const script = document.createElement("script");
  script.dataset.zone = MONETAG_TAG_ZONE;
  script.src = MONETAG_TAG_SRC;
  script.async = true;

  document.body.appendChild(script);
}
```

Note: `dataset.zone` must be set **before** `src` is assigned — in the original
IIFE the assignment order does the same, and the network request can start as soon
as `src` is set.

## Requirements

1. **Interaction-gated.** Ads must not appear on page load. They render only after
   the user activates one of:
   - the button with `id="calculate-rate-card"`;
   - the button with `id="export-rate-card"`.

2. **Throttled to one ad per 5 minutes.** If the user presses either button within
   5 minutes of the last ad being shown, no ad is shown. The counter/threshold is
   persisted in `sessionStorage`.

3. **Reuse the existing loader.** [src/lib/loadMonetag.js](../lib/loadMonetag.js)
   is the single entry point; extend it rather than inlining script tags in the
   page components.

4. **Three pages stay in sync.** The behavior is identical on `tiktok`, `youtube`,
   and `instagram`; the implementation should not drift between them.

## Design

### Throttle state

Store a single timestamp in `sessionStorage`:

| Key | Value |
| --- | --- |
| `monetag:lastShownAt` | Epoch milliseconds of the last time an ad was shown |

`sessionStorage` (not `localStorage`) so the window resets on a new tab or browser
session, as specified.

Gate:

```
now - lastShownAt >= 5 * 60 * 1000   -> show ad, then write `now`
otherwise                            -> skip
```

Notes:

- Missing or unparsable value must be treated as "never shown" so the first click
  always shows an ad.
- Wrap reads/writes in `try/catch`: `sessionStorage` throws in private-mode and
  sandboxed-iframe contexts.
- Keep the gate in a shared helper, e.g. `shouldShowMonetagAd()`, so all three
  pages call the same code path.

### Trigger point

Both triggers already route through existing handlers, so no new wiring is needed
beyond the throttle check:

- `calculate-rate-card` → `handleCalculateClick` → `onSubmit`, where
  `loadMonetagScript()` is already called behind `userClickedSubmitRef`.
- `export-rate-card` → `handleDownloadPdf`, whose start is the natural place to
  call the loader.

Guard order inside each handler matters: check the throttle **before** loading,
record the timestamp **after** a successful load, and leave the existing
re-entrancy guards (`exportLockRef`, `userClickedSubmitRef`) untouched.

### Zone assignment

Three zones are now in play. Confirm which one each trigger loads before
implementing — the blueprint assumes the new tag (`11931554`) replaces, rather
than stacks on top of, the two existing loaders.

| Zone | Script | Current call site |
| --- | --- | --- |
| `11930901` | `https://n6wxm.com/vignette.min.js` | `onSubmit`, after calculate click |
| `11930912` | `https://5gvci.com/act/files/tag.min.js?z=11930912` | `useEffect` on mount |
| `11931554` | `https://nap5k.com/tag.min.js` | not wired up |

### Open questions

- `loadMonetagPushNotification()` currently runs on mount, which already violates
  requirement 1 (ads on page load). Decide whether that call moves to the same
  interaction-gated, throttled path or is removed from these pages.
- Which zone(s) fire on `calculate-rate-card` vs `export-rate-card`? Does the
  throttle apply per zone or to all Monetag loads together?
- Does the new tag need the same throttle at all, or is it a push/permission
  prompt meant to load once per session?

## Acceptance Criteria

- [ ] Loading `/calculator/tiktok`, `/calculator/youtube`, or
      `/calculator/instagram` and not clicking anything shows no Monetag ad.
- [ ] Clicking `calculate-rate-card` shows an ad; clicking it again within 5
      minutes shows nothing.
- [ ] Clicking `export-rate-card` within 5 minutes of the previous ad shows
      nothing; after 5 minutes it shows an ad.
- [ ] The 5-minute window survives a page reload but resets in a new tab.
- [ ] No duplicate `<script>` tags accumulate in the DOM across repeated clicks.
- [ ] All three pages behave identically.

## Verification

Verify with the browser devtools open. Ads are third-party and load
asynchronously, so a passing check means *the tag loaded and the network request
succeeded* — not necessarily that a creative rendered.

### 1. Tag injection (devtools Console)

Run on each calculator page. Expect `0` before any button click:

```js
document.querySelectorAll('script[data-zone]').length;
```

After clicking `calculate-rate-card`, the same expression should return `1` (or the
number of zones deliberately wired). Clicking repeatedly must **not** increase the
count — that is the dedupe guard in [src/lib/loadMonetag.js](../lib/loadMonetag.js)
working.

Inspect what actually landed:

```js
[...document.querySelectorAll('script[data-zone]')]
  .map((s) => s.dataset.zone + ' -> ' + s.src);
```

### 2. Network requests

Devtools → **Network** → filter by the vendor hosts:

| Host | Zone | Expected |
| --- | --- | --- |
| `nap5k.com` | `11931554` | 200 on `tag.min.js` |
| `n6wxm.com` | `11930901` | 200 on `vignette.min.js` |
| `5gvci.com` | `11930912` | 200 on `tag.min.js?z=11930912` |

Check all of:

- **Timing.** Requests appear only after the button click, never on page load
  (except the mount-time push loader, until it is moved).
- **Status.** 200, not `(blocked)`, `net::ERR_BLOCKED_BY_CLIENT`, or 403.
  A persistent 403 usually means the zone is inactive or the domain is not yet
  approved in the Monetag dashboard.
- **No repeats.** One request per zone per 5-minute window.

### 3. Throttle state

```js
sessionStorage.getItem('monetag:lastShownAt');   // epoch ms, or null before first ad
```

Confirm the stored value updates on a shown ad and does **not** change on a
throttled click. Then: reload the page — the value must survive and the throttle
must still hold. Open the same URL in a new tab — the value must be absent, and
the first click there should show an ad.

### 4. Creative / rendering

- Disable ad blockers and any DNS-level filter for the test, or the tag will load
  but never render — a false negative that looks like a broken integration.
- Use an incognito window with extensions off.
- Monetag formats are rate-limited on their side too: an interstitial suppressed by
  their own frequency cap can look identical to a broken tag. Cross-check the
  Network tab first — if the request succeeded, the integration is fine.
- Clear cookies and `sessionStorage` between attempts, or you may be testing
  Monetag's cap rather than this app's.

### 5. Production build

`next dev` with `reactStrictMode` double-invokes effects and re-mounts components.
Re-run the checks against the real build:

```bash
yarn build && yarn start
```

Then re-check step 1 on that server. This is the run that proves the integration,
not the dev server.

### 6. Monetag dashboard

Open the zone list in the Monetag dashboard and confirm:

- zone `11931554` exists and its status is active (not pending review);
- the domain you are testing on is the verified one for the zone;
- impressions tick up — **expect a delay** (often several minutes to hours) before
  a test impression appears. Absence of an impression immediately after a click is
  not proof of failure; prefer steps 1–2 for same-minute feedback.

### Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| No `<script data-zone>` in DOM after click | Handler not reached, or an early `return` above the loader call |
| Script in DOM, no network request | Ad blocker, or `src` set before `data-zone` in a hand-rolled injection |
| Two identical scripts in DOM | Missing dedupe check — a new node is appended per click |
| Request 200, no ad visible | Monetag-side frequency cap, unfilled zone, or a format that needs a viewport/scroll |
| Ads fire on page load | Mount-time `loadMonetagPushNotification()` — see open questions |
| Works in dev, fails in prod | Script stripped by build/CSP, or a domain not yet allowlisted |
