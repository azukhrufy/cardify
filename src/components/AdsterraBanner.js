// components/AdsterraBanner.js

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Box } from "@chakra-ui/react";

import {
  getAdTermsServerSnapshot,
  getAdTermsSnapshot,
  subscribeToAdTerms,
} from "@/lib/adTerms";

// Kode unit dari dashboard Adsterra (Native Banner). Keduanya sepasang: skrip
// ini mencari elemen ber-id container di bawah saat dijalankan, jadi jangan
// ganti salah satunya sendirian. Satu unit dipakai bertiga oleh halaman
// tiktok, instagram, dan youtube — aman karena hanya satu halaman yang hidup
// pada satu waktu.
const ADSTERRA_SRC =
  "https://pl31606090.profitableratecpmnetwork.com/c8ca14154205c848df1e298dfb53928b/invoke.js";
const ADSTERRA_CONTAINER_ID =
  "container-c8ca14154205c848df1e298dfb53928b";

// Lebar container yang menentukan komposisinya: Adsterra menaruh sebanyak apa
// unit native yang muat dalam satu baris, jadi di mobile disempitkan (~1 unit
// per baris) dan di desktop dilebarkan sampai 728px (~4 unit per baris).
// Bukan ukuran tetap: tingginya mengikuti kreatif yang dikirim jaringan.
const SLOT_MAX_W = { base: "340px", md: "728px" };

/**
 * Banner display Adsterra di halaman kalkulator.
 *
 * Gerbang syarat penggunaan sama dengan Monetag: skrip pihak ketiga baru
 * dimuat setelah user menekan tombol di `AdTermsBanner`. Halaman privacy
 * menyebut hal itu sebagai janji, jadi banner ini tidak boleh dimuat lebih
 * awal — dan memang tidak: sebelum diterima, komponen ini tidak merender
 * container apa pun.
 *
 * Skripnya disuntik manual di dalam effect, bukan ditulis sebagai `<script>`
 * di JSX. Dua alasannya:
 *
 * 1. React 19 menaikkan `<script async src>` ke `<head>` dan mendedupe
 *    berdasarkan `src`. Skrip iklan macam ini mencari containernya saat
 *    dieksekusi, jadi urutan itu tidak bisa dijamin.
 * 2. Dedupe `src` yang sama bikin mount kedua (pindah tab kalkulator lewat
 *    navigasi klien) tidak pernah menjalankan ulang skripnya — container baru
 *    tetap kosong. Node script yang dibuat manual di sini dihapus lagi saat
 *    unmount, sehingga setiap mount dapat eksekusi baru.
 */
export default function AdsterraBanner() {
  // Snapshot server selalu `null` ("belum menerima"), sama seperti banner
  // syaratnya — jadi HTML statis tidak memuat markup iklan dan tidak ada
  // markup yang berbeda antara server dan klien.
  const acceptedAt = useSyncExternalStore(
    subscribeToAdTerms,
    getAdTermsSnapshot,
    getAdTermsServerSnapshot,
  );
  const accepted = acceptedAt !== null;

  const containerRef = useRef(null);

  useEffect(() => {
    if (!accepted) return;
    // Container sudah ter-commit sebelum effect jalan, jadi skripnya selalu
    // menemukan targetnya. Kalau tidak ada, jangan muat skrip sama sekali.
    if (!containerRef.current) return;

    const script = document.createElement("script");
    // Urutan atribut mengikuti snippet Adsterra; `src` di-assign terakhir
    // supaya request-nya tidak jalan sebelum atribut lain siap.
    script.setAttribute("async", "async");
    script.setAttribute("data-cfasync", "false");
    script.src = ADSTERRA_SRC;

    document.body.appendChild(script);

    // Node dibuang saat unmount; hasil render iklannya ada di dalam container
    // kita, jadi ikut hilang bersama anak komponen ini.
    return () => {
      script.remove();
    };
  }, [accepted]);

  if (!accepted) return null;

  return (
    <Box maxW={SLOT_MAX_W} mx="auto" w="100%">
      <Box ref={containerRef} id={ADSTERRA_CONTAINER_ID} />
    </Box>
  );
}
