import CalculatorTabLayout from "@/Layouts/CalculatorTabLayout";
import HomeLayout from "@/Layouts/HomePageLayout";

import { Box, Text, VStack, Heading } from "@chakra-ui/react";
import { FaYoutube } from "react-icons/fa6";

Youtube.getLayout = function getLayout(page) {
  return (
    <HomeLayout>
      <CalculatorTabLayout>{page}</CalculatorTabLayout>
    </HomeLayout>
  );
};

export default function Youtube() {
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
        <FaYoutube size={80} color="#FF0000" />
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            Feature is Under Development
          </Heading>
          <Text color="mutedInverse" fontSize="lg">
            YouTube Calculator is coming soon. Please check back later!
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}