import { Box } from "@chakra-ui/react";

import Header from "@/Layouts/HomePageLayout/Header";
import Footer from "@/Layouts/HomePageLayout/Footer";
import Seo from "@/components/Seo";
import TiktokHero from "@/sections/Calc/Tiktok/TiktokHero";
import TiktokHowItWorks from "@/sections/Calc/Tiktok/TiktokHowItWorks";

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
