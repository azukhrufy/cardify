import { useEffect } from "react";
import { ChakraProvider, Box } from "@chakra-ui/react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import theme from "@/theme";
import AdTermsBanner from "@/components/AdTermsBanner";
import "@/styles/globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout ?? ((page) => page);

  // SEMENTARA — hapus blok ini setelah public/sw.js dihapus cukup lama.
  //
  // Sampai 2026-10-01 repo ini menyajikan `public/sw.js` untuk zona push
  // Monetag: service worker ber-scope "/" yang seluruh isinya
  // `importScripts()` dari domain jaringan iklan, jadi siapa pun yang
  // menguasai domain itu memegang kendali penuh atas origin ini. Filenya sudah
  // dihapus, tapi browser yang pernah mengunjungi situs masih memegang
  // registrasinya. Menghapus file saja membuat browser mencabut registrasi itu
  // saat pengecekan update berikutnya gagal 404 — blok ini menutup jendela
  // sebelum itu terjadi.
  //
  // Efek ini mencabut SEMUA service worker di origin ini. Kalau nanti ada
  // service worker yang memang diinginkan (PWA, cache offline), hapus blok ini
  // dulu atau registrasinya ikut tercabut.
  useEffect(() => {
    if (!navigator.serviceWorker?.getRegistrations) return;
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        registrations.forEach((registration) => registration.unregister()),
      )
      .catch(() => {
        // diamkan — kalau gagal, registrasinya tetap tercabut lewat update 404
      });
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <Box
        className={`${jakarta.variable} ${inter.variable}`}
        fontFamily="body"
        minH="100vh"
        bg="bg"
        color="fg"
      >
        {getLayout(<Component {...pageProps} />)}
        <AdTermsBanner />
        <Analytics />
      </Box>
    </ChakraProvider>
  );
}
