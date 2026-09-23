# Phase 1 — Design Blueprint

## Brand Identity

- **Name:** `Cardify`
- **Domain:** `cardify.my.id` — the canonical origin for every URL, canonical tag, and social card.
- **Tagline:** `Know what your influence is worth.` The tagline and the Hero H1 are the same asset; do not write a second one.
- **One-liner:** `Cardify turns your social media dashboard into a rate card brands take seriously.`
- **Wordmark:** `Cardify` in the heading font, `fontWeight="bold" letterSpacing="tight"`, paired with a small gradient glyph (rounded square or dot) to its left. Header form is a pill: `borderRadius="full" borderWidth="1px" borderColor="border" px={4} py={2}`. No separate logo mark exists in Phase 1.
- **Voice:** Direct, confident, creator-first. Short declarative sentences. Numbers over adjectives. No agency jargon — no "leverage", "synergy", "empower", "unlock".
- **Naming rules:** Always `Cardify` — never "Cardify App", "the Cardify tool", or "Rate Card Generator". Features are lowercase common nouns: "the calculator", "the rate card". Domain always lowercase `cardify.my.id`.

## Tech Stack

Locked. Everything below is decided in Phase 1 and inherited by Phase 2.

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js `16.3.5`, **Pages Router** | `pages/` already in place. Do not migrate to App Router mid-project. |
| React | `19.2.8` | Pinned in `package.json`. |
| Components / styling | **Chakra UI v2** (`@chakra-ui/react` `^2.10.10`) + Emotion | No Tailwind. Every value in this document is a Chakra prop or theme token. |
| Animation | `framer-motion` `^13.4.0` | Already installed. Phase 1 uses it only for the mobile nav panel, if at all. |
| Icons | `react-icons` `^5.7.0` | Already installed. Hero preview and step strip icons. |
| Fonts | `next/font/google` in `pages/_app.js` | Self-hosted, no external request at runtime. |
| Aliases | `@/*` → repo root | Declared in `jsconfig.json`. Import theme as `@/theme`. |

**No Tailwind, no CSS modules, no styled-components.** `styles/globals.css` keeps only the reset it already holds (box-sizing, overflow guard, font smoothing, anchor reset) plus `html { scroll-behavior: smooth }` for the hero CTAs. No colors, fonts, or spacing in CSS — those are theme tokens.

### Shipped state

- [`theme.js`](../theme.js) — dark color mode, all tokens, and the `primary` / `secondary` Button variants.
- [`pages/_app.js`](../pages/_app.js) — `ChakraProvider` plus the `next/font` variables on a full-height `Box`.
- [`pages/_document.js`](../pages/_document.js) — unchanged; renders `ColorModeScript` from `theme.config.initialColorMode` and sets `<Html lang="en">`.
- [`pages/index.js`](../pages/index.js) — Seo, Header, Hero, WhoWeAre, Footer.
- `public/` — `favicon.ico`, `icon.png`, `apple-icon.png`, `og-image.png` generated from the brand gradient; the Next.js starter SVGs are deleted.
- `pages/api/hello.js` — leftover starter API route, unused. Delete when convenient.

## Design Reference

Visual example: [`../reference/design-reference.png`](../reference/design-reference.png) — a creative agency portfolio landing page (mobile-width capture).

**Reference only. This website is NOT built with the same section structure as the image.** Borrow visual language; take page composition from this document.

### What the image shows

- **Hero:** pill logo top-left, small uppercase overline (`NEED BRAND DESIGN WORK?`), then a heavy uppercase display headline (`BROWSE OUR SERVICES`) in white, left-aligned, tight tracking. Rounded-full outline button (`READ MORE`) below.
- **Hero right column:** a grid of saturated gradient panels — purple → pink → blue fields carrying geometric petal/flower motifs, with play-button overlays marking the video blocks.
- **Light band (`OUR WORK`):** large black heading, a video preview block with play overlay on the left, two short gray body paragraphs on the right.
- **Dark band:** small body text on the left paired with a large heading (`WHAT WE OFFER`) on the right.
- **Solutions row:** small uppercase label (`EXPLORE OUR SOLUTIONS`), then six gradient tiles, each with an abstract icon and a caption beneath (`Brand strategy`, `Digital marketing`, `Content development`, `Graphic design`, `Motion design`, `Video production`).

