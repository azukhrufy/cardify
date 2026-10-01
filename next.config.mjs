/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Tidak ada alasan sah untuk halaman ini di-embed di situs lain, dan
          // clickjacking adalah risiko yang bisa langsung dimonetisasi di situs
          // beriklan. Dikirim dua-duanya: `frame-ancestors` untuk browser
          // modern, X-Frame-Options untuk yang belum mendukungnya.
          //
          // Sengaja TIDAK ada `script-src` / `connect-src` di sini. Skrip iklan
          // Monetag di-inject saat runtime dari host yang berotasi dan memakai
          // eval, jadi allowlist yang ketat akan mematahkannya. Tiga direktif di
          // bawah ini tidak bertabrakan dengan apa pun: `object-src` menutup
          // <object>/<embed> (jalur XSS lama, tidak dipakai iklan modern),
          // `base-uri` memblokir <base> yang disuntikkan, dan `frame-ancestors`
          // menutup clickjacking.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Tanpa `includeSubDomains`: kalau nanti zona push Monetag dipindah ke
          // subdomain sendiri, subdomain itu harus benar-benar siap HTTPS dulu
          // atau HSTS akan menguncinya keluar.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
