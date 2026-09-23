import { Box } from "@chakra-ui/react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Seo from "@/components/Seo";
import WhoWeAre from "@/components/WhoWeAre";

export default function Home() {
  return (
    <>
      <Seo />
      <Header />
      <Box as="main">
        <Hero />
        <WhoWeAre />
      </Box>
      <Footer />
    </>
  );
}
