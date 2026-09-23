import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Link,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import { FiMenu, FiX } from "react-icons/fi";

import Wordmark from "./Wordmark";

/**
 * Sticky site nav. Phase 1 carries a single `How It Works` link and points the
 * primary CTA at `#how-it-works` — the `#calculator` anchor does not exist until
 * Phase 2, and a CTA that scrolls nowhere reads as broken.
 */
export default function Header() {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={50}
      borderBottomWidth="1px"
      borderColor="border"
      /* 0.92, not 0.8: over the white "Who We Are" band an 0.8 panel composites
         to #3B3B3B, dropping the muted nav link to 4.4:1 — under AA. 0.92 gives
         #1E1E1E and 6.5:1. */
      bg="rgba(10,10,10,0.92)"
      backdropFilter="blur(12px)"
    >
      <Flex
        maxW="7xl"
        mx="auto"
        px={6}
        h={16}
        align="center"
        justify="space-between"
      >
        <Link href="/" _hover={{ textDecoration: "none" }} aria-label="Cardify home">
          <Wordmark pill />
        </Link>

        <HStack spacing={8} display={{ base: "none", md: "flex" }}>
          <Link
            href="#how-it-works"
            fontSize="sm"
            color="muted"
            transition="color 150ms"
            _hover={{ color: "fg" }}
          >
            How It Works
          </Link>
          <Button as="a" href="#how-it-works" variant="primary" size="sm">
            Calculate My Rate
          </Button>
        </HStack>

        <IconButton
          display={{ base: "flex", md: "none" }}
          onClick={onToggle}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          icon={isOpen ? <FiX /> : <FiMenu />}
          variant="ghost"
          color="fg"
          _hover={{ bg: "whiteAlpha.100" }}
        />
      </Flex>

      {isOpen && (
        <Box
          display={{ base: "block", md: "none" }}
          borderTopWidth="1px"
          borderColor="border"
          px={6}
          py={4}
        >
          <Stack spacing={4}>
            <Link
              href="#how-it-works"
              fontSize="sm"
              color="muted"
              onClick={onToggle}
              _hover={{ color: "fg" }}
            >
              How It Works
            </Link>
            <Button
              as="a"
              href="#how-it-works"
              variant="primary"
              size="sm"
              w="full"
              onClick={onToggle}
            >
              Calculate My Rate
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
