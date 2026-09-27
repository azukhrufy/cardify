import { Box, Flex, Grid, Heading, Stack, Text, useTheme } from "@chakra-ui/react";

const VALUE_CARDS = [
  {
    title: "Angkamu sendiri, bukan milik orang lain",
    body: "Setiap tarif dihitung dari dasbor yang kamu unggah: tayangan, engagement, jangkauan, dan metrik yang benar-benar diperhatikan brand.",
  },
  {
    title: "Tiga platform, tarif berbeda",
    body: "TikTok, YouTube, dan Instagram punya karakter berbeda. Masing-masing dihitung sendiri, jadi kamu memberi angka yang tepat untuk platform yang tepat.",
  },
  {
    title: "Gratis, instan, tanpa akun",
    body: "Unggah, hitung, unduh. Tanpa daftar, tanpa paywall, tanpa menunggu persetujuan. Rate card-mu milikmu.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Unggah dasbormu",
    body: "Masukkan tangkapan layar atau ekspor dasbor media sosialmu.",
  },
  {
    number: "02",
    title: "Pilih platformmu",
    body: "Pilih TikTok, YouTube, atau Instagram.",
  },
  {
    number: "03",
    title: "Dapatkan rate card-mu",
    body: "Tinjau tarif hasil perhitungan dan unduh sebagai PDF.",
  },
];

/**
 * Geometric six-petal flower filled with the brand gradient, over a soft radial
 * halo of the same colours. Phase 1 calls for "geometric petal/flower shapes over
 * gradient fields" but caps gradient use at a 10% accent budget, so the motif is
 * drawn as a small accent on the light band rather than a gradient field behind it.
 *
 * Stops are read from the theme rather than hardcoded, so `theme.js` stays the one
 * place a brand colour is named.
 */
function PetalMotif({ size = 176 }) {
  const { colors } = useTheme();
  const { purple, pink, blue } = colors.accent;
  const petal = "M50 50 C34 36 34 12 50 8 C66 12 66 36 50 50 Z";

  return (
    <svg width={size} height={size} viewBox="0 0 176 176" role="presentation" aria-hidden="true">
      <defs>
        <linearGradient
          id="petalGradient"
          gradientUnits="userSpaceOnUse"
          x1="8"
          y1="8"
          x2="92"
          y2="92"
        >
          <stop offset="0%" stopColor={purple} />
          <stop offset="50%" stopColor={pink} />
          <stop offset="100%" stopColor={blue} />
        </linearGradient>
        <radialGradient id="petalHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={purple} stopOpacity="0.5" />
          <stop offset="55%" stopColor={pink} stopOpacity="0.34" />
          <stop offset="100%" stopColor={pink} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="176" height="176" fill="url(#petalHalo)" />
      <g fill="url(#petalGradient)" transform="translate(22,22) scale(1.32)">
        {[0, 60, 120, 180, 240, 300].map((degrees) => (
          <path key={degrees} d={petal} transform={`rotate(${degrees} 50 50)`} />
        ))}
      </g>
    </svg>
  );
}

/**
 * The page's light band: black type on white, sandwiched between the dark hero
 * and the dark footer. Uses the `*Inverse` tokens so contrast is deliberate, and
 * carries the section's gradient as three small accents — the petal motif, the
 * seam hairline above, and the hairline before the step strip.
 */
export default function WhoWeAre() {
  return (
    <Box as="section" id="how-it-works" scrollMarginTop="4rem" bg="bgInverse">
      {/* 1px gradient hairline stitches the dark hero into the light band. */}
      <Box h="1px" bgGradient="brand" />

      <Box maxW="7xl" mx="auto" px={6} py={{ base: 24, md: 32 }}>
        <Flex justify="space-between" align="flex-start" gap={12}>
          <Box maxW="2xl">
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="0.2em"
              color="mutedInverse"
              mb={4}
            >
              Tentang Kami
            </Text>
            <Heading
              as="h2"
              fontSize={{ base: "3xl", md: "5xl" }}
              fontWeight="bold"
              letterSpacing="tight"
              color="fgInverse"
            >
              Dibuat untuk kreator yang tak mau lagi menebak.
            </Heading>
            <Text fontSize="lg" lineHeight="tall" color="mutedInverse" mt={4}>
              Cardify adalah alat gratis untuk influencer yang ingin angka yang bisa
              dipertanggungjawabkan. Unggah data performamu, dan kami ubah menjadi
              rate card yang bisa kamu kirim ke brand — tanpa markup agensi, tanpa
              tebak-tebakan benchmark.
            </Text>
          </Box>

          {/* Hidden on narrow viewports, where it would crowd the copy. */}
          <Box display={{ base: "none", md: "block" }} flexShrink={0} mt={1}>
            <PetalMotif />
          </Box>
        </Flex>

        <Grid
          templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
          gap={6}
          mt={16}
        >
          {VALUE_CARDS.map((card) => (
            <Box
              key={card.title}
              borderRadius="card"
              borderWidth="1px"
              borderColor="borderInverse"
              bg="surfaceInverse"
              p={6}
              transition="border-color 150ms ease"
              _hover={{ borderColor: "borderInverseStrong" }}
            >
              <Heading
                as="h3"
                fontSize="lg"
                fontWeight="semibold"
                letterSpacing="tight"
                color="fgInverse"
              >
                {card.title}
              </Heading>
              <Text color="mutedInverse" lineHeight="tall" mt={2}>
                {card.body}
              </Text>
            </Box>
          ))}
        </Grid>

        {/* Trades the neutral top border for the same 1px brand hairline the band
            seam uses, so the step strip is bracketed by the section's one gradient. */}
        <Box h="1px" bgGradient="brand" mt={20} />

        <Grid
          id="how-it-works-steps"
          scrollMarginTop="4rem"
          templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
          gap={6}
          mt={12}
        >
          {STEPS.map((step) => (
            <Stack key={step.number} spacing={0}>
              <Text
                fontSize="sm"
                fontFamily="body"
                bgGradient="linear(to-r, accent.purple, accent.pink)"
                bgClip="text"
                color="transparent"
              >
                {step.number}
              </Text>
              <Heading
                as="h3"
                fontSize="base"
                fontWeight="semibold"
                color="fgInverse"
                mt={3}
              >
                {step.title}
              </Heading>
              <Text color="mutedInverse" mt={1} lineHeight="tall">
                {step.body}
              </Text>
            </Stack>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
