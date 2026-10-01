import { Link, Text } from "@chakra-ui/react";

import LegalPage, { LegalList, LegalSection } from "@/components/LegalPage";
import HomeLayout from "@/Layouts/HomePageLayout";
import { COMPANY } from "@/constants/company";

Privacy.getLayout = function getLayout(page) {
  return <HomeLayout>{page}</HomeLayout>;
};

export default function Privacy() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      path="/privacy"
      updatedAt="1 Oktober 2026"
      description="Apa yang Cardify lakukan dengan datamu: perhitungan berjalan di browser, skrip iklan versi gratis, dan nilai yang tersimpan di perangkatmu."
    >
      <LegalSection title="Kalkulator">
        <Text lineHeight="tall">
          Semua perhitungan di Cardify berjalan di browser kamu. Data yang kamu
          masukkan — nama, handle, jumlah follower, metrik performa, dan foto
          profil — <b>tidak dikirim ke server kami</b>, tidak disimpan, dan tidak
          dibagikan. Tidak ada akun, tidak ada database, dan rate card yang kamu
          unduh dibuat langsung di perangkatmu.
        </Text>
        <Text lineHeight="tall">
          Konsekuensinya: menutup tab berarti datanya hilang. Kami memang tidak
          punya salinannya.
        </Text>
      </LegalSection>

      <LegalSection title="Iklan">
        <Text lineHeight="tall">
          Cardify gratis, dan versi gratisnya dibiayai iklan dari jaringan pihak
          ketiga{" "}
          <Link href="https://monetag.com/" isExternal textDecoration="underline">
            Monetag
          </Link>{" "}
          dan{" "}
          <Link
            href="https://adsterra.com/"
            isExternal
            textDecoration="underline"
          >
            Adsterra
          </Link>
          . Versi berbayar tanpa iklan sedang disiapkan.
        </Text>
        <Text lineHeight="tall">
          <b>Adsterra</b> menayangkan banner di halaman kalkulator. Skripnya
          berjalan di halaman yang sama, jadi secara teknis ia bisa membaca apa
          pun yang ada di halaman — termasuk data kalkulator dan foto profil
          yang kamu unggah. Kami tidak mengirimkan data itu ke Adsterra, tapi
          kami juga tidak bisa membatasi apa yang skrip mereka baca. Data yang
          mereka proses diatur oleh kebijakan privasi Adsterra, bukan kebijakan
          ini.
        </Text>
        <Text lineHeight="tall">
          <b>Monetag</b> tidak memuat skrip apa pun di halaman ini. Iklannya
          berupa tautan langsung yang dibuka di tab baru saat kamu menekan
          tombol hitung atau unduh PDF, jadi halaman ini beserta isinya tidak
          ikut terbaca olehnya. Tab iklannya dibuka maksimal sekali per lima
          menit, dan tetap di belakang supaya kamu tidak kehilangan hasil
          perhitungan atau unduhan PDF yang sedang jalan.
        </Text>
        <Text lineHeight="tall">
          Skrip Adsterra baru dimuat setelah kamu menekan{" "}
          <b>Setuju &amp; Lanjutkan</b> di banner. Sebelum itu kalkulatornya
          tetap berfungsi penuh — yang tertunda cuma pemuatan iklannya, bukan
          fiturnya.
        </Text>
      </LegalSection>

      <LegalSection title="Yang tersimpan di browser kamu">
        <Text lineHeight="tall">
          Kami tidak memasang cookie. Jaringan iklannya sendiri bisa menaruh
          cookie atau penyimpanan milik mereka setelah skripnya dimuat — itu di
          luar kendali kami dan diatur kebijakan privasi masing-masing jaringan.
          Dua nilai berikut disimpan atas nama kami:
        </Text>
        <LegalList>
          <li>
            <b>ads:acceptedAt</b> (localStorage) — kapan kamu menerima syarat
            versi gratis, supaya bannernya tidak muncul lagi di setiap kunjungan.
          </li>
          <li>
            <b>monetag:lastShownAt</b> (sessionStorage) — waktu iklan terakhir
            tampil, dipakai untuk membatasi maksimal satu iklan per lima menit.
            Hilang saat tab ditutup.
          </li>
        </LegalList>
        <Text lineHeight="tall">
          Menghapus data situs untuk <b>cardify.my.id</b> lewat pengaturan
          browser ikut menghapus catatan penerimaannya. Bannernya akan muncul
          lagi, dan iklannya berhenti dimuat sampai kamu menerima lagi.
        </Text>
      </LegalSection>

      <LegalSection title="Analitik">
        <Text lineHeight="tall">
          Kami memakai Vercel Analytics untuk menghitung kunjungan halaman.
          Layanan ini tidak memakai cookie dan tidak melacak kamu antar situs.
        </Text>
      </LegalSection>

      <LegalSection title="Pertanyaan">
        <Text lineHeight="tall">
          Kalau ada yang perlu ditanyakan soal halaman ini, hubungi kami di{" "}
          <Link href={`mailto:${COMPANY.email}`} textDecoration="underline">
            {COMPANY.email}
          </Link>
          . Lihat juga{" "}
          <Link href="/contact" textDecoration="underline">
            halaman Kontak
          </Link>
          .
        </Text>
      </LegalSection>
    </LegalPage>
  );
}
