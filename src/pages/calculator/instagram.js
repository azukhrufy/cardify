import CalculatorTabLayout from "@/Layouts/CalculatorTabLayout";
import HomeLayout from "@/Layouts/HomePageLayout";

import { Box, Text, VStack, Heading } from "@chakra-ui/react";
import { FaInstagram } from "react-icons/fa6";

Instagram.getLayout = function getLayout(page) {
  return (
    <HomeLayout>
      <CalculatorTabLayout>{page}</CalculatorTabLayout>
    </HomeLayout>
  );
};

export default function Instagram() {
  return (
    <Box 
      h="100vh" 
      display="flex" 
      alignItems="center" 
      justifyContent="center" 
      bg="bgInverse" 
      color="fgInverse"
    >
      <VStack spacing={6} textAlign="center">
        <FaInstagram size={80} color="#E1306C" />
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            Feature is Under Development
          </Heading>
          <Text color="mutedInverse" fontSize="lg">
            Instagram Calculator is coming soon. Please check back later!
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}