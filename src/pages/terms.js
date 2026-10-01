import { Link, Text } from "@chakra-ui/react";

import LegalPage, { LegalList, LegalSection } from "@/components/LegalPage";
import HomeLayout from "@/Layouts/HomePageLayout";
import { COMPANY, OPERATOR_NAME } from "@/constants/company";

Terms.getLayout = function getLayout(page) {
  return <HomeLayout>{page}</HomeLayout>;
};

export default function Terms() {
  return (
    <LegalPage
      title="Syarat & Ketentuan"
      path="/terms"
      updatedAt="1 Oktober 2026"
      description="Aturan penggunaan layanan Cardify: hak dan kewajiban pengguna, batas tanggung jawab, dan ketentuan versi gratis maupun berbayar."
    >
      <LegalSection title="1. Penerimaan syarat">
        <Text lineHeight="tall">
          Dengan mengakses atau memakai Cardify, kamu setuju terikat pada syarat
          dan ketentuan ini. Kalau tidak setuju, jangan pakai layanannya.
        </Text>
        <Text lineHeight="tall">
          Syarat ini berlaku untuk semua orang yang membuka situs ini, tanpa
          terkecuali dan tanpa perlu akun.
        </Text>
      </LegalSection>

      <LegalSection title="2. Apa yang Cardify sediakan">
        <Text lineHeight="tall">
          Cardify adalah alat bantu hitung. Kamu memasukkan metrik performa dari
          analytics milikmu, dan Cardify mengubahnya menjadi estimasi tarif per
          format konten yang bisa kamu unduh sebagai rate card.
        </Text>
        <Text lineHeight="tall">
          Seluruh perhitungan berjalan di browser kamu. Kami tidak menyimpan data
          yang kamu masukkan — konsekuensinya, kami juga tidak bisa
          mengembalikannya kalau tab-nya tertutup.
        </Text>
      </LegalSection>

      <LegalSection title="3. Hasilnya estimasi, bukan penawaran">
        <Text lineHeight="tall">
          Angka yang keluar dari Cardify dihitung dari data yang{" "}
          <b>kamu masukkan sendiri</b> dan dari acuan pasar yang kami susun. Itu
          estimasi, bukan:
        </Text>
        <LegalList>
          <li>penawaran atau janji bahwa brand akan membayar sejumlah itu;</li>
          <li>nasihat keuangan, pajak, atau hukum;</li>
          <li>jaminan bahwa tarifmu pantas atau akan diterima pasar.</li>
        </LegalList>
        <Text lineHeight="tall">
          Kamu bertanggung jawab penuh atas tarif yang akhirnya kamu tetapkan dan
          atas perjanjian yang kamu buat dengan brand.
        </Text>
      </LegalSection>

      <LegalSection title="4. Versi gratis dan iklan">
        <Text lineHeight="tall">
          Versi gratis Cardify dibiayai iklan dari jaringan pihak ketiga. Selama
          kamu memakai versi gratis, kamu menerima bahwa skrip iklan dimuat ke
          halaman ini.
        </Text>
        <Text lineHeight="tall">
          Skrip iklan berjalan di halaman yang sama dengan kalkulator, sehingga
          secara teknis bisa membaca apa pun yang ada di halaman — termasuk data
          yang kamu masukkan dan foto yang kamu unggah. Kami tidak mengirimkan
          data itu kepada mereka, tapi kami juga tidak bisa membatasi apa yang
          skrip mereka baca. Rinciannya di{" "}
          <Link href="/privacy" textDecoration="underline">
            Kebijakan Privasi
          </Link>
          .
        </Text>
        <Text lineHeight="tall">
          Kalau kamu tidak mau iklannya, jangan pakai versi gratis — tunggu versi
          berbayar tanpa iklan, atau pakai alat lain.
        </Text>
      </LegalSection>

      <LegalSection title="5. Versi berbayar">
        <Text lineHeight="tall">
          Versi berbayar tanpa iklan sedang disiapkan dan{" "}
          <b>belum tersedia</b>. Sampai versi itu benar-benar bisa dibeli, tidak
          ada biaya apa pun yang timbul dari pemakaian Cardify, dan kami tidak
          memungut pembayaran dalam bentuk apa pun.
        </Text>
        <Text lineHeight="tall">
          Begitu versi berbayar dibuka, harga, isi paket, dan cara pembayarannya
          akan ditampilkan sebelum kamu membeli, dan ketentuan pengembalian dana
          di{" "}
          <Link href="/refund" textDecoration="underline">
            Kebijakan Refund
          </Link>{" "}
          ikut berlaku sejak saat itu.
        </Text>
      </LegalSection>

      <LegalSection title="6. Kewajiban kamu">
        <Text lineHeight="tall">Saat memakai Cardify, kamu setuju untuk:</Text>
        <LegalList>
          <li>hanya memasukkan data yang benar dan berhak kamu pakai;</li>
          <li>
            tidak memakai layanan ini untuk menyesatkan brand atau pihak lain;
          </li>
          <li>
            tidak mencoba mengganggu, membebani berlebihan, atau menembus sistem
            kami;
          </li>
          <li>
            tidak menyalin, menjual ulang, atau membungkus Cardify sebagai
            produkmu sendiri tanpa izin tertulis.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="7. Hak kekayaan intelektual">
        <Text lineHeight="tall">
          Nama, tampilan, kode, dan isi Cardify milik {OPERATOR_NAME} dan
          dilindungi hukum yang berlaku. Kamu boleh memakai layanannya, dan
          memakai rate card yang kamu buat untuk keperluanmu sendiri — termasuk
          untuk dikirim ke brand.
        </Text>
        <Text lineHeight="tall">
          Data yang kamu masukkan tetap milikmu. Kami tidak mengklaim apa pun atas
          data itu.
        </Text>
      </LegalSection>

      <LegalSection title="8. Batas tanggung jawab">
        <Text lineHeight="tall">
          Cardify disediakan <b>apa adanya</b>. Kami berusaha membuat
          perhitungannya benar dan layanannya tetap hidup, tapi kami tidak
          menjanjikan layanan ini bebas gangguan, bebas error, atau cocok untuk
          tujuan tertentu.
        </Text>
        <Text lineHeight="tall">
          Sejauh diizinkan hukum, {OPERATOR_NAME} tidak bertanggung jawab atas
          kerugian tidak langsung atau konsekuensial — termasuk kehilangan
          pendapatan, kehilangan klien, atau peluang yang hilang — yang timbul
          dari pemakaian atau ketidakmampuan memakai Cardify.
        </Text>
        <Text lineHeight="tall">
          Karena versi gratisnya memang tidak berbayar, tidak ada nilai transaksi
          yang bisa dituntut darinya. Batasan ini tidak berlaku sejauh hukum yang
          berlaku melarangnya.
        </Text>
      </LegalSection>

      <LegalSection title="9. Perubahan dan penghentian layanan">
        <Text lineHeight="tall">
          Kami bisa mengubah, menambah, atau menghentikan sebagian atau seluruh
          layanan kapan saja, dan bisa memperbarui syarat ini dari waktu ke
          waktu. Tanggal pembaruan di bagian atas halaman ini menunjukkan versi
          yang sedang berlaku.
        </Text>
        <Text lineHeight="tall">
          Kalau kamu memakai layanannya setelah syarat ini berubah, kamu dianggap
          setuju pada versi yang baru.
        </Text>
      </LegalSection>

      <LegalSection title="10. Hukum yang berlaku">
        <Text lineHeight="tall">
          Syarat ini diatur oleh hukum Republik Indonesia. Sengketa yang timbul
          dari pemakaian Cardify diselesaikan secara musyawarah terlebih dahulu;
          kalau tidak tercapai, diselesaikan melalui pengadilan yang berwenang di
          Indonesia.
        </Text>
      </LegalSection>

      <LegalSection title="11. Hubungi kami">
        <Text lineHeight="tall">
          Pertanyaan soal syarat ini bisa dikirim ke{" "}
          <Link href={`mailto:${COMPANY.email}`} textDecoration="underline">
            {COMPANY.email}
          </Link>
          . Kontak lengkap ada di{" "}
          <Link href="/contact" textDecoration="underline">
            halaman Kontak
          </Link>
          .
        </Text>
      </LegalSection>
    </LegalPage>
  );
}