### What to borrow

- **Type treatment:** heavy uppercase display headings with tight tracking, preceded by a small uppercase overline. The Hero spec below adopts the weight, tracking, and overline; it keeps sentence case for the H1 — move to uppercase only if the brand wants the harder, more editorial voice.
- **Button shape:** rounded-pill outline button with a thin border and uppercase label — an option for the secondary CTA.
- **Logo mark:** pill-shaped wordmark with a rounded-full border, top-left of the header — carries the `Cardify` wordmark per the Brand Identity block.
- **Motif:** geometric petal/flower shapes over gradient fields — reuse for the hero preview panel and decorative accents.
- **Media blocks:** play-button overlay on preview surfaces.
- **Caption-under-tile** pattern for the solutions row.

### What NOT to borrow

- **Section structure.** The image alternates black and white bands and stacks five distinct sections. This site is pure black throughout — separation comes from spacing and surface value, not light bands.
- **Gradient area.** The image fills whole panels with saturated gradient. This site holds a 10% accent budget — gradient tiles become small accent elements, never full-width fields.
- **Density.** The image is a mobile-width capture; this site is desktop-first at `maxW="7xl"`.

**Precedence:** where the image and this document disagree, this document wins.

## Design Philosophy and Aesthetic

- **Core Style:** Modern Dark Studio / Creative Agency Portfolio.
- **Vibe:** High-end, exclusive, bold, clean, and professional — like a contemporary creative agency.
- **Layout Structure:** Grid-based, modular layout. Asymmetric but balanced. Cards with minimal rounding — nothing above `borderRadius="card"` (12px).

## Theme Tokens

`theme.js` is the single source of truth. Section specs below reference these names; never hardcode a hex value in a component.

```js
import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  colors: {
    bg: "#0A0A0A",          // page background
    surface: "rgba(255,255,255,0.02)", // card fill
    border: "rgba(255,255,255,0.10)",  // default hairline
    borderStrong: "rgba(255,255,255,0.15)", // CTA / hover hairline
    fg: "#FFFFFF",          // headings, primary text
    muted: "#A1A1AA",       // secondary text, labels
    faint: "#71717A",       // footer / micro-copy
    accent: {
      purple: "#8B5CF6",
      pink: "#EC4899",
      blue: "#3B82F6",
    },
  },
  fonts: {
    heading: "var(--font-heading), system-ui, sans-serif",
    body: "var(--font-body), system-ui, sans-serif",
  },
  gradients: {
    brand: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #3B82F6 100%)",
  },
  radii: {
    card: "0.75rem", // 12px — the maximum rounding for surfaces
  },
  styles: {
    global: {
      "html, body": { bg: "bg", color: "fg" },
    },
  },
});

export default theme;
```

### Gradient tokens

| Token | Value | Used by |
|---|---|---|
| `bgGradient="brand"` | `linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #3B82F6 100%)` | Hero preview panel border accents, wordmark glyph |
| `bgGradient="linear(to-r, accent.purple, accent.pink)"` | text-clip gradient | Step numbers `01`–`03` |
| Ambient glow | `bgGradient="brand"`, `filter="blur(96px)"`, `opacity={0.28}` | Hero top-right glow, the only large soft gradient |

