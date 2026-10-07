import { Box, Flex, Grid, HStack, IconButton, Link, Text, VStack } from "@chakra-ui/react";
import NextLink from "next/link";
import Wordmark from "../../components/Wordmark";
import { COMPANY } from "@/constants/company";
import { FaTiktok, FaInstagram } from "react-icons/fa";
import { SiThreads } from "react-icons/si";

/**
 * "Cara Kerja" menunjuk ke section di halaman depan, jadi href-nya harus
 * absolut (`/#how-it-works`). Dengan `#how-it-works` saja, link-nya mati begitu
 * footer ini dirender di halaman selain `/` — dan footer ada di semua halaman.
 */
const LINK_GROUPS = [
  {
    title: "Bantuan",
    links: [
      { href: "/#how-it-works", label: "Cara Kerja" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Kontak" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Syarat & Ketentuan" },
      { href: "/refund", label: "Kebijakan Refund" },
      { href: "/privacy", label: "Kebijakan Privasi" },
    ],
  },
  {
    title: "Sosial Media",
    links: [
      { href: COMPANY.socials.tiktok, label: "TikTok", icon: FaTiktok },
      { href: COMPANY.socials.instagram, label: "Instagram", icon: FaInstagram },
      { href: COMPANY.socials.threads, label: "Threads", icon: SiThreads },
    ],
  },
];

const LINK_PROPS = {
  as: NextLink,
  fontSize: "sm",
  color: "muted",
  transition: "color 150ms",
  _hover: { color: "fg" },
};

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
          templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "2fr 1fr 1fr 1fr" }}
          gap={{ base: 10, md: 12 }}
        >
          <Box maxW="sm">
            <Wordmark />
            <Text fontSize="sm" color="muted" mt={3}>
              Ketahui berapa nilai pengaruhmu.
            </Text>
            <Text fontSize="sm" color="faint" mt={2} lineHeight="tall">
              Cardify mengubah dasbor media sosialmu menjadi rate card yang
              serius dipertimbangkan brand.
            </Text>
          </Box>

          {LINK_GROUPS.map((group) => (
            <VStack key={group.title} align="flex-start" spacing={3}>
              <Text fontSize="sm" fontWeight="semibold" color="fg">
                {group.title}
              </Text>
              {group.title === "Sosial Media" ? (
                <HStack spacing={2} mt={1}>
                  {group.links.map((link) => {
                    const IconComp = link.icon;
                    return (
                      <IconButton
                        key={link.href}
                        as="a"
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.label}
                        icon={<IconComp size="18px" />}
                        variant="ghost"
                        size="sm"
                        color="muted"
                        _hover={{ color: "fg", bg: "whiteAlpha.100" }}
                      />
                    );
                  })}
                </HStack>
              ) : (
                group.links.map((link) => (
                  <Link key={link.href} href={link.href} {...LINK_PROPS}>
                    {link.label}
                  </Link>
                ))
              )}
            </VStack>
          ))}
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
          <Text>© 2026 {COMPANY.name}</Text>
          <Link
            href={COMPANY.siteUrl}
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
