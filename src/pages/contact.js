import { Box, Flex, Link, Text } from "@chakra-ui/react";

import LegalPage, { LegalSection } from "@/components/LegalPage";
import HomeLayout from "@/Layouts/HomePageLayout";
import { COMPANY, OPERATOR_NAME } from "@/constants/company";

Contact.getLayout = function getLayout(page) {
  return <HomeLayout>{page}</HomeLayout>;
};

/**
 * Penanda untuk data usaha yang belum diisi.
 *
 * Sengaja dibuat mencolok, bukan disembunyikan. Baris yang hilang diam-diam
 * bikin halaman ini kelihatan lengkap padahal belum — dan kalau halaman ini
 * dipakai untuk verifikasi payment gateway, kontak yang kosong atau salah
 * bikin pendaftarannya ditolak. Lebih baik kelihatan belum selesai.
 *
 * Warnanya sengaja pakai skala `red` bawaan Chakra, bukan token tema: penanda
 * ini sementara dan memang harus kelihatan sebagai belum selesai, bukan
 * menyatu dengan desainnya.
 */
function BelumDiisi({ label }) {
  return (
    <Flex
      align="center"
      gap={2}
      px={3}
      py={2}
      borderWidth="1px"
      borderColor="red.400"
      borderRadius="md"
      bg="red.50"
      color="red.700"
      role="note"
      aria-label={`${label} belum diisi`}
      w="fit-content"
    >
      <Text fontSize="sm" fontWeight="semibold">
        ⚠ Belum diisi — lengkapi di src/constants/company.js
      </Text>
    </Flex>
  );
}

/** Satu baris kontak: label + nilai. */
function ContactRow({ label, children }) {
  return (
    <Box>
      <Text fontSize="sm" fontWeight="semibold" color="fgInverse" mb={1}>
        {label}
      </Text>
      {children}
    </Box>
  );
}

export default function Contact() {
  return (
    <LegalPage
      title="Kontak"
      path="/contact"
      updatedAt="1 Oktober 2026"
      description="Hubungi Cardify untuk pertanyaan, laporan bug, kerja sama, atau urusan langganan."
    >
      <LegalSection title="Hubungi kami">
        <Text lineHeight="tall">
          Pertanyaan, laporan bug, atau urusan langganan — semuanya lewat jalur
          di bawah ini. Kami balas dalam 5 hari kerja.
        </Text>
        <ContactRow label="Email">
          <Link href={`mailto:${COMPANY.email}`} textDecoration="underline">
            {COMPANY.email}
          </Link>
        </ContactRow>

        <ContactRow label="Telepon">
          {COMPANY.phone ? (
            <Link href={`tel:${COMPANY.phone}`} textDecoration="underline">
              {COMPANY.phone}
            </Link>
          ) : (
            <BelumDiisi label="Nomor telepon" />
          )}
        </ContactRow>

        <ContactRow label="Alamat usaha">
          {COMPANY.address ? (
            <Text lineHeight="tall">{COMPANY.address}</Text>
          ) : (
            <BelumDiisi label="Alamat usaha" />
          )}
        </ContactRow>

        <ContactRow label="Nama usaha">
          <Text lineHeight="tall">{OPERATOR_NAME}</Text>
        </ContactRow>
      </LegalSection>

      <LegalSection title="Sebelum mengirim email">
        <Text lineHeight="tall">
          Untuk laporan bug, sebutkan browser dan versinya, langkah-langkah yang
          kamu lakukan sampai masalahnya muncul, dan apa yang kamu harapkan
          terjadi. Laporan yang bisa kami ulang jauh lebih cepat ditangani.
        </Text>
        <Text lineHeight="tall">
          Untuk urusan langganan, sebutkan email akun yang kamu pakai saat
          membayar dan ID transaksinya. Lihat juga{" "}
          <Link href="/refund" textDecoration="underline">
            Kebijakan Refund
          </Link>
          .
        </Text>
      </LegalSection>

      <LegalSection title="Data kamu">
        <Text lineHeight="tall">
          Kami tidak punya akses ke data yang kamu masukkan ke kalkulator — semua
          perhitungan berjalan di browser kamu dan tidak pernah dikirim ke server.
          Jadi jangan kirimkan data analytics-mu lewat email; kami memang tidak
          bisa memeriksanya dari sisi kami. Yang bisa kami bantu adalah soal
          layanannya, bukan isi datanya.
        </Text>
        <Text lineHeight="tall">
          Rinciannya di{" "}
          <Link href="/privacy" textDecoration="underline">
            Kebijakan Privasi
          </Link>
          .
        </Text>
      </LegalSection>
    </LegalPage>
  );
}
