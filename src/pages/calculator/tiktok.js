import CalculatorTabLayout from "@/Layouts/CalculatorTabLayout";
import HomeLayout from "@/Layouts/HomePageLayout";

import { Text } from "@chakra-ui/react";

Tiktok.getLayout = function getLayout(page) {
  return (
    <HomeLayout>
      <CalculatorTabLayout>{page}</CalculatorTabLayout>
    </HomeLayout>
  );
};

export default function Tiktok() {
  return (
    <Text h="100vh" bg="white" color="black">
      TikTok Calculator Page
    </Text>
  );
}
