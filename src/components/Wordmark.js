import NextImage from "next/image";
import { Box, HStack, Text } from "@chakra-ui/react";

const MARK_SIZE = 14;
/**
 * `cardify-mark.png` carries the apple-icon composition — a rounded brand-gradient
 * tile inset in a transparent canvas, where the tile is 61.7% of the frame. Scaling
 * by the reciprocal makes that tile exactly fill the 14px box, so the tile's own
 * rounded corners supply the glyph's shape and no part of the art is clipped.
 */
const MARK_ZOOM = 1 / 0.6167;

/**
 * The Cardify wordmark: logo mark + name.
 * `pill` renders the header form (rounded border); the footer uses the bare form.
 */
export default function Wordmark({ pill = false, fontSize = "md", ...rest }) {
  const inner = (
    <HStack spacing={2} align="center">
      <Box boxSize={`${MARK_SIZE}px`} flexShrink={0} overflow="hidden">
        <NextImage
          src="/cardify-mark.png"
          alt=""
          width={MARK_SIZE}
          height={MARK_SIZE}
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${MARK_ZOOM})`,
          }}
        />
      </Box>
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
