import { Box, Grid, Heading, Stack, Text } from "@chakra-ui/react";

const VALUE_CARDS = [
  {
    title: "Your numbers, not someone else's",
    body: "Every rate is calculated from the dashboard you upload: views, engagement, reach, and the metrics brands actually pay attention to.",
  },
  {
    title: "Three platforms, priced differently",
    body: "TikTok, YouTube, and Instagram behave differently. Each one gets its own calculation, so you quote the right number for the right platform.",
  },
  {
    title: "Free, instant, no account",
    body: "Upload, calculate, download. No signup, no paywall, no waiting on approval. Your rate card is yours.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Upload your dashboard",
    body: "Drop in a screenshot or export of your social media dashboard.",
  },
  {
    number: "02",
    title: "Pick your platform",
    body: "Choose TikTok, YouTube, or Instagram.",
  },
  {
    number: "03",
    title: "Get your rate card",
    body: "Review your calculated rate and download it as a PDF.",
  },
];

export default function WhoWeAre() {
  return (
    <Box
      as="section"
      id="how-it-works"
      scrollMarginTop="4rem"
      borderTopWidth="1px"
      borderColor="border"
    >
      <Box maxW="7xl" mx="auto" px={6} py={{ base: 24, md: 32 }}>
        <Box maxW="2xl">
          <Text
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="0.2em"
            color="muted"
            mb={4}
          >
            Who We Are
          </Text>
          <Heading
            as="h2"
            fontSize={{ base: "3xl", md: "5xl" }}
            fontWeight="bold"
            letterSpacing="tight"
            color="fg"
          >
            Built for creators who are done guessing.
          </Heading>
          <Text fontSize="lg" lineHeight="tall" color="muted" mt={4}>
            Cardify is a free tool for influencers who want a number they can
            defend. Upload your performance data, and we turn it into a rate card
            you can send to brands — no agency markup, no benchmark guesswork.
          </Text>
        </Box>

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
              borderColor="border"
              bg="surface"
              p={6}
              transition="border-color 150ms ease"
              _hover={{ borderColor: "borderStrong" }}
            >
              <Heading
                as="h3"
                fontSize="lg"
                fontWeight="semibold"
                letterSpacing="tight"
                color="fg"
              >
                {card.title}
              </Heading>
              <Text color="muted" lineHeight="tall" mt={2}>
                {card.body}
              </Text>
            </Box>
          ))}
        </Grid>

        <Grid
          id="how-it-works-steps"
          scrollMarginTop="4rem"
          templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
          gap={6}
          mt={20}
          borderTopWidth="1px"
          borderColor="border"
          pt={12}
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
                color="fg"
                mt={3}
              >
                {step.title}
              </Heading>
              <Text color="muted" mt={1} lineHeight="tall">
                {step.body}
              </Text>
            </Stack>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
