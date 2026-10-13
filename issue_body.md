## Objective
Menyediakan fleksibilitas bagi kreator untuk mengisi rate card secara instan melalui integrasi data sosial media (auto-fill) untuk **Instagram, TikTok, dan YouTube**, tanpa menghilangkan opsi input manual yang sudah ada.

## Target User
1. Casual/Privacy-first Creators (memilih isi manual).
2. Power Creators / Agency-managed (memilih auto-sync untuk efisiensi).

## Scope & Acceptance Criteria
1. **UI/UX Header Form:** Menambahkan pilihan jelas di atas form utama: **[Isi Manual]** (default) dan **[Hubungkan Akun / Auto-Fill]** untuk Instagram, TikTok, dan YouTube.
2. **Auto-Fill Mechanism:** Ketika user memilih konek sosmed (Instagram, TikTok, atau YouTube), sistem memicu proses fetch data dengan animasi *staged loading* (0% -> 3s -> 2s -> 50% -> 2s -> 100%), lalu mengisi field form menggunakan `methods.setValue()`.
3. **Edit & Review:** Apapun flow yang dipilih, data masuk ke preview state yang sama di mana user tetap bisa melakukan penyesuaian manual (*override*) sebelum mengunduh PDF/Rate Card.
4. **Error Handling & Fallback:** Jika koneksi API sosmed gagal atau tertunda, sistem menampilkan pesan fallback (*toast* / alert) agar user dapat dengan mudah beralih kembali ke Manual Input.
5. **Branch:** Development dilakukan di branch `feat/Connect-Social-Media-Options`.
