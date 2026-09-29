/**
 * Rasterisasi subtree DOM jadi PDF A4 berhalaman, lalu pasang ulang link yang
 * hilang karena rasterisasi.
 *
 * html2canvas menggambar piksel, jadi <a href> di dalam elemen yang di-capture
 * ikut jadi bitmap dan mati di PDF. Karena itu kotak tiap link diukur saat
 * capture, lalu dibuat ulang lewat `doc.link(x, y, w, h, { url })` milik jsPDF —
 * hasilnya anotasi /Subtype /Link /A << /S /URI >> yang benar-benar bisa diklik.
 *
 * Capture-nya sengaja dipaksa selebar viewport desktop (lihat
 * DEFAULT_WINDOW_WIDTH), jadi PDF-nya tidak ikut satu kolom hanya karena
 * tombolnya ditekan dari HP. Konsekuensinya pengukuran link TIDAK boleh memakai
 * elemen yang hidup — posisi watermark di layout HP dan di layout desktop jauh
 * berbeda — semuanya diukur ulang di dalam `onclone`, tempat layout yang
 * benar-benar digambar sudah final.
 *
 * Panggil hanya dari event handler — modul ini menyentuh window/document, dan
 * `jspdf` + `html2canvas-pro` sengaja di-import dinamis di dalam fungsi supaya
 * tidak pernah ikut bundle SSR maupun bundle awal halaman.
 */

// A4 portrait dalam milimeter. jsPDF default-nya juga a4/mm/portrait, tapi
// dikirim eksplisit supaya geometri di sini dan dokumennya tidak bisa beda.
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 10;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_MM * 2; // 190
const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - MARGIN_MM * 2; // 277

/** Piksel device per piksel CSS. 2 → blok 1216 CSS px jadi 2432 px / 190 mm ≈ 325 dpi. */
const DEFAULT_SCALE = 2;
/** Chrome/Safari mulai bermasalah di atas ~16k px per sisi; ambil batas aman. */
const MAX_CANVAS_DIM = 8192;
/**
 * Batas LUAS canvas (bukan per sisi). iOS Safari menolak canvas di atas
 * 4096 × 4096 = 16.777.216 px, dan gagalnya diam-diam: `canvas.width`/`height`
 * bisa tetap terbaca sesuai permintaan tapi bitmap-nya kosong — hasil akhirnya
 * PDF putih tanpa error. 16.000.000 dipakai (≈48 MB @4 byte/px) supaya masih ada
 * sisa di bawah tebing WebKit itu, dan batasnya dipakai seragam di semua
 * perangkat supaya PDF yang keluar tidak ikut bergantung device yang menekan
 * tombol unduh.
 *
 * Pada lebar desktop (1216 CSS px) batas ini baru mengikat kalau tinggi blok
 * hasil > ~3.288 CSS px, jadi export normal tidak pernah kehilangan resolusi.
 */
const MAX_CANVAS_PIXELS = 16000000;
/**
 * Lebar viewport iframe clone saat capture, dalam CSS px.
 *
 * Blok hasil diapit DUA `Container maxW="container.xl"` bersarang — satu di
 * CalculatorTabLayout, satu lagi di halaman kalkulator — dan keduanya memakai
 * padding default Chakra `px="4"` (16 px, tidak responsif). Jadi lebar border-box
 * blok hasil berhenti berubah begitu viewport ≥ 1280 px dan tinggal 1216 px
 * (1280 − 4 × 16). Di bawah itu lebarnya ikut layar dan breakpoint `md`
 * (48em = 768 px) tidak aktif, jadi grid 2/3 kolom menumpuk satu kolom.
 *
 * 1366 dipilih, bukan 1280 pas, supaya viewport efektifnya tidak duduk persis di
 * diskontinuitas 1280, dan tetap di atas breakpoint `xl` Chakra (80em = 1280 px)
 * sehingga varian `xl` — kalau nanti dipakai di blok hasil — ikut aktif persis
 * seperti di laptop biasa.
 *
 * `windowWidth: null` berarti "jangan dipaksa": html2canvas memakai lebar layar
 * asli lagi (perilaku HP), dan helper ini tetap benar karena pengukuran link
 * memang selalu dari clone.
 */
