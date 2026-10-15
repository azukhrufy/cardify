<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Structure

## One code root: `src/`

All application code lives under `src/`. There is no second copy of any code folder at the repo root, and none should be created.

```
src/
├── components/     # shared UI (incl. components/hook-form/*)
├── constants/      # niches, formulas, content types, company info
├── Layouts/        # HomePageLayout, CalculatorTabLayout
├── lib/            # ad gate, loaders, server helpers (lib/server/*)
├── pages/          # Pages Router routes, incl. _app.js, _document.js, api/
├── sections/       # page-level composition (LandingPage/*, Calc/*)
├── styles/         # globals.css
├── utils/          # framework-free helpers
└── theme.js        # Chakra design tokens — single source of truth
```

The alias is a single root: `@/*` → `./src/*` ([jsconfig.json](jsconfig.json)). An `@/foo` import either resolves inside `src/` or it does not exist. Do not widen `paths` back to a list of fallbacks.

Outside `src/`, only non-code lives here:

| Path | What | Why outside |
| --- | --- | --- |
| `public/` | Static assets | Next.js requirement — keep in root |
| `next.config.mjs`, `jsconfig.json`, `package.json`, `.env*`, `eslint.config.mjs` | Config | Next.js requirement — keep in root |
| `blueprints/` | Design + integration blueprints (Phase1, ShortBrief, integrateMonetag) | Docs. Never imported by code; referenced by path from `src/theme.js` and each other |
| `reference/` | Design reference images | Docs, not shipped |
| `WEBSITE_CONTENT.md`, `SETUP_CREDENTIALS.md`, `README.md` | Prose + secrets setup | Docs |

`src/pages` and a root `pages` cannot coexist — Next.js silently ignores `src/pages` if a root `pages/` exists. That is exactly how the duplication below got started; if routes ever "don't update", check for a root `pages/` first.

## Why root-level duplicates existed (removed 2026-10-15)

Before this restructure, application code lived at the repo root (`components/`, `constants/`, `Layouts/`, `theme.js`). When `src/` became the code root, `jsconfig.json` was left with `"@/*": ["./src/*", "./*"]` — a fallback list, not a move. Then merge commit `85475d2` ("integrate main restructure src/ into guntur-website-content") carried the old pre-restructure copies back to root.

The result was two files per module with the same path fragment, e.g. `constants/niches.js` and `src/constants/niches.js`. Because `src/` came first in the fallback list, the root copies were **silently shadowed** — imports resolved to `src/`, and edits to the root copies did nothing. They had drifted stale (root copies were the 2026-09-27 `guntur` variants; `src/` copies were newer and richer).

Deleted as dead weight:

- `components/hook-form/` — the `.jsx` variants and the older `RHFFormProvider.js`; `src/components/hook-form/` also carries `RHFSelect.js` and `RHFSingleFileUpload.js`, which the root copy never had
- `constants/` — all five files, older than their `src/constants/` counterparts
- `Layouts/HomePageLayout/index.jsx` — the `src/` version additionally has `Header.js` and `Footer.js`
- `theme.js` — moved into `src/theme.js` (`@/theme` now resolves unambiguously)

Rule for future work: if you catch yourself creating a code folder at the repo root, you are creating the second half of a duplicate pair. Put it in `src/` and import via `@/`.
