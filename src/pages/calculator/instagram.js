import CalculatorTabLayout from "@/Layouts/CalculatorTabLayout";
import HomeLayout from "@/Layouts/HomePageLayout";

import { Text } from "@chakra-ui/react";

Instagram.getLayout = function getLayout(page) {
  return (
    <HomeLayout>
      <CalculatorTabLayout>{page}</CalculatorTabLayout>
    </HomeLayout>
  );
};

export default function Instagram() {
  return (
    <Text h="100vh" bg="white" color="black">
      Instagram Calculator Page
    </Text>
  );
}
