import {
  Box,
  Grid,
  Heading,
  Icon,
  Stack,
  Text,
  useTheme,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";

/**
 * The TikTok mark, composed rather than imported from a bitmap: the note glyph
 * is drawn three times and the cyan and red copies are pushed a few percent off
 * the white one. That offset is what gives the logo its edge fringing — pulling
 * it from the theme keeps the two hues named in one place.
 *
 * Decorative: the H1 beside it already names the platform, so the whole block is
 * hidden from assistive tech instead of announced twice.
 *
 * Sized against that H1 rather than off a scale of its own — in the reference the
 * wordmark's cap height matches the heading's and the glyph runs ~3.4x that,
 * which is what makes the logo read as the hero's visual and not as a caption.
 */
export function TikTokLogo() {
  return (
    <Stack spacing={{ base: 4, md: 5 }} align="center" aria-hidden="true">
      <Box position="relative" boxSize={{ base: "7rem", md: "12rem" }}>
        <Icon
          as={SiTiktok}
          boxSize="full"
          position="absolute"
          inset={0}
          color="tiktok.cyan"
          transform="translate(-6%, -6%)"
        />
        <Icon
          as={SiTiktok}
          boxSize="full"
          position="absolute"
          inset={0}
          color="tiktok.red"
          transform="translate(6%, 6%)"
        />
        <Icon
          as={SiTiktok}
          boxSize="full"
          position="absolute"
          inset={0}
          color="fg"
        />
      </Box>

      <Text
        fontSize={{ base: "4xl", md: "7xl" }}
        fontWeight="extrabold"
        letterSpacing="tight"
        color="fg"
      >
        TikTok
      </Text>
    </Stack>
  );
}

/**
 * YouTube's mark needs no composition: the glyph is the red rounded rectangle
 * with the play triangle cut out of it, and that cutout is what shows the band
 * through — the same trick the TikTok trio's offsets play on the eye, done with
 * one shape. Only the hue is a decision, and the theme already names it.
 *
 * Sized and framed exactly like the TikTok block above so the platforms read as
 * the same hero at different colours rather than as different layouts.
 */
export function YoutubeLogo() {
  return (
    <Stack spacing={{ base: 4, md: 5 }} align="center" aria-hidden="true">
      <Box boxSize={{ base: "7rem", md: "12rem" }}>
        <Icon as={SiYoutube} boxSize="full" />
      </Box>

      <Text
        fontSize={{ base: "4xl", md: "7xl" }}
        fontWeight="extrabold"
        letterSpacing="tight"
        color="fg"
      >
        YouTube
      </Text>
    </Stack>
  );
}

/**
 * Instagram is the app-icon mark, not the bare glyph: a rounded tile carrying
 * the gradient, with the white line-art camera on top. Drawing the camera in
 * `fg` inside the tile rather than knocking it out of the gradient is what lets
 * this sit on any band colour — the TikTok and YouTube marks both assume the
 * band their holes reveal, this one does not.
 *
 * The gradient runs `to-tr` because that is the direction the brand's ramp
 * moves; the stops themselves live in the theme.
 */
export function InstagramLogo() {
  return (
    <Stack spacing={{ base: 4, md: 5 }} align="center" aria-hidden="true">
      <Box
        boxSize={{ base: "7rem", md: "12rem" }}
        borderRadius="26%"
        bgGradient="linear(to-tr, instagram.yellow, instagram.orange, instagram.pink, instagram.purple, instagram.blue)"
      >
        {/* p=20% leaves the camera at ~60% of the tile, which is the ratio the
            app icon holds between glyph and tile. */}
        <Icon as={SiInstagram} boxSize="full" p="20%" color="fg" />
      </Box>

      <Text
        fontSize={{ base: "4xl", md: "7xl" }}
        fontWeight="extrabold"
        letterSpacing="tight"
        color="fg"
      >
        Instagram
      </Text>
    </Stack>
  );
}

function AdjustBackground(pathName) {
  switch (pathName) {
    case "/calculator/tiktok":
      return "tiktokBlack.500";
    case "/calculator/instagram":
      return "purpleInstagram.500";
    case "/calculator/youtube":
      return "youtubeRed.500";
    default:
      return "tiktok.black";
  }
}

function AdjustLogo(pathName) {
  switch (pathName) {
    case "/calculator/tiktok":
      return <TikTokLogo />;
    case "/calculator/instagram":
      return <InstagramLogo />;
    case "/calculator/youtube":
      return <YoutubeLogo />;
    default:
      return <TikTokLogo />;
  }
}

/**
 * Hero for the TikTok calculator route. Takes the platform's own black as its
 * band colour (`tiktok.black`, not the page's near-black `bg`) and ends in a
 * shallow arc where the white section below rises into it.
 *
 * The arc is one path painted in the hero's black over a `bgInverse` field: the
 * fill and the field are the two bands meeting, which is why this element is the
 * only place on the page where the dark and light token sets sit together. It
 * replaces the flat 1px brand hairline the landing page uses as its seam.
 */
export default function CalcHero() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Box as="section" bg={AdjustBackground(router?.pathname)}>
      <Grid
        maxW="7xl"
        mx="auto"
        px={6}
        pt={{ base: 16, md: 24 }}
        pb={{ base: 12, md: 20 }}
        templateColumns={{
          base: "1fr",
          lg: "minmax(0, 0.8fr) minmax(0, 1.2fr)",
        }}
        gap={{ base: 12, lg: 16 }}
        alignItems="center"
      >
        {AdjustLogo(router?.pathname)}

        <Stack spacing={0} textAlign="left">
          <Heading
            as="h1"
            fontSize={{ base: "xl", md: "2xl", lg: "4xl" }}
            fontWeight="extrabold"
            letterSpacing="tight"
            lineHeight="1.1"
            color="fg"
          >
            Hitung Rate Card {router?.pathname?.split("/")[2]}
          </Heading>

          {/* Description is sized off the H1, not off the type scale: the reference
              runs a 2.5:1 ratio between them (heading cap 27.5px, body cap 11px),
              so each step takes the Chakra size nearest heading / 2.5 — 60/24 and
              72/30. Base is the one deliberate break: 36/2.5 lands on 14px, under
              the 16px floor for phone body copy, so it holds at 16 (2.25:1).
              Change the heading and these need re-picking.
              Justified at the reference's column widths; at mobile width it only
              buys rivers of whitespace, so the narrow breakpoints stay left. */}
          <Text
            fontSize={{ base: "sm", md: "md", lg: "xl" }}
            lineHeight="tall"
            textAlign={{ base: "left", md: "justify" }}
            maxW="xl"
            mt={6}
          >
            Ubah data analitik dan statistik performa akun{" "}
            {router?.pathname?.split("/")[2]} kamu menjadi sebuah rate card
            profesional secara otomatis. Unggah tangkapan layar dasbor Anda dan
            dapatkan rekomendasi harga endorsement yang akurat tanpa perlu
            perhitungan manual yang rumit.
          </Text>
        </Stack>
      </Grid>

      {/* Stretch-to-fit: `preserveAspectRatio="none"` lets the arc keep its
          shallow profile at any width, so one path covers every breakpoint. */}
      {/* <Box bg="bgInverse" h={{ base: 10, md: 20 }}>
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          style={{ display: "block" }}
          role="presentation"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M0 0 H1440 C1440 66 1140 120 720 120 C300 120 0 66 0 0 Z"
            fill={colors}
          />
        </svg>
      </Box> */}
    </Box>
  );
}
