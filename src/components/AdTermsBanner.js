import { useSyncExternalStore } from "react";
import { Box, Button, Flex, LightMode, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import {
  acceptAdTerms,
  getAdTermsServerSnapshot,
  getAdTermsSnapshot,
  subscribeToAdTerms,
} from "@/lib/adTerms";

/**
 * Banner syarat penggunaan versi gratis.
 *
 * Situs ini gratis dan dibiayai iklan, jadi iklannya bukan opsional selama
 * user memakai versi gratis. Banner ini menjelaskan itu sekali, mencatat
 * penerimaannya, dan baru setelah itu skrip pihak ketiga boleh dimuat.
 *
 * Ini bukan banner persetujuan: tidak ada tombol tolak, jadi jangan sebut ini
 * "consent" di dokumen mana pun. Lihat catatan di `src/lib/adTerms.js`.
 *
 * Kalkulatornya sendiri tidak diblokir. Sebelum tombolnya ditekan semuanya
 * berfungsi normal — yang tertunda cuma pemuatan iklannya, dan gerbang yang
 * sebenarnya ada di `hasAcceptedAdTerms()` yang dibaca `showMonetagAd()`.
 *
 * Warna diambil dari token `*Inverse` dan komponennya dibungkus `<LightMode>`:
 * `initialColorMode` theme ini "dark", jadi tanpa itu Chakra meresolusi
 * `colorScheme` ke shade terang yang pucat di atas band putih.
 */
export default function AdTermsBanner() {
  // Snapshot server selalu `null` ("belum menerima"), jadi banner ini ikut
  // dirender di HTML statis dan render hydration pertama memakai nilai yang
  // sama — tidak ada markup yang berbeda antara server dan klien. React baru
  // berpindah ke snapshot klien setelah hydration: user yang sudah pernah
  // menerima akan melihat bannernya hilang saat itu, yang belum sudah
  // melihatnya sejak cat pertama. `acceptAdTerms()` memberi tahu store-nya,
  // jadi banner hilang seketika begitu tombolnya ditekan.
  const acceptedAt = useSyncExternalStore(
    subscribeToAdTerms,
    getAdTermsSnapshot,
    getAdTermsServerSnapshot,
  );

  if (acceptedAt !== null) return null;

  return (
    <LightMode>
      <Box
        as="section"
        aria-label="Syarat penggunaan versi gratis"
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={100}
        bg="bgInverse"
        color="fgInverse"
        borderTopWidth="1px"
        borderColor="borderInverseStrong"
        px={6}
        py={4}
      >
        <Flex
          maxW="7xl"
          mx="auto"
          gap={4}
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "center" }}
          justify="space-between"
        >
          <Text fontSize="sm" color="fgInverse">
            Cardify gratis dan dibiayai iklan dari jaringan pihak ketiga
            Monetag dan Adsterra. Skrip Adsterra berjalan di halaman ini dan
            secara teknis bisa membaca isi halaman — termasuk data yang kamu
            masukkan di kalkulator dan foto profil yang kamu unggah. Iklan
            Monetag tidak memakai skrip di sini: tautannya terbuka di tab baru
            saat kamu menekan tombol hitung atau unduh PDF. Selama kamu memakai
            versi gratis, iklannya ikut dimuat; versi berbayar tanpa iklan
            sedang disiapkan.{" "}
            <Link as={NextLink} href="/privacy" textDecoration="underline">
              Selengkapnya
            </Link>
          </Text>

          <Button
            onClick={acceptAdTerms}
            bg="accent.purple"
            color="white"
            _hover={{ bg: "accent.purple", opacity: 0.9 }}
            flexShrink={0}
            size="sm"
          >
            Setuju &amp; Lanjutkan
          </Button>
        </Flex>
      </Box>
    </LightMode>
  );
}
