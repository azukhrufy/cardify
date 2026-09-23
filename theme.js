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
    bg: "#0A0A0A",
    surface: "rgba(255,255,255,0.02)",
    border: "rgba(255,255,255,0.10)",
    borderStrong: "rgba(255,255,255,0.15)",
    fg: "#FFFFFF",
    muted: "#A1A1AA",
    faint: "#71717A",
    // Namespaced on purpose: Chakra's own component styles read `blue.500` etc.,
    // so overriding `blue` / `purple` / `pink` would break default focus rings.
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