const DEFAULT_WINDOW_WIDTH = 1366;
/**
 * Tinggi viewport iframe clone. Tidak ada satu pun elemen DI DALAM subtree yang
 * di-capture memakai satuan `vh` (ancestor yang memakainya tidak masuk geometri
 * blok), jadi angka ini tidak menggeser layout hasil. Dipilih setinggi viewport
 * laptop supaya `minH="100vh"` di ancestor tidak lebih pendek daripada di layar.
 */
const DEFAULT_WINDOW_HEIGHT = 900;
/** Kotak link yang lebih pendek dari ini tidak andal diklik, jadi dijangkar ulang. */
const MIN_CLICKABLE_MM = 4;
const PDF_IMAGE_FORMAT = "JPEG";

/** Windows menolak membuat file dengan nama ini, dengan ekstensi apa pun. */
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

// Clamp yang tidak bisa terbalik walau max < min (mis. lebar link > lebar konten).
const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Scale terbesar yang masih muat di batas canvas untuk ukuran CSS tertentu.
 * Dipakai dua kali dengan dua sumber ukuran: rect elemen yang hidup (jaring
 * pengaman, satu-satunya yang tersedia sebelum clone ada) dan rect elemen hasil
 * clone (ukuran pasti yang akan digambar).
 *
 * Selalu ≥ 1: konten yang terlalu tinggi harus jadi lebih banyak halaman, bukan
 * gambar yang diperkecil. Batas per sisi saja tidak cukup — 8192 × 8192 = 67M px
 * masih lolos — jadi batas luas ikut dihitung.
 */
const safeScaleFor = (cssWidth, cssHeight, requestedScale) => {
  const area = Math.max(cssWidth * cssHeight, 1);
  return Math.max(
    1,
    Math.min(
      requestedScale,
      MAX_CANVAS_DIM / Math.max(cssWidth, cssHeight),
      Math.sqrt(MAX_CANVAS_PIXELS / area),
    ),
  );
};

/**
 * Bikin string masukan user aman dipakai sebagai nama file unduhan.
 * Buang karakter yang ditolak Windows/macOS, karakter kontrol, dan titik/spasi
 * di ujung (Windows diam-diam membuangnya, jadi nama filenya tidak sesuai).
 *
 * '@' di depan TIDAK dibuang — legal di semua platform dan user memang menulis
 * handle-nya seperti itu.
 */
export function sanitizePdfFilename(rawName) {
  const cleaned = String(rawName ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60)
    .replace(/[. ]+$/, "");

  if (!cleaned) return "";
  return WINDOWS_RESERVED_NAMES.test(cleaned) ? `_${cleaned}` : cleaned;
}

/** URL absolut sebuah <a>; fallback ke atribut mentah untuk elemen aneh. */
const readHref = (node) => {
  const resolved = node.href;
  if (typeof resolved === "string" && resolved) return resolved;
  return node.getAttribute("href") || "";
};

/**
 * Ukur target link SEBELUM capture, dalam satu blok sinkron.
 *
 * getBoundingClientRect itu relatif viewport, tapi semua koordinat di sini
 * dihitung sebagai selisih terhadap rect elemen yang di-capture — jadi posisi
 * scroll (dan scroll yang terjadi selama capture yang butuh beberapa detik)
 * saling menghapus, begitu juga border 1 px karena keduanya border-box.
 */
const measureLinks = (element, elementRect, mmPerCssPx, selectors) =>
  selectors
    .flatMap((selector) => Array.from(element.querySelectorAll(selector)))
    .map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        url: readHref(node),
        xMm: (rect.left - elementRect.left) * mmPerCssPx,
        yMm: (rect.top - elementRect.top) * mmPerCssPx,
        wMm: rect.width * mmPerCssPx,
        hMm: rect.height * mmPerCssPx,
      };
    })
    .filter((link) => link.url && link.wMm > 0 && link.hMm > 0);

