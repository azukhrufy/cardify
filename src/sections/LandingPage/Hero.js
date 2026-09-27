import {
  Box,
  Button,
  Grid,
  Heading,
  HStack,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";

const PLATFORMS = ["TikTok", "YouTube", "Instagram"];

const SAMPLE_METRICS = [
  { label: "Tingkat engagement", value: "4,8%" },
  { label: "Rata-rata tayangan", value: "128 rb" },
  { label: "Kesesuaian audiens", value: "92%" },
];

function PreviewPanel() {
  return (
    <Box position="relative">
      {/* The section's only gradient surface: a 1px brand ring around the panel. */}
      <Box borderRadius="card" p="1px" bgGradient="brand">
        <Box bg="bg" borderRadius="card" p={6}>
          <HStack spacing={2} mb={6}>
            {PLATFORMS.map((platform, index) => (
              <Box
                key={platform}
                px={3}
                py={1.5}
                borderRadius="card"
                fontSize="xs"
                fontWeight="medium"
                bg={index === 0 ? "whiteAlpha.200" : "transparent"}
                color={index === 0 ? "fg" : "muted"}
                borderWidth="1px"
                borderColor={index === 0 ? "borderStrong" : "transparent"}
              >
                {platform}
              </Box>
            ))}
          </HStack>

          <Text
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="0.2em"
            color="muted"
          >
            Estimasi tarif
          </Text>
          <Heading
            as="p"
            fontSize="4xl"
            fontWeight="extrabold"
            letterSpacing="tight"
            color="fg"
            mt={2}
          >
            Rp18.500.000
          </Heading>
          <Text fontSize="sm" color="faint">
            per postingan sponsor
          </Text>

          <Box borderTopWidth="1px" borderColor="border" mt={6} pt={6}>
            <VStack spacing={3} align="stretch">
              {SAMPLE_METRICS.map((metric) => (
                <HStack key={metric.label} justify="space-between">
                  <Text fontSize="sm" color="muted">
                    {metric.label}
                  </Text>
                  <Text fontSize="sm" fontWeight="semibold" color="fg">
                    {metric.value}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function Hero() {
  return (
    <Box as="section" position="relative" overflow="hidden">
      {/* Ambient glow — the only large soft gradient on the page. */}
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

      <Grid
        position="relative"
        maxW="7xl"
        mx="auto"
        px={6}
        py={{ base: 24, md: 32 }}
        templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }}
        gap={16}
        alignItems="center"
      >
        <Stack spacing={0} textAlign="left">
          <Text
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="0.2em"
            color="muted"
            mb={4}
          >
            Kalkulator Rate Card Gratis
          </Text>

          <Heading
            as="h1"
            fontSize={{ base: "5xl", md: "7xl" }}
            fontWeight="extrabold"
            letterSpacing="tight"
            lineHeight="1.05"
            color="fg"
          >
            Ketahui berapa nilai pengaruhmu.
          </Heading>

          <Text
            fontSize={{ base: "lg", md: "xl" }}
            lineHeight="tall"
            color="muted"
            maxW="xl"
            mt={6}
          >
            Unggah dasbor media sosialmu dan dapatkan rate card berbasis data untuk
            TikTok, YouTube, dan Instagram — dalam hitungan menit, bukan minggu.
          </Text>

          <HStack spacing={4} mt={8} flexWrap="wrap">
            <Button as="a" href="#how-it-works" variant="primary">
              Hitung Rate Card Saya
            </Button>
            <Button as="a" href="#how-it-works" variant="secondary">
              Lihat Cara Kerjanya
            </Button>
          </HStack>

          <Text fontSize="sm" color="faint" mt={4}>
            Gratis. Tanpa daftar. Tanpa kartu kredit.
          </Text>
        </Stack>

        <PreviewPanel />
      </Grid>
    </Box>
  );
}