`bgGradient` resolves against `theme.gradients` ([styled-system/background](../node_modules/@chakra-ui/styled-system/dist/cjs/config/background.cjs)), while `bg` / `bgColor` resolve against `theme.colors`. `bg="brand"` is therefore invalid — always `bgGradient="brand"` for the gradient. Gradient stops may name theme colors (`accent.purple`); Chakra flattens nested tokens to dotted `colors.*` keys before resolving them ([flatten-tokens](../node_modules/@chakra-ui/styled-system/dist/cjs/create-theme-vars/flatten-tokens.cjs)).

**Why `accent.purple` and not `violet` / `purple` / `blue`:** Chakra's default theme ships `purple`, `pink`, `blue`, and `violet` as *palette objects* (`blue.500`, `pink.200`, …), and its own component styles read them — `Input` uses `blue.500` for focus and invalid states. Redefining `colors.blue` as a flat hex string removes `blue.500`, so the first Phase 2 input form renders with a broken focus ring. Namespacing the accents under `accent.*` leaves every default palette intact.

### Tailwind → Chakra translation table

Earlier drafts of this document used Tailwind class names. Map them as follows; do not introduce Tailwind.

| Tailwind | Chakra |
|---|---|
| `max-w-7xl mx-auto px-6` | `maxW="7xl" mx="auto" px={6}` |
| `py-24 md:py-32` | `py={{ base: 24, md: 32 }}` |
| `text-xs uppercase tracking-[0.2em] text-zinc-400` | `fontSize="xs" textTransform="uppercase" letterSpacing="0.2em" color="muted"` |
| `text-5xl md:text-7xl font-extrabold tracking-tight` | `fontSize={{ base: "5xl", md: "7xl" }} fontWeight="extrabold" letterSpacing="tight"` |
| `leading-[1.05]` | `lineHeight="1.05"` |
| `text-lg md:text-xl leading-relaxed` | `fontSize={{ base: "lg", md: "xl" }} lineHeight="tall"` |
| `text-zinc-500` | `color="faint"` |
| `rounded-xl` | `borderRadius="card"` |
| `border border-white/10` | `borderWidth="1px" borderColor="border"` |
| `border-white/15` | `borderColor="borderStrong"` |
| `bg-white/[0.02]` | `bg="surface"` |
| `hover:bg-white/5` | `_hover={{ bg: "whiteAlpha.100" }}` |
| `blur-3xl` | `filter="blur(96px)"` |
| `sticky top-0 backdrop-blur-md` | `position="sticky" top={0} backdropFilter="blur(12px)"` |

### Chakra gotchas

- **Grid props need `Grid`, not `Box`.** `templateColumns` (and `templateRows`, `templateAreas`, `autoFlow`, …) is only mapped by Chakra's `Grid` component. `Box display="grid" templateColumns={...}` leaks `templateColumns` to the DOM as an unknown attribute, logs a React warning, and renders no columns. Use `<Grid templateColumns={...} gap={...}>`.
- **Gradient stops resolve through `colors.*`.** `bgGradient="linear(to-r, accent.purple, accent.pink)"` works because nested tokens flatten to `colors.accent.purple` in `theme.__cssMap`.
- **Scroll offset.** Anchored sections carry `scrollMarginTop="4rem"` so the sticky header does not cover the heading after a jump.

## Typography

**Families** — self-hosted through `next/font/google`, wired in `pages/_app.js`:

```js
import { Plus_Jakarta_Sans, Inter } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-heading" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
```

Apply both `jakarta.variable` and `inter.variable` to a wrapper element inside `<ChakraProvider>`. `theme.fonts.heading` / `theme.fonts.body` reference the CSS variables.

**Hierarchy:**

- **Headings (H1–H3):** `Plus Jakarta Sans`, weight `extrabold` (H1) / `bold` (H2–H3), tight letter-spacing, `lineHeight` between `1.05` (H1) and `1.2` (H3).
- **Body:** `Inter`, weight `normal`, `lineHeight="tall"` — dark backgrounds need the extra leading.
- **Overlines / labels:** `Inter`, `fontSize="xs"`, `textTransform="uppercase"`, `letterSpacing="0.2em"`, `color="muted"`.
- **Step numbers:** `Inter` or a monospace fallback, `fontSize="sm"`, gradient text-clip.

Chakra `Heading` defaults to `fonts.heading` and `Text` to `fonts.body` once the theme is set — no per-component font props needed.

## UI Components & Elements

### Hero Section

- Large left-aligned title, bold white on deep black.
- Accompanied by an abstract visual element or preview box with a subtle gradient touch on the right side.

### Buttons (CTA)

Two Chakra component variants, defined once in `theme.components.Button.variants` rather than repeated per call site:

- **`primary`:** `bg="fg" color="bg"` — solid white on black, maximum contrast. `_hover={{ transform: "translateY(-2px)" }}` with a 150ms transition. No gradient fill by default.
- **`secondary`:** `borderWidth="1px" borderColor="borderStrong" color="fg"` — outline, `_hover={{ bg: "whiteAlpha.100" }}`.

Both use `borderRadius="card" px={6} py={3}` and `fontWeight="semibold"` / `"medium"`.

## Gradient Element Specification

### Characteristics & Focus Points

- **Gradient Nature:** A smooth radial or linear gradient blending bright colors with a digital-creative feel over a deep black background.

- **Strategic Placement (where should gradients go?):**
  - **Hero / Header Area:** As a soft ambient glow in the top-right corner of the screen to draw the eye toward the preview area or the primary button.
  - **Visual / Decorative Elements:** On abstract icons, the creator's profile photo frame, or the background of featured cards.
  - **Special CTA Button (Optional):** Can be used on the "Generate Rate Card" button to give a vivid color-transition effect when the cursor moves over it (hover effect).

### Chakra Implementation

```jsx
<Box position="relative" bg="bg" overflow="hidden">
  <Box
    position="absolute"
    top={-160}
    right={-160}
    boxSize="24rem"
    bgGradient="brand"
    opacity={0.28}
    filter="blur(96px)"
    borderRadius="full"
    pointerEvents="none"
  />
</Box>
```

For a hard-edged gradient surface (hero preview panel accent), use `bgGradient="brand"` with no blur and keep the element small — see the 10% rule below.

**Gradient Component Color Stops:**

- **Start Point:** Electric Purple (`#8B5CF6` / `accent.purple`) at low to medium opacity.
- **Middle Point (Via):** Pink Magenta (`#EC4899` / `accent.pink`).
- **End Point:** Ocean Blue (`#3B82F6` / `accent.blue`).

### Usage Rules (Best Practices)

- **Do Not Overdo It:** Keep a 90% ratio of clean, sharp black-and-white, and use gradient elements only as a sweetening accent (10% max) so the high-end, professional aesthetic holds up without looking tacky.
- **Use Blur Effects:** Always apply a high blur (`filter="blur(64px)"` or `blur(96px)`) to background gradients so they blend smoothly into the deep black base (`#0A0A0A`).

## Routes & File Structure

Phase 1 ships one route. Phase 2 adds the calculator routes — reserve the names now so Phase 1 links and metadata do not need rewriting.

| Path | Phase | Contents |
|---|---|---|
| `pages/index.js` | 1 | Landing page — assembles Header, Hero, Who We Are, Footer. |
| `pages/_app.js` | 1 | `ChakraProvider` + `next/font` variables. |
| `pages/_document.js` | 1 | `lang="en"`, `ColorModeScript`. |
| `pages/tiktok.js` | 2 | TikTok calculator tab. |
| `pages/youtube.js` | 2 | YouTube calculator tab. |
| `pages/instagram.js` | 2 | Instagram calculator tab. |

Component layout for Phase 1:

