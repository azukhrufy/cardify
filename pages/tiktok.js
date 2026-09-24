import { Box } from "@chakra-ui/react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Seo from "@/components/Seo";
import TiktokHero from "@/components/TiktokHero";
import TiktokHowItWorks from "@/components/TiktokHowItWorks";

export default function Tiktok() {
  return (
    <>
      <Seo title="Kalkulator Rate Card TikTok" path="/tiktok" />
      <Header />
      {/* The light band: TiktokHero's closing arc is painted on this colour, so
          the section below the hero continues it rather than starting a new one. */}
      <Box as="main" bg="bgInverse">
        <TiktokHero />
        <TiktokHowItWorks />
      </Box>
      <Footer />
    </>
  );
}
