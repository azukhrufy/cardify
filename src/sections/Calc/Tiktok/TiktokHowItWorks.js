import NextImage from "next/image";
import { Box, Flex, Grid, Heading, Image, Stack, Text } from "@chakra-ui/react";

/**
 * The two steps, in the reference's order. Each screenshot already carries its
 * own tilt and border, so nothing here rotates or frames them — the images are
 * dropped in at their native ratio and the white margin around the phone reads
 * as part of the section's white band.
 *
 * `flip` puts the screenshot on the right and the copy on the left, which is how
 * the reference alternates the two rows.
 */
const STEPS = [
  {
    label: "Step 1",
    title: "Pilih Bagian Analitik",
    body: "Masuk ke bagian “TikTok Studio” dan pilih bagian Analitik.",
    src: "/assets/tiktok-step-1.png",
    width: 325,
    height: 496,
    alt: "Dasbor TikTok Studio dengan bagian Analitik ditandai lingkaran merah",
    flip: false,
  },
  {
    label: "Step 2",
    title: "Screenshot",
    body: (
      <>
        Screenshot bagian analisis TikTok kamu, dan Upload di{" "}
        <Text as="span" fontWeight="bold" color="fgInverse">
          Cardify
        </Text>
      </>
    ),
    src: "/assets/tiktok-step-2.png",
    width: 358,
    height: 513,
    alt: "Halaman analisis TikTok berisi metrik utama dan grafik performa",
    flip: true,
  },
];

function Step({ step }) {
  return (
    <Grid
      templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }}
      gap={{ base: 10, md: 16 }}
      alignItems="center"
    >
      <Box
        order={{ base: 1, md: step.flip ? 2 : 1 }}
        display="flex"
        justifyContent="center"
      >
        <Box maxW={{ base: "14rem", md: "19rem" }}>
          <NextImage
            src={step.src}
            alt={step.alt}
            width={step.width}
            height={step.height}
            /* Without this Next assumes 100vw and fetches the 750px cut for a
               304px slot. Mirrors the `maxW` on the box above. */
            sizes="(min-width: 48em) 608px, 448px"
            style={{ width: "100%", height: "auto" }}
          />
        </Box>
      </Box>
      <Stack order={{ base: 2, md: step.flip ? 1 : 2 }} spacing={0}>
        <Flex
          justifyContent={step?.label === "Step 2" ? "flex-end" : "flex-start"}
        >
          <Box>
            <Text fontSize="md" fontWeight="bold" color="fgInverse">
              {step.label}
            </Text>
            <Heading
              as="h3"
              fontSize={{ base: "lg", md: "2xl" }}
              fontWeight="bold"
              letterSpacing="tight"
              color="fgInverse"
              mt={1}
            >
              {step.title}
            </Heading>
            <Text
              fontSize={{ base: "md", md: "lg" }}
              lineHeight="tall"
              color="mutedInverse"
              maxW="sm"
              mt={2}
            >
              {step.body}
            </Text>
          </Box>
        </Flex>
      </Stack>
    </Grid>
  );
}

/**
 * "How It Works" for the TikTok route — the light band that the hero's closing
 * arc opens onto, so every token here is the `*Inverse` set.
 *
 * Carries the `#how-it-works` anchor the header nav points at, which is why the
 * nav is not a dead link on this route the way it was before the section existed.
 */
export default function TiktokHowItWorks() {
  return (
    <Box as="section" id="how-it-works" scrollMarginTop="4rem">
      <Box maxW="7xl" mx="auto" px={6} py={{ base: 16, md: 24 }}>
        <Heading
          as="h2"
          textAlign="center"
          fontSize={{ base: "2xl", md: "3xl" }}
          fontWeight="bold"
          letterSpacing="tight"
          color="fgInverse"
        >
          Cara Kerja
        </Heading>

        <Stack spacing={{ base: 16, md: 12 }} mt={{ base: 12, md: 16 }}>
          <Step step={STEPS[0]} />

          <Box
            display={{ base: "none", lg: "flex" }}
            position="absolute"
            top="50%"
            left="45%"
          >
            <Image src="/assets/arrow.png" alt="Step Arrow" />
          </Box>

          <Step step={STEPS[1]} />
        </Stack>
      </Box>
    </Box>
  );
}