const throwIfAborted = (signal) => {
  if (signal?.aborted) throw new DOMException("Export aborted", "AbortError");
};

/**
 * @param {HTMLElement} element            elemen yang di-capture (border box-nya)
 * @param {object}      [options]
 * @param {string}      [options.filename] nama file unduhan
 * @param {string[]}    [options.linkSelectors] selector CSS; link di dalam
 *                       `element` yang cocok akan dipasang ulang sebagai
 *                       anotasi PDF yang bisa diklik
 * @param {AbortSignal} [options.signal]   membatalkan render yang sedang jalan
 * @param {number}      [options.scale]    device px per CSS px
 * @param {?number}     [options.windowWidth]  lebar viewport clone dalam CSS px;
 *                       default DEFAULT_WINDOW_WIDTH (layout desktop). `null` =
 *                       ikuti lebar layar asli (layout HP)
 * @param {number}      [options.windowHeight] tinggi viewport clone; lihat
 *                       DEFAULT_WINDOW_HEIGHT
 * @returns {Promise<{pageCount: number, canvasWidth: number, canvasHeight: number, scale: number, cssWidth: number, links: string[]}>}
 */
export async function exportElementToPdf(element, options = {}) {
  const {
    filename = "rate-card.pdf",
    linkSelectors = [],
    signal,
    scale = DEFAULT_SCALE,
    windowWidth = DEFAULT_WINDOW_WIDTH,
    windowHeight = DEFAULT_WINDOW_HEIGHT,
  } = options;

  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("exportElementToPdf can only run in the browser.");
  }
  if (!element) throw new Error("exportElementToPdf: no element to capture.");

  // 1. Cek visibilitas pada elemen yang HIDUP, bukan pada clone: murah, dan
  //    gagal sebelum dua library beratnya keburu diunduh. Geometrinya sendiri
  //    TIDAK diukur di sini — layout final baru ada setelah clone dipaksa
  //    selebar desktop, dan rect elemen yang hidup bisa berasal dari layout yang
  //    sama sekali berbeda (HP: satu kolom).
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    throw new Error("exportElementToPdf: element is not visible.");
  }

  // Jumlah link di layout asli hanya untuk mendeteksi regresi: kalau di dalam
  // clone nanti tidak ketemu satu pun padahal di sini ada, itu bug yang layak
  // diwarnai. Rect-nya tidak diambil — posisinya tidak bisa dipakai untuk
  // layout desktop.
  const liveLinkCount = linkSelectors.reduce(
    (total, selector) => total + element.querySelectorAll(selector).length,
    0,
  );

  // 2. Baru sekarang tarik dua library beratnya. Kalau di-import statis, ~800 KB
  //    JS masuk bundle halaman (dan build node jspdf ikut bundle SSR).
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);
  throwIfAborted(signal);

  // 3. Rasterisasi.
  if (document.fonts?.ready) await document.fonts.ready;

  // Hasil pengukuran dari dalam `onclone`. onclone dijalankan html2canvas lewat
  // `await Promise.resolve().then(...)` — setelah iframe clone ter-layout dan
  // fontnya siap, tapi SEBELUM canvas dibuat — jadi nilai ini pasti sudah
  // terisi begitu await html2canvas di bawah selesai.
  let measuredLinks = [];
  let measuredCssWidth = 0;

  const captureOptions = {
    // Dipaksa, bukan diwarisi dari layar. Dua opsi ini dibaca html2canvas
    // SEBELUM clone dibuat (jadi atribut width/height iframe clone), jadi harus
    // sudah benar sejak awal — menulisnya dari dalam onclone sudah terlambat.
    // Media query Chakra dievaluasi ulang di dalam iframe itu, jadi blok hasil
    // dirender dalam layout desktop walau tombolnya ditekan dari HP.
    windowWidth,
    windowHeight,
    // Batas aman di bawah ini masih dihitung dari rect elemen yang hidup (di HP
    // angkanya lebih kecil dari yang sebenarnya); onclone mengoreksinya dengan
    // ukuran clone yang pasti.
    scale: safeScaleFor(rect.width, rect.height, scale),
    // Wajib opak dan harus warna yang *mendasarinya* (bgInverse #FFFFFF), bukan
    // token elemennya sendiri: surfaceInverse itu rgba(10,10,10,0.02) sehingga
    // hasil kompositnya ≈#FAFAFA di atas putih. `null` bikin canvas transparan,
    // dan JPEG tidak punya alpha — seluruh kartu akan jadi hitam.
    backgroundColor: "#ffffff",
    useCORS: true,
    // Biarkan false: canvas yang ter-taint bikin toDataURL melempar SecurityError.
    allowTaint: false,
    logging: false,
    imageSmoothingQuality: "high",
    signal,
    // Cuma notifikasi — satu gambar gagal tidak boleh menggagalkan seluruh export.
    onError: (error) => console.warn("[exportElementToPdf] resource failed:", error),
    onclone: (_clonedDocument, clonedElement) => {
      // Di sini iframe clone sudah terpasang, ter-layout, dan fontnya sudah
      // dimuat (html2canvas meng-await documentClone.fonts.ready sebelum
      // memanggil callback ini). Jadi getBoundingClientRect di sini
      // mengembalikan geometri final yang memang akan digambar — termasuk efek
      // windowWidth di atas dan satuan `ch` yang sudah resolve ke font asli.
      try {
        const clonedRect = clonedElement.getBoundingClientRect();
        if (clonedRect.width === 0 || clonedRect.height === 0) return;

        // Scale dikoreksi dari geometri yang sebenarnya. html2canvas membaca
        // `scale` saat assembleRenderOptions(), yaitu SETELAH callback ini, dan
        // objek ops ini diteruskan by reference — jadi menulis ulang di sini
        // benar-benar mengubah ukuran canvas. Ini yang penting di HP: ukuran
        // elemen yang hidup (satu kolom, sempit) meremehkan luas canvas
        // sebenarnya sampai ~2,5×.
        const exactScale = safeScaleFor(clonedRect.width, clonedRect.height, scale);
        if (exactScale !== captureOptions.scale) {
          captureOptions.scale = exactScale;
          if (exactScale < scale) {
            console.warn(
              `[exportElementToPdf] scale diturunkan ke ${exactScale.toFixed(2)} supaya canvas tidak melewati batas aman perangkat.`,
            );
          }
        }

        // Lebar clone dilaporkan ke pemanggil lewat return value, jadi diisi
        // walau tidak ada link yang perlu diukur.
        measuredCssWidth = clonedRect.width;

        if (!linkSelectors.length) return;

        // mmPerCssPx dari lebar CLONE, bukan lebar elemen di layar: seluruh
        // lebar canvas (= lebar clone) dipetakan ke CONTENT_WIDTH_MM.
        const clonedMmPerCssPx = CONTENT_WIDTH_MM / clonedRect.width;
        measuredLinks = measureLinks(
          clonedElement,
          clonedRect,
          clonedMmPerCssPx,
          linkSelectors,
        );
      } catch (error) {
        // Pengukuran gagal bukan alasan menggagalkan seluruh export: PDF-nya
        // tetap dibuat, hanya anotasinya yang hilang.
        console.warn("[exportElementToPdf] link measurement failed:", error);
      }
    },
  };

  const canvas = await html2canvas(element, captureOptions);
  throwIfAborted(signal);

  // Kalau ini kena, perangkatnya menolak ukuran canvas yang diminta. Lebih baik
  // gagal terang-terangan daripada menyimpan PDF putih yang kelihatan berhasil.
  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error(
      "exportElementToPdf: canvas kosong — ukuran gambar ditolak oleh perangkat ini.",
    );
  }
  if (liveLinkCount > 0 && !measuredLinks.length) {
    console.warn(
      "[exportElementToPdf] tidak ada link yang cocok di dalam clone; anotasi dilewati.",
    );
  }

  const links = measuredLinks;

  // 4. Tebar bitmapnya ke halaman-halaman A4.
  const pxPerMm = canvas.width / CONTENT_WIDTH_MM;
  const pageHeightPx = CONTENT_HEIGHT_MM * pxPerMm;
  const pageCount = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const slice = document.createElement("canvas");
  const sliceCtx = slice.getContext("2d");

  for (let page = 0; page < pageCount; page += 1) {
    // Bulatkan batas KUMULATIF, bukan tingginya: batas bawah halaman n jadi
    // persis sama dengan batas atas halaman n+1, jadi tidak ada celah 1 px
    // maupun baris yang terduplikasi di sambungan halaman.
    const y0 = Math.round(page * pageHeightPx);
    const y1 = Math.round(Math.min((page + 1) * pageHeightPx, canvas.height));
    const sliceHeightPx = Math.max(1, y1 - y0);
    const sliceHeightMm = sliceHeightPx / pxPerMm;

    slice.width = canvas.width;
    slice.height = sliceHeightPx;
    sliceCtx.fillStyle = "#ffffff";
    sliceCtx.fillRect(0, 0, slice.width, slice.height);
    sliceCtx.drawImage(
      canvas,
      0,
      y0,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx,
    );

    if (page > 0) doc.addPage();
    // Kirim canvas-nya supaya jsPDF men-serialise sendiri (di quality 1.0).
    // JANGAN isi argumen ke-8 dengan angka kualitas — checkCompressValue() cuma
    // menerima "NONE"|"FAST"|"MEDIUM"|"SLOW" dan membuang nilai lain diam-diam.
    doc.addImage(
      slice,
      PDF_IMAGE_FORMAT,
      MARGIN_MM,
      MARGIN_MM,
      CONTENT_WIDTH_MM,
      sliceHeightMm,
    );
  }

  // 5. Pasang ulang link sebagai anotasi asli. doc.link() menulis ke daftar
  //    anotasi halaman AKTIF, jadi pilih halamannya dulu.
  const pageBottomMm = MARGIN_MM + CONTENT_HEIGHT_MM; // 287
  const pageRightMm = MARGIN_MM + CONTENT_WIDTH_MM; // 200

  for (const link of links) {
    // Halaman mana yang memuat band offset-mm elemen ini, persis seperti
    // pemotongan di langkah 4.
    let pageIndex = Math.min(
      Math.floor(link.yMm / CONTENT_HEIGHT_MM),
      pageCount - 1,
    );
    let yMm = MARGIN_MM + (link.yMm - pageIndex * CONTENT_HEIGHT_MM);
    let heightMm = link.hMm;

    if (yMm + heightMm > pageBottomMm) {
      const remaining = pageBottomMm - yMm;
      if (remaining >= MIN_CLICKABLE_MM) {
        // Menyeberangi sambungan halaman: simpan bagian yang memang ada di
        // halaman ini, itu masih benar-benar bisa diklik.
        heightMm = remaining;
        console.warn(
          "[exportElementToPdf] link straddles a page break; the annotation covers the top part only.",
        );
      } else {
        // Terlalu pendek untuk diklik di sini — jangkarkan ke atas halaman berikutnya.
        pageIndex = Math.min(pageIndex + 1, pageCount - 1);
        yMm = MARGIN_MM;
        heightMm = Math.min(link.hMm, CONTENT_HEIGHT_MM);
        console.warn(
          "[exportElementToPdf] link fell on a page break; the annotation moved to the next page.",
        );
      }
    }

    const x = clamp(
      MARGIN_MM + link.xMm,
      MARGIN_MM,
      pageRightMm - link.wMm,
    );
    const y = clamp(yMm, MARGIN_MM, pageBottomMm - heightMm);

    doc.setPage(pageIndex + 1); // halaman jsPDF 1-based
    doc.link(x, y, link.wMm, heightMm, { url: link.url });
  }

  throwIfAborted(signal);
  doc.save(filename); // saveAs bawaan: Blob + <a download>, URL-nya di-revoke sendiri

  return {
    pageCount,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    // Efektif, bukan yang diminta: bisa turun kalau batas canvas mengikat.
    scale: captureOptions.scale,
    // Lebar elemen hasil clone — sumber semua konversi px → mm di atas.
    cssWidth: measuredCssWidth,
    links: links.map((link) => link.url),
  };
}
