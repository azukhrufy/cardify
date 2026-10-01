import { Box } from "@chakra-ui/react";
import Head from "next/head";
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
      <Head>
        {/* Primary Meta Tags */}
        <title>Cardify — AI Social Media Rate Card Generator</title>
        <meta
          name="title"
          content="Cardify — AI Social Media Rate Card Generator"
        />
        <meta
          name="description"
          content="Buat rate card profesional untuk sosial media kamu secara otomatis dengan AI."
        />

        {/* Open Graph / Facebook / WhatsApp / LinkedIn */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://cardify.my.id/" />
        <meta
          property="og:title"
          content="Cardify — AI Social Media Rate Card Generator"
        />
        <meta
          property="og:description"
          content="Buat rate card profesional untuk sosial media kamu secara otomatis dengan AI."
        />
        <meta
          property="og:image"
          content="https://cardify.my.id/og-image.png"
        />

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://cardify.my.id/" />
        <meta
          name="twitter:title"
          content="Cardify — AI Social Media Rate Card Generator"
        />
        <meta
          name="twitter:description"
          content="Buat rate card profesional untuk sosial media kamu secara otomatis dengan AI."
        />
        <meta
          name="twitter:image"
          content="https://cardify.my.id/og-image.png"
        />
      </Head>
      <Seo />
      <Box as="main">
        <Hero />
        <WhoWeAre />
      </Box>
    </>
  );
}
