import { Box, Flex, Grid, Link, Text, VStack } from "@chakra-ui/react";

import Wordmark from "./Wordmark";

export default function Footer() {
  return (
    <Box
      as="footer"
      borderTopWidth="1px"
      borderColor="border"
      mt={32}
      py={16}
      scrollMarginTop="4rem"
    >
      <Box maxW="7xl" mx="auto" px={6}>
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
          gap={12}
        >
          <Box maxW="sm">
            <Wordmark />
            <Text fontSize="sm" color="muted" mt={3}>
              Ketahui berapa nilai pengaruhmu.
            </Text>
            <Text fontSize="sm" color="faint" mt={2} lineHeight="tall">
              Cardify mengubah dasbor media sosialmu menjadi rate card yang serius
              dipertimbangkan brand.
            </Text>
          </Box>

          <VStack align={{ base: "flex-start", md: "flex-end" }} spacing={3}>
            <Link
              href="#how-it-works"
              fontSize="sm"
              color="muted"
              transition="color 150ms"
              _hover={{ color: "fg" }}
            >
              Cara Kerja
            </Link>
          </VStack>
        </Grid>

        <Flex
          mt={12}
          borderTopWidth="1px"
          borderColor="border"
          pt={6}
          fontSize="xs"
          color="faint"
          direction={{ base: "column", sm: "row" }}
          justifyContent="space-between"
          gap={2}
        >
          <Text>© 2026 Cardify</Text>
          <Link
            href="https://cardify.my.id"
            color="faint"
            transition="color 150ms"
            _hover={{ color: "muted" }}
          >
            cardify.my.id
          </Link>
        </Flex>
      </Box>
    </Box>
  );
}