```
components/
  Header.js        # sticky nav
  Footer.js        # brand column + link column + bottom bar
  Hero.js          # hero copy + preview panel
  WhoWeAre.js      # heading, lead, 3 value cards, 3-step strip
  Seo.js           # <Head> block — title/description/OG/JSON-LD, props-driven
  Wordmark.js      # gradient glyph + "Cardify", pill variant for the header
sections/          # only if components/ grows past ~8 files
```

`components/Seo.js` takes `title`, `description`, and `path` props and renders one `<Head>` block. Pass `title` on any route other than the landing page and it renders as `<title> | Cardify` (Pages Router has no metadata title template — the suffix is applied in the component).

### Anchor plan

| Anchor | Owner | Phase 1 behaviour |
|---|---|---|
| `#how-it-works` | Who We Are section | Live. Target of the hero secondary CTA. |
| `#how-it-works-steps` | 3-step strip inside Who We Are | Live. |
| `#calculator` | Calculator section | **Reserved.** Does not exist until Phase 2. |

**Phase 1 must not ship a dead link.** The hero primary CTA (`Calculate My Rate`) and the nav both point at `#how-it-works` in Phase 1 — the calculator does not exist yet, and a CTA that scrolls nowhere reads as broken. Phase 1 nav carries a single `How It Works` link for the same reason. Phase 2 rewires the hero primary CTA and restores the nav `Calculator` link to `#calculator`.

## Landing Page Content Specification

Phase 1 ships the Header Menu, Footer, Hero Section, and the "Who We Are" section. Copy below is final English content; layout notes reference the tokens defined above.

### Hero Section

#### Content

- **Overline:** `Free Rate Card Calculator`
- **Headline (H1):** `Know what your influence is worth.`
- **Subheadline:** `Upload your social media dashboard and get a data-backed rate card for TikTok, YouTube, and Instagram — in minutes, not weeks.`
- **Primary CTA:** `Calculate My Rate` → scrolls to `#how-it-works` (Phase 1; rewired to `#calculator` in Phase 2).
- **Secondary CTA:** `See How It Works` → scrolls to `#how-it-works`.
- **Micro-copy (below CTA pair):** `Free to use. No signup. No credit card.`
- **Visual (right column):** Placeholder preview panel — a mock rate card showing `TikTok · YouTube · Instagram` tabs above a sample rate block. This panel carries the section's only gradient.

#### Layout & Styling

- Two-column grid at `lg` and up (`display="grid" templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={16}`). Single stacked column on mobile, visual below text.
- Text column is left-aligned at every breakpoint.
- Overline: `fontSize="xs" textTransform="uppercase" letterSpacing="0.2em" color="muted" mb={4}`.
- H1: `as="h1" fontSize={{ base: "5xl", md: "7xl" }} fontWeight="extrabold" letterSpacing="tight" lineHeight="1.05" color="fg"`.
- Subheadline: `fontSize={{ base: "lg", md: "xl" }} lineHeight="tall" color="muted" maxW="xl"`.
- Micro-copy: `fontSize="sm" color="faint" mt={4}`.
- Ambient gradient glow: top-right of section (`top={-160} right={-160}`, `filter="blur(96px)"`), per the gradient spec above. No other gradient in the hero.
- Section padding: `py={{ base: 24, md: 32 }}`. Container: `maxW="7xl" mx="auto" px={6}`.

#### Buttons

- **Primary (`variant="primary"`):** `bg="fg" color="bg" borderRadius="card" px={6} py={3} fontWeight="semibold"`, `_hover={{ transform: "translateY(-2px)" }}`.
- **Secondary (`variant="secondary"`):** `borderWidth="1px" borderColor="borderStrong" color="fg" borderRadius="card" px={6} py={3} fontWeight="medium"`, `_hover={{ bg: "whiteAlpha.100" }}`.

### Header (Site Nav)

#### Content

- **Wordmark (left):** `Cardify` — links to `/`.
- **Nav link:** `How It Works` → `#how-it-works`. (Phase 2 adds `Calculator` → `#calculator`.)
- **CTA (right):** `Calculate My Rate` → `#how-it-works` in Phase 1, `#calculator` in Phase 2.
- **Mobile:** wordmark plus a hamburger toggle; expanded panel stacks the nav link and CTA full-width.

