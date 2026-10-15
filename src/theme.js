import { extendTheme } from "@chakra-ui/react";

/**
 * Cardify design tokens — single source of truth.
 * Any color, radius, font, or gradient a component needs must be named here.
 * See blueprints/Phase1.md → "Theme Tokens".
 */
const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  colors: {
    // Dark bands (default)
    bg: "#0A0A0A",
    surface: "rgba(255,255,255,0.02)",
    border: "rgba(255,255,255,0.10)",
    borderStrong: "rgba(255,255,255,0.15)",
    fg: "#FFFFFF",
    muted: "#A1A1AA",
    faint: "#71717A",
    // Light band ("inverse" of the tokens above) — used by inverted sections
    bgInverse: "#FFFFFF",
    surfaceInverse: "rgba(10,10,10,0.02)",
    borderInverse: "rgba(10,10,10,0.10)",
    borderInverseStrong: "rgba(10,10,10,0.16)",
    fgInverse: "#0A0A0A",
    mutedInverse: "#52525B",
    faintInverse: "#71717A",
    // Namespaced on purpose: Chakra's own component styles read `blue.500` etc.,
    // so overriding `blue` / `purple` / `pink` would break default focus rings.
    accent: {
      purple: "#8B5CF6",
      pink: "#EC4899",
      blue: "#3B82F6",
    },
    // Per-platform band colours (Phase 2). Each calculator route takes its
    // platform's own background; `cyan` / `red` are the two hues that make the
    // TikTok mark's chromatic-offset edges.
    tiktok: {
      black: "#000000",
      cyan: "#25F4EE",
      red: "#FE2C55",
    },
    // Instagram is the one mark here that is a gradient rather than a flat
    // colour, so it gets stops instead of a single value. They are the tile's
    // ramp read bottom-left to top-right, which is the direction the mark runs.
    instagram: {
      yellow: "#FEDA75",
      orange: "#FA7E1E",
      pink: "#D62976",
      purple: "#962FBF",
      blue: "#4F5BD5",
    },
    // Chakra colorScheme scales (50-900) for per-platform CTAs, anchored on
    // each brand's signature colour so `colorScheme="tiktokBlack"` etc. work
    // on Button/Badge/etc. out of the box.
    tiktokBlack: {
      // 50-400 are white-tinted mixes of the 500 base, so the whole scale
      // derives from the single brand value instead of a generic gray ramp.
      50: "#E8E8E8",
      100: "#D1D1D1",
      200: "#AFAFAF",
      300: "#8D8D8D",
      400: "#636363",
      500: "#1A1A1A",
      600: "#141414",
      700: "#0F0F0F",
      800: "#080808",
      900: "#000000",
    },
    youtubeRed: {
      50: "#FFE5E5",
      100: "#FFB8B8",
      200: "#FF8A8A",
      300: "#FF5C5C",
      400: "#FF2E2E",
      500: "#FF0000",
      600: "#CC0000",
      700: "#990000",
      800: "#660000",
      900: "#330000",
    },
    purpleInstagram: {
      50: "#F3E8FA",
      100: "#E1C2F0",
      200: "#CE9BE6",
      300: "#BB75DC",
      400: "#A94ED1",
      500: "#833AB4",
      600: "#6A2E90",
      700: "#50236C",
      800: "#371748",
      900: "#1D0C24",
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
    card: "0.75rem",
  },
  styles: {
    global: {
      "html, body": {
        bg: "bg",
        color: "fg",
      },
    },
  },
  components: {
    Button: {
      variants: {
        primary: {
          bg: "fg",
          color: "bg",
          borderRadius: "card",
          px: 6,
          py: 3,
          fontWeight: "semibold",
          transition: "transform 150ms ease",
          _hover: { bg: "fg", transform: "translateY(-2px)" },
          _active: { transform: "translateY(0)" },
          _focusVisible: {
            outline: "2px solid",
            outlineColor: "accent.purple",
            outlineOffset: "2px",
          },
        },
        secondary: {
          bg: "transparent",
          color: "fg",
          borderWidth: "1px",
          borderColor: "borderStrong",
          borderRadius: "card",
          px: 6,
          py: 3,
          fontWeight: "medium",
          transition: "background-color 150ms ease",
          _hover: { bg: "whiteAlpha.100" },
          _focusVisible: {
            outline: "2px solid",
            outlineColor: "accent.purple",
            outlineOffset: "2px",
          },
        },
      },
    },
  },
});

export default theme;
