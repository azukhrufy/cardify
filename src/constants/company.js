/**
 * Fakta usaha yang dipakai halaman publik — Kontak, Syarat & Ketentuan,
 * Kebijakan Refund, Kebijakan Privasi — dan footer.
 *
 * Satu tempat saja. Jangan tulis ulang alamat email atau nomor telepon di
 * halaman mana pun; kalau berubah, semuanya ikut berubah dari sini.
 *
 * `null` berarti datanya belum ada dan SENGAJA tidak dikarang. Halaman Kontak
 * menampilkannya sebagai penanda yang kelihatan, bukan menghilangkannya
 * diam-diam: nomor telepon atau alamat yang salah lebih buruk daripada yang
 * kosong, dan kalau halaman ini dipakai untuk verifikasi payment gateway, data
 * yang tidak cocok dengan dokumen KYC bikin pendaftarannya ditolak.
 */
export const COMPANY = {
  /** Nama yang dipakai di seluruh situs. */
  name: "Scheld Technologies",

  /**
   * Nama badan hukum, kalau ada (mis. "PT Cardify Digital Indonesia").
   * Biarkan `null` selama layanannya dijalankan perorangan — dokumen legal
   * akan menyebut `name` saja. Isi begitu ada badan hukumnya, karena
   * pelanggan yang mau menggugat perlu tahu siapa yang digugat.
   */
  legalName: null,

  email: "cardifymyid@gmail.com",

  /** TODO: nomor telepon usaha, format +62. */
  phone: '+6285156167218',

  /** TODO: alamat usaha lengkap sesuai dokumen KYC. */
  address:
    "Jl IR H Juanda 495B, Kec. Coblong, Kota Bandung, Jawa Barat, Indonesia",

  siteUrl: "https://cardify.my.id",
};

/** Nama yang muncul di dokumen legal: badan hukum kalau ada, nama situs kalau belum. */
export const OPERATOR_NAME = COMPANY.legalName ?? COMPANY.name;

/** Alamat email sebagai link mailto siap pakai. */
export const CONTACT_MAILTO = `mailto:${COMPANY.email}`;
