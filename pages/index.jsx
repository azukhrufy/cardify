import { Box } from "@chakra-ui/react";
import Seo from "@/components/Seo";
import Hero from "@/src/sections/LandingPage/Hero";
import WhoWeAre from "@/src/sections/LandingPage/WhoWeAre";
import HomeLayout from "@/Layouts/HomePageLayout";

export default function Home() {
  return (
    <>
      <Seo />
      <Box as="main">
        <Hero />
        <WhoWeAre />
      </Box>
    </>
  );
}

Home.getLayout = function getLayout(page) {
  return <HomeLayout>{page}</HomeLayout>;
};
