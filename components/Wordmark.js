import { Box, HStack, Text } from "@chakra-ui/react";

/**
 * The Cardify wordmark: gradient glyph + name.
 * `pill` renders the header form (rounded border); the footer uses the bare form.
 */
export default function Wordmark({ pill = false, fontSize = "md", ...rest }) {
  const inner = (
    <HStack spacing={2} align="center">
      <Box boxSize="14px" bgGradient="brand" borderRadius="sm" flexShrink={0} />
      <Text fontSize={fontSize} fontWeight="bold" letterSpacing="tight" color="fg">
        Cardify
      </Text>
    </HStack>
  );

  if (!pill) {
    return <HStack {...rest}>{inner}</HStack>;
  }

  return (
    <Box
      display="inline-flex"
      borderWidth="1px"
      borderColor="border"
      borderRadius="full"
      px={4}
      py={2}
      {...rest}
    >
      {inner}
    </Box>
  );
}
