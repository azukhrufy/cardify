import { Box } from "@chakra-ui/react";
import Seo from "@/components/Seo";
import Hero from "@/sections/LandingPage/Hero";
import WhoWeAre from "@/sections/LandingPage/WhoWeAre";
import HomeLayout from "@/Layouts/HomePageLayout";

Home.getLayout = function getLayout(page) {
  return <HomeLayout>{page}</HomeLayout>;
};

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