#### Layout & Styling

- Sticky: `position="sticky" top={0} zIndex={50} borderBottomWidth="1px" borderColor="border" bg="rgba(10,10,10,0.8)" backdropFilter="blur(12px)"`.
- Inner container: `maxW="7xl" mx="auto" px={6} h={16} display="flex" alignItems="center" justifyContent="space-between"`.
- Nav links: `fontSize="sm" color="muted" _hover={{ color: "fg" }} transition="color 150ms"`, spacing `gap={8}`.
- Header CTA is smaller than the hero primary: `size="sm"`.
- Use Chakra's `useDisclosure` for the mobile panel — do not hand-roll state.

### Footer

#### Content

- **Brand column:** wordmark, tagline `Know what your influence is worth.`, one-liner `Cardify turns your social media dashboard into a rate card brands take seriously.`
- **Nav column:** `How It Works` (Phase 2 adds `Calculator`).
- **Bottom bar:** `© 2026 Cardify · cardify.my.id` — the domain is rendered as a real link to `https://cardify.my.id`, not plain text.

#### Layout & Styling

- `as="footer" borderTopWidth="1px" borderColor="border" mt={32} py={16}`. Container `maxW="7xl" mx="auto" px={6}`.
- Grid: `templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={12}`, brand column `maxW="sm"`.
- Wordmark in footer: `fontSize="lg" fontWeight="bold" letterSpacing="tight"`, no pill border.
- Tagline `fontSize="sm" color="muted" mt={3}`, one-liner `fontSize="sm" color="faint" mt={2} lineHeight="tall"`.
- Bottom bar: `mt={12} borderTopWidth="1px" borderColor="border" pt={6} fontSize="xs" color="faint" display="flex" direction={{ base: "column", sm: "row" }} justifyContent="space-between" gap={2}`.
- Footer carries no gradient — the accent budget is spent in the sections above.

### Who We Are Section

#### Content

- **Overline:** `Who We Are`
- **Heading (H2):** `Built for creators who are done guessing.`
- **Lead paragraph:** `Cardify is a free tool for influencers who want a number they can defend. Upload your performance data, and we turn it into a rate card you can send to brands — no agency markup, no benchmark guesswork.`

**Value cards (3-up grid):**

1. **Your numbers, not someone else's** — `Every rate is calculated from the dashboard you upload: views, engagement, reach, and the metrics brands actually pay attention to.`
2. **Three platforms, priced differently** — `TikTok, YouTube, and Instagram behave differently. Each one gets its own calculation, so you quote the right number for the right platform.`
3. **Free, instant, no account** — `Upload, calculate, download. No signup, no paywall, no waiting on approval. Your rate card is yours.`

**How It Works (short tutorial — 3-step strip):**

1. **Upload your dashboard** — `Drop in a screenshot or export of your social media dashboard.`
2. **Pick your platform** — `Choose TikTok, YouTube, or Instagram.`
3. **Get your rate card** — `Review your calculated rate and download it as a PDF.`

#### Layout & Styling

- Section anchored `id="how-it-works"`. The 3-step strip is a sub-block of this section, anchored `id="how-it-works-steps"`.
- Heading block: left-aligned, `maxW="2xl"`. Lead paragraph sits under the heading with `mt={4}`.
- Value cards: `display="grid" templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6} mt={16}`. Each card `borderRadius="card" borderWidth="1px" borderColor="border" bg="surface" p={6}`, `_hover={{ borderColor: "borderStrong" }}`. Card title `as="h3" fontSize="lg" fontWeight="semibold" letterSpacing="tight"`, body `color="muted" lineHeight="tall" mt={2}`.
- Step strip: `display="grid" templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6} mt={20} borderTopWidth="1px" borderColor="border" pt={12}`. Step number `fontSize="sm" fontFamily="body" bgGradient="linear(to-r, accent.purple, accent.pink)" bgClip="text" color="transparent"` (`01` / `02` / `03`) — this is the section's only gradient, keeping the 10% accent budget. Step title `fontSize="base" fontWeight="semibold" mt={3}`, step body `color="muted" mt={1}`.
- Section padding: `py={{ base: 24, md: 32 }}`. Container: `maxW="7xl" mx="auto" px={6}`.

