import { Box, Button, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

/**
 * Halaman penutup OAuth: /oauth/close
 *
 * Callback OAuth selalu mendarat di sini, bukan langsung ke /calculator, supaya
 * dua skenario bisa ditangani dengan satu alur:
 *
 * 1. Popup (jendela mini) — saat user connect lewat window.open(). Halaman ini
 *    mengirim hasil ke jendela pembuka lewat `postMessage`, lalu menutup diri.
 *    Jendela utama menangkap pesan itu dan memperbarui status koneksi.
 *
 * 2. Navigasi penuh — kalau popup diblokir browser. Tidak ada `window.opener`,
 *    jadi halaman ini meneruskan user ke halaman kalkulator seperti biasa.
 */
export default function OAuthClosePage() {
  const router = useRouter();
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const { status, platform, next, message } = router.query;
    const isError = status === "error";
    const target = typeof next === "string" && next.startsWith("/") ? next : "/calculator";

    // Skenario 2: bukan popup → lanjutkan navigasi normal.
    if (!window.opener || window.opener.closed) {
      router.replace(
        isError
          ? `/calculator?oauth_error=${encodeURIComponent(message || "Gagal menghubungkan akun.")}`
          : `${target}?connected=1&platform=${encodeURIComponent(platform || "")}`,
      );
      return;
    }

    // Skenario 1: popup → beri tahu jendela utama, lalu tutup.
    try {
      window.opener.postMessage(
        {
          type: "cardify-oauth-result",
          status: isError ? "error" : "success",
          platform: platform || "",
          message: message || "",
        },
        window.location.origin,
      );
    } catch (err) {
      // Kalau postMessage gagal (mis. origin beda), jendela utama tetap punya
      // polling pemantau penutupan popup sebagai jaring pengaman.
      console.warn("[OAuthClose] postMessage gagal:", err.message);
    }

    // Beri jeda singkat supaya pesan sempat terkirim sebelum jendela ditutup.
    const timer = setTimeout(() => {
      window.close();
      // Kalau window.close() diabaikan (browser tertentu butuh gesture user),
      // tampilkan tombol tutup manual.
      setTimeout(() => setFallback(true), 400);
    }, 400);

    return () => clearTimeout(timer);
  }, [router, router.isReady, router.query]);

  return (
    <Flex minH="100vh" align="center" justify="center" bg="surfaceInverse" px={6}>
      <Box textAlign="center">
        {!fallback ? (
          <Flex direction="column" align="center" gap={4}>
            <Spinner size="lg" color="pink.400" thickness="3px" />
            <Heading size="md" color="fgInverse">
              Menyelesaikan koneksi…
            </Heading>
            <Text fontSize="sm" color="mutedInverse">
              Jendela ini akan tertutup otomatis.
            </Text>
          </Flex>
        ) : (
          <Flex direction="column" align="center" gap={4}>
            <Heading size="md" color="fgInverse">
              Selesai
            </Heading>
            <Text fontSize="sm" color="mutedInverse">
              Silakan tutup jendela ini dan lanjutkan di tab kalkulator.
            </Text>
            <Button colorScheme="pink" onClick={() => window.close()}>
              Tutup Jendela
            </Button>
          </Flex>
        )}
      </Box>
    </Flex>
  );
}
