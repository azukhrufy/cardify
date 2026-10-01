import { Box, Container, Heading, Stack, Text } from "@chakra-ui/react";

import Seo from "@/components/Seo";

/**
 * Kerangka halaman dokumen — Privasi, Syarat & Ketentuan, Kebijakan Refund,
 * FAQ, Kontak.
 *
 * Band terang, container sempit, judul, tanggal pembaruan. Dipakai bersama
 * supaya tipografi lima halaman ini tidak drift satu per satu; sebelumnya
 * tiap halaman mengulang blok yang sama dan pasti akan berbeda sendiri-sendiri
 * begitu salah satunya disentuh.
 */
export default function LegalPage({ title, path, updatedAt, description, children }) {
  return (
    <>
      <Seo title={title} path={path} description={description} />

      <Box as="main" bg="bgInverse" py={{ base: 16, md: 24 }}>
        <Container maxW="container.md">
          <Stack spacing={10} color="mutedInverse">
            <Box>
              <Heading
                as="h1"
                fontSize={{ base: "3xl", md: "4xl" }}
                fontWeight="bold"
                letterSpacing="tight"
                color="fgInverse"
              >
                {title}
              </Heading>
              {updatedAt && (
                <Text fontSize="sm" color="faintInverse" mt={3}>
                  Terakhir diperbarui: {updatedAt}
                </Text>
              )}
            </Box>

            {children}
          </Stack>
        </Container>
      </Box>
    </>
  );
}

/**
 * Satu bagian bernomor di dalam halaman dokumen.
 *
 * Anak-anaknya menjadi item `Stack`, jadi kirim `<Text>` / `<Box>` sebagai
 * anak langsung — jangan dibungkus fragment, karena jaraknya ikut hilang.
 */
export function LegalSection({ title, children }) {
  return (
    <Box>
      <Heading
        as="h2"
        fontSize="xl"
        fontWeight="semibold"
        color="fgInverse"
        mb={3}
      >
        {title}
      </Heading>
      <Stack spacing={4}>{children}</Stack>
    </Box>
  );
}

/** Daftar berpoin dengan gaya yang sama seperti paragraf di sekitarnya. */
export function LegalList({ children }) {
  return (
    <Box as="ul" pl={5} sx={{ listStyleType: "disc" }} lineHeight="tall">
      {children}
    </Box>
  );
}