## SEO & Metadata Specification

Every value below is locked to `Cardify` and `cardify.my.id` — Phase 1 ships the full set so the brand is indexed under one identity from first crawl.

Pages Router renders metadata through `next/head` (see `node_modules/next/dist/docs/02-pages/04-api-reference/01-components/head.md`). Rules that bite:

- `title` and `meta` must be **direct** children of `<Head>`, or wrapped in at most one fragment — deeper nesting is dropped on client-side navigation.
- `<Head>` cannot set attributes on `<html>` or `<body>`; `lang="en"` already lives on `<Html>` in `pages/_document.js`.
- The JSON-LD block is inlined in `<Head>` as `<script type="application/ld+json" dangerouslySetInnerHTML={...} />`. It is **not** rendered through `next/script`: `strategy="afterInteractive"` (the default) injects it client-side, so it would be missing from the server-rendered HTML that crawlers read, and `beforeInteractive` is only permitted inside `pages/_document.js` ([script.md](../node_modules/next/dist/docs/01-app/03-api-reference/02-components/script.md)).

### Page Title & Description

- **Title:** `Cardify — Free Influencer Rate Card Calculator for TikTok, YouTube & Instagram`
  - Title template for later routes: `%s | Cardify`.
- **Meta description:** `Cardify turns your social media dashboard into a rate card brands take seriously. Free, no signup. Calculate your TikTok, YouTube, and Instagram rates in minutes.`
- **Canonical:** `https://cardify.my.id`
- **Robots:** `index, follow`.

### Open Graph / Twitter

- `og:type` = `website`, `og:site_name` = `Cardify`, `og:url` = `https://cardify.my.id`, `og:title` / `og:description` mirror the title and description above.
- `og:image` = `/og-image.png` (1200×630): black field, Cardify wordmark, tagline, gradient glow in one corner.
- `twitter:card` = `summary_large_image`, `twitter:title` / `twitter:description` mirror OG.

### Structured Data

One JSON-LD block on the landing page, inlined into the page `<Head>` so it is present in the server-rendered HTML:

```jsx
<Head>
  {/* ...title, meta... */}
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
  />
</Head>
```

with

```js
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Cardify",
  url: "https://cardify.my.id",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Free rate card calculator for influencers. Upload your social media dashboard and get a data-backed rate for TikTok, YouTube, and Instagram.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};
```

### Assets

- `/favicon.ico` plus `/icon.png` (512×512) — gradient glyph on black, replacing the Next.js default favicon in `public/`.
- `/apple-icon.png` (180×180).
- `/og-image.png` (1200×630) per the OG spec.
- Delete the starter SVGs (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`) — they are scaffolding, not assets.

### Brand Awareness Surfaces (Phase 1 scope)

Each surface carries the name and the domain — no surface ships unbranded:

1. **Wordmark** in header and footer (above).
2. **Footer bottom bar** — `cardify.my.id` as a live link, crawlable.
3. **Browser tab** — `Cardify` favicon and title template.
4. **Shared links** — OG image and `og:site_name` so every pasted URL previews as Cardify.
5. **JSON-LD** — ties the name, domain, and free-tier offer into one entity for search.
6. **PDF watermark** (Phase 3, specced here for continuity) — `Created with Cardify — cardify.my.id` bottom-center of every downloaded rate card, so the brand travels into the brand manager's inbox.
