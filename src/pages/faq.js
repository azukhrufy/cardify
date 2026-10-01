import { Box, Heading, Link, Stack, Text } from "@chakra-ui/react";

import LegalPage from "@/components/LegalPage";
import HomeLayout from "@/Layouts/HomePageLayout";
import { COMPANY } from "@/constants/company";
import { MINIMUM_RATE, RATE_ROUNDING } from "@/constants/formulas";

Faq.getLayout = function getLayout(page) {
  return <HomeLayout>{page}</HomeLayout>;
};

const rupiah = (value) => `Rp${value.toLocaleString("id-ID")}`;

const FAQ_ITEMS = [
  {
    question: "Apa itu Cardify?",
    answer: (
      <Text lineHeight="tall">
        Cardify adalah kalkulator rate card untuk kreator TikTok, YouTube, dan
        Instagram. Kamu masukkan metrik dari analytics — views, likes, komentar,
        share — dan Cardify menghitung estimasi tarif per format konten, lalu
        menyusunnya jadi rate card yang bisa diunduh sebagai PDF.
      </Text>
    ),
  },
  {
    question: "Apakah Cardify gratis?",
    answer: (
      <Text lineHeight="tall">
        Ya. Versi gratisnya dibiayai iklan, jadi selama kamu memakai versi
        gratis skrip iklan ikut dimuat ke halaman. Versi berbayar tanpa iklan
        sedang disiapkan. Rinciannya ada di{" "}
        <Link href="/privacy" textDecoration="underline">
          Kebijakan Privasi
        </Link>{" "}
        dan{" "}
        <Link href="/terms" textDecoration="underline">
          Syarat &amp; Ketentuan
        </Link>
        .
      </Text>
    ),
  },
  {
    question: "Apakah saya perlu membuat akun?",
    answer: (
      <Text lineHeight="tall">
        Tidak. Tidak ada pendaftaran, tidak ada login, dan tidak ada database
        pengguna. Buka halamannya, isi datanya, unduh hasilnya. Pembuatan akun
        baru akan diperlukan ketika fitur-fitur tertentu yang membutuhkan
        penyimpanan data pribadi diaktifkan.
      </Text>
    ),
  },
  {
    question: "Apakah data analytics saya dikirim ke server?",
    answer: (
      <Text lineHeight="tall">
        Tidak. Seluruh perhitungan berjalan di browser kamu. Nama, handle,
        jumlah follower, metrik performa, dan foto profil yang kamu unggah tidak
        pernah meninggalkan perangkatmu. Konsekuensinya: menutup tab berarti
        datanya hilang, karena kami memang tidak punya salinannya.
      </Text>
    ),
  },
  {
    question: "Bagaimana tarif saya dihitung?",
    answer: (
      <Stack spacing={4}>
        <Text lineHeight="tall">
          Empat langkah, semuanya bisa kamu telusuri:
        </Text>
        <Box as="ol" pl={5} sx={{ listStyleType: "decimal" }} lineHeight="tall">
          <li>
            <b>Base rate</b> — (views ÷ 1.000) × CPM untuk niche dan format
            kontenmu.
          </li>
          <li>
            <b>Pengali engagement</b> — engagement rate kamu dibandingkan dengan
            benchmark niche-mu. Rasio itu dipetakan ke pengali antara 0,7× dan
            1,45×, jadi engagement di atas benchmark menaikkan tarif dan di
            bawahnya menurunkannya — tapi tidak pernah lebih dari 45% ke atas
            atau 30% ke bawah.
          </li>
          <li>
            <b>Pengali niche dan durasi</b> — beberapa niche (mis. kecantikan)
            dihargai lebih tinggi; format yang butuh produksi lebih berat juga.
          </li>
          <li>
            <b>Pembulatan</b> — hasil akhirnya dibulatkan ke{" "}
            {rupiah(RATE_ROUNDING)} terdekat.
          </li>
        </Box>
      </Stack>
    ),
  },
  {
    question: "Kenapa tarif saya naik ke batas minimum?",
    answer: (
      <Text lineHeight="tall">
        Kalau hasil hitungan mentahnya di bawah batas minimum untuk format itu,
        Cardify menaikkannya ke batas minimum. Untuk video di TikTok dan Reels,
        batasnya {rupiah(MINIMUM_RATE)}. Format lain punya batas sendiri yang
        diskalakan dari CPM-nya — story dan feed post misalnya lebih rendah,
        karena beban kerjanya memang lebih ringan. Jadi angka yang kamu lihat
        tidak pernah turun di bawah batas formatnya.
      </Text>
    ),
  },
  {
    question: "Platform apa saja yang didukung?",
    answer: (
      <Text lineHeight="tall">
        TikTok, YouTube, dan Instagram. Format yang dihitung menyesuaikan
        platformnya — TikTok punya video dan photo mode, YouTube punya integrasi
        dan dedicated video, Instagram punya story, feed post, dan Reels.
      </Text>
    ),
  },
  {
    question: "Dari mana angka CPM dan benchmark-nya?",
    answer: (
      <Text lineHeight="tall">
        Angka acuannya disusun dari data pasar 2025 dan berbeda per niche. Untuk
        benchmark engagement rate TikTok, acuannya rata-rata industri sekitar
        2,5%–5,0%. Angka-angka ini titik awal untuk negosiasi, bukan harga resmi
        pasar — brand di industri yang berbeda bisa membayar jauh di atas atau
        di bawah estimasi ini.
      </Text>
    ),
  },
  {
    question: "Apakah angka ini mengikat?",
    answer: (
      <Text lineHeight="tall">
        Tidak. Hasil Cardify adalah estimasi dari data yang kamu masukkan
        sendiri, dan tidak pernah menjadi penawaran, kontrak, atau nasihat
        keuangan. Kamu tetap bebas menetapkan tarif berapa pun, dan brand tetap
        bebas menolak. Selengkapnya di{" "}
        <Link href="/terms" textDecoration="underline">
          Syarat &amp; Ketentuan
        </Link>
        .
      </Text>
    ),
  },
  {
    question: "Bisakah dipakai di HP?",
    answer: (
      <Text lineHeight="tall">
        Bisa. Tampilannya menyesuaikan layar HP, dan PDF-nya diunduh seperti
        unduhan biasa.
      </Text>
    ),
  },
  {
    question: "Bagaimana cara mengunduh rate card-nya?",
    answer: (
      <Text lineHeight="tall">
        Setelah semua data terisi, tekan tombol unduh PDF. Rate card-nya dibuat
        di perangkatmu dengan ukuran A4 dan diberi tanda Cardify.
      </Text>
    ),
  },
  {
    question: "Kenapa muncul iklan?",
    answer: (
      <Text lineHeight="tall">
        Iklan yang membiayai versi gratis. Skripnya baru dimuat setelah kamu
        menekan <b>Setuju &amp; Lanjutkan</b>, dan dibatasi maksimal satu iklan
        per lima menit. Sebelum kamu menerima syaratnya, kalkulatornya tetap
        berfungsi penuh — yang tertunda cuma pemuatan iklannya.
      </Text>
    ),
  },
  {
    question: "Ada bug atau pertanyaan lain?",
    answer: (
      <Text lineHeight="tall">
        Kirim ke{" "}
        <Link href={`mailto:${COMPANY.email}`} textDecoration="underline">
          {COMPANY.email}
        </Link>
        . Kalau melaporkan bug, sebutkan browser dan langkah yang kamu lakukan
        supaya bisa kami ulang.
      </Text>
    ),
  },
];

export default function Faq() {
  return (
    <LegalPage
      title="Pertanyaan yang Sering Diajukan"
      path="/faq"
      updatedAt="1 Oktober 2026"
      description="Jawaban atas pertanyaan umum soal cara hitung rate card, data yang diproses Cardify, iklan versi gratis, dan format konten yang didukung."
    >
      {FAQ_ITEMS.map((item) => (
        <Box key={item.question}>
          <Heading
            as="h2"
            fontSize="lg"
            fontWeight="semibold"
            color="fgInverse"
            mb={3}
          >
            {item.question}
          </Heading>
          {item.answer}
        </Box>
      ))}
    </LegalPage>
  );
}
