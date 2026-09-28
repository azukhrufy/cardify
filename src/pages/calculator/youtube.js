import CalculatorTabLayout from "@/Layouts/CalculatorTabLayout";
import HomeLayout from "@/Layouts/HomePageLayout";

import { Text } from "@chakra-ui/react";

Youtube.getLayout = function getLayout(page) {
  return (
    <HomeLayout>
      <CalculatorTabLayout>{page}</CalculatorTabLayout>
    </HomeLayout>
  );
};

export default function Youtube() {
  return (
    <Text h="100vh" bg="white" color="black">
      Youtube Calculator Page
    </Text>
  );
}
