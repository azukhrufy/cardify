import { Link, Text } from "@chakra-ui/react";

import LegalPage, { LegalList, LegalSection } from "@/components/LegalPage";
import HomeLayout from "@/Layouts/HomePageLayout";
import { COMPANY, OPERATOR_NAME } from "@/constants/company";

Refund.getLayout = function getLayout(page) {
  return <HomeLayout>{page}</HomeLayout>;
};

export default function Refund() {
  return (
    <LegalPage
      title="Kebijakan Refund"
      path="/refund"
      updatedAt="1 Oktober 2026"
      description="Prosedur pengembalian dana langganan Cardify: kebijakan penjualan final, pembatalan perpanjangan, dan pengembalian dana atas kegagalan layanan."
    >
      <LegalSection title="1. Ruang lingkup">
        <Text lineHeight="tall">
          Kebijakan ini berlaku untuk pembayaran langganan Cardify.{" "}
          <b>Versi gratis tidak menghasilkan transaksi apa pun</b>, jadi tidak ada
          yang perlu dikembalikan darinya.
        </Text>
        <Text lineHeight="tall">
          Versi berbayar belum dibuka. Kebijakan ini sudah berlaku sejak sekarang
          supaya aturannya jelas sebelum uang pertama masuk, bukan sesudahnya.
        </Text>
      </LegalSection>

      <LegalSection title="2. Semua penjualan bersifat final">
        <Text lineHeight="tall">
          Kami tidak memberikan pengembalian dana dan tidak menerima pembatalan
          pembelian. Karena itu, pastikan dulu kamu memang mau berlangganan
          sebelum membayar.
        </Text>
        <Text lineHeight="tall">
          Alasannya sederhana: aksesnya diberikan seketika dan tidak bisa ditarik
          kembali. Begitu kamu bisa memakai fitur berbayarnya, biaya
          penyediaannya sudah keluar di sisi kami.
        </Text>
      </LegalSection>

      <LegalSection title="3. Yang tidak termasuk penolakan refund">
        <Text lineHeight="tall">
          Ada hal-hal yang bukan soal berubah pikiran, dan untuk yang ini kami
          wajib mengembalikan dananya:
        </Text>
        <LegalList>
          <li>kamu membayar tapi tidak pernah mendapat akses ke fitur berbayar;</li>
          <li>kamu ditagih dua kali untuk periode yang sama;</li>
          <li>
            kamu ditagih setelah membatalkan langganan dan pembatalannya sudah
            kami terima;
          </li>
          <li>kamu ditagih sejumlah yang berbeda dari harga yang ditampilkan.</li>
        </LegalList>
        <Text lineHeight="tall">
          Ini bukan permintaan refund yang kami tolak — ini kesalahan kami, dan
          mengembalikannya bukan diskresi melainkan kewajiban. Kebijakan
          &ldquo;tanpa refund&rdquo; di bagian 2 berlaku untuk berubah pikiran,
          bukan untuk kegagalan layanan.
        </Text>
      </LegalSection>

      <LegalSection title="4. Berhenti berlangganan">
        <Text lineHeight="tall">
          Langganan berjalan per periode dan diperpanjang otomatis. Kamu bisa
          berhenti kapan saja dari halaman pengaturan langganan atau dengan
          mengirim email ke kami.
        </Text>
        <Text lineHeight="tall">
          Berhenti berlangganan menghentikan tagihan{" "}
          <b>periode berikutnya</b>. Akses berbayar tetap terbuka sampai akhir
          periode yang sudah kamu bayar — dan karena periode itu sudah dibayar
          dan terpakai, biayanya tidak dikembalikan.
        </Text>
        <Text lineHeight="tall">
          Kami sarankan berhenti minimal 3 hari sebelum tanggal perpanjangan,
          supaya pembatalannya sempat kami proses.
        </Text>
      </LegalSection>

      <LegalSection title="5. Cara mengajukan">
        <Text lineHeight="tall">
          Kirim email ke{" "}
          <Link href={`mailto:${COMPANY.email}`} textDecoration="underline">
            {COMPANY.email}
          </Link>{" "}
          dengan subjek <b>&ldquo;Refund&rdquo;</b>, dan sertakan:
        </Text>
        <LegalList>
          <li>email akun yang kamu pakai saat membayar;</li>
          <li>tanggal dan jumlah pembayarannya;</li>
          <li>bukti pembayaran atau ID transaksinya;</li>
          <li>apa yang salah — misalnya akses tidak pernah terbuka.</li>
        </LegalList>
        <Text lineHeight="tall">
          Kami balas dalam 5 hari kerja, dan dana yang memang menjadi hakmu
          dikembalikan ke metode pembayaran asalnya dalam 14 hari kerja sejak
          disetujui. Lama dana sampai di rekeningmu bisa berbeda tergantung bank
          atau penyedia pembayaran.
        </Text>
      </LegalSection>

      <LegalSection title="6. Perubahan kebijakan ini">
        <Text lineHeight="tall">
          Kami bisa memperbarui kebijakan ini. Perubahan tidak berlaku surut ke
          pembelian yang sudah terjadi — pembelian itu tetap mengikuti kebijakan
          yang berlaku saat kamu membayar.
        </Text>
      </LegalSection>

      <LegalSection title="7. Hubungi kami">
        <Text lineHeight="tall">
          Pertanyaan soal kebijakan ini bisa dikirim ke{" "}
          <Link href={`mailto:${COMPANY.email}`} textDecoration="underline">
            {COMPANY.email}
          </Link>
          . Kontak lengkap ada di{" "}
          <Link href="/contact" textDecoration="underline">
            halaman Kontak
          </Link>
          .
        </Text>
        <Text lineHeight="tall">
          Kebijakan ini bagian dari{" "}
          <Link href="/terms" textDecoration="underline">
            Syarat &amp; Ketentuan
          </Link>{" "}
          {OPERATOR_NAME}.
        </Text>
      </LegalSection>
    </LegalPage>
  );
}
