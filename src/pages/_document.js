import { ColorModeScript } from "@chakra-ui/react";
import { Html, Head, Main, NextScript } from "next/document";

import theme from "@/theme";

export default function Document() {
  return (
    <Html lang="id">
      <Head />
      <body>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Main />
        <NextScript />
        {/*
          Infolinks. Dua tag mentah di sini, bukan `next/script` dan bukan
          komponen klien, karena dua hal:

          1. Verifikasi Infolinks membaca HTML sumber halaman (View Page Source).
             Skrip yang baru disuntik dari klien setelah user menekan tombol
             tidak pernah muncul di sana, jadi pemasangannya tidak akan terbaca.
          2. Urutannya penting dan gratis di sini: `infolinks_pid` dan
             `infolinks_wsid` dibaca skrip utamanya saat dieksekusi, dan dua tag
             berurutan begini dijalankan parser sesuai urutannya.

          Konsekuensinya disengaja dan tertulis di halaman privacy: skrip ini
          dimuat di SETIAP kunjungan, bukan menunggu user menekan tombol di
          `AdTermsBanner` seperti skrip Adsterra. Kalau barisnya dihapus dari
          sini, paragraf Infolinks di `src/pages/privacy.js` ikut berubah.

          `https://` eksplisit, bukan `//` atau `http://`: origin ini di-HSTS,
          jadi versi http-nya diblokir browser sebagai mixed content.

          Atribut `defer` ditambahkan sendiri (snippet aslinya tanpa itu): tag
          ini elemen terakhir di body, jadi bedanya cuma parsing tidak diblokir
          saat skripnya diunduh. Urutannya tetap benar — skrip config di atas
          dieksekusi parser saat parse, dan skrip deferred dieksekusi setelahnya.
          Aturan ESLint `@next/next/no-sync-scripts` memang menuntut `async`
          atau `defer`; `async` tidak dipakai karena urutan terhadap skrip lain
          jadi tidak lagi dijamin parser.
        */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: "var infolinks_pid = 3448690; var infolinks_wsid = 0;",
          }}
        />
        <script
          type="text/javascript"
          src="https://resources.infolinks.com/js/infolinks_main.js"
          defer
        />
      </body>
    </Html>
  );
}
