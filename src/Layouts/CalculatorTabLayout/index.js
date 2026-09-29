import { Flex, Button, Box, Container } from "@chakra-ui/react";
import { useRouter } from "next/router";
import NextLink from "next/link";
import { FaTiktok, FaInstagram, FaYoutube } from "react-icons/fa6";
import CalcHero from "@/components/CalcHero";

const TAB_BUTTONS = [
  {
    href: "/calculator/tiktok",
    title: "TikTok",
    colorScheme: "tiktokBlack",
    icon: FaTiktok,
  },
  {
    href: "/calculator/instagram",
    title: "Instagram",
    colorScheme: "purpleInstagram",
    icon: FaInstagram,
  },
  {
    href: "/calculator/youtube",
    title: "YouTube",
    colorScheme: "youtubeRed",
    icon: FaYoutube,
  },
];

export default function CalculatorTabLayout({ children }) {
  const router = useRouter();

  return (
    <Box bg="white">
      <CalcHero />
      <Flex w="100%" justifyContent="center" gap={6} py="50px">
        {TAB_BUTTONS.map((tab) => (
          <Button
            as={NextLink}
            href={tab.href}
            key={tab.href}
            colorScheme={tab.colorScheme}
            variant={router?.pathname === tab.href ? "solid" : "outline"}
            borderWidth={router?.pathname === tab.href ? "none" : "4px"}
            rounded="2xl"
            leftIcon={<tab.icon />}
          >
            {tab.title}
          </Button>
        ))}
      </Flex>
      <Container maxW="container.xl">{children}</Container>
    </Box>
  );
}
