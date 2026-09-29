/**
 * Rasterisasi subtree DOM jadi PDF A4 berhalaman, lalu pasang ulang link yang
 * hilang karena rasterisasi.
 *
 * html2canvas menggambar piksel, jadi <a href> di dalam elemen yang di-capture
 * ikut jadi bitmap dan mati di PDF. Karena itu kotak tiap link diukur saat
 * capture, lalu dibuat ulang lewat `doc.link(x, y, w, h, { url })` milik jsPDF —
 * hasilnya anotasi /Subtype /Link /A << /S /URI >> yang benar-benar bisa diklik.
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

/** Piksel device per piksel CSS. 2 → blok 1248 CSS px jadi 2496 px / 190 mm ≈ 334 dpi. */
const DEFAULT_SCALE = 2;
/** Chrome/Safari mulai bermasalah di atas ~16k px per sisi; ambil batas aman. */
const MAX_CANVAS_DIM = 8192;
/** Kotak link yang lebih pendek dari ini tidak andal diklik, jadi dijangkar ulang. */
const MIN_CLICKABLE_MM = 4;
const PDF_IMAGE_FORMAT = "JPEG";

/** Windows menolak membuat file dengan nama ini, dengan ekstensi apa pun. */
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

// Clamp yang tidak bisa terbalik walau max < min (mis. lebar link > lebar konten).
const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), Math.max(min, max));

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
 * @returns {Promise<{pageCount: number, canvasWidth: number, canvasHeight: number, links: string[]}>}
 */
export async function exportElementToPdf(element, options = {}) {
  const {
    filename = "rate-card.pdf",
    linkSelectors = [],
    signal,
    scale = DEFAULT_SCALE,
  } = options;

  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("exportElementToPdf can only run in the browser.");
  }
  if (!element) throw new Error("exportElementToPdf: no element to capture.");

  // 1. Ukur dulu, selagi layout aslinya dijamin belum tersentuh.
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    throw new Error("exportElementToPdf: element is not visible.");
  }
  const mmPerCssPx = CONTENT_WIDTH_MM / rect.width;
  const links = measureLinks(element, rect, mmPerCssPx, linkSelectors);

  // 2. Baru sekarang tarik dua library beratnya. Kalau di-import statis, ~800 KB
  //    JS masuk bundle halaman (dan build node jspdf ikut bundle SSR).
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);
  throwIfAborted(signal);

  // 3. Rasterisasi.
  if (document.fonts?.ready) await document.fonts.ready;

  // Batasi scale supaya tidak ada dimensi canvas yang melewati batas aman —
  // konten sangat tinggi harus jadi lebih banyak halaman, bukan canvas raksasa.
  const safeScale = Math.max(
    1,
    Math.min(scale, MAX_CANVAS_DIM / Math.max(rect.width, rect.height)),
  );

  const canvas = await html2canvas(element, {
    scale: safeScale,
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
  });
  throwIfAborted(signal);

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
    links: links.map((link) => link.url),
  };
}
