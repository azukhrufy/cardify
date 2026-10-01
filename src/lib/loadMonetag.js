// lib/loadMonetag.js
export function loadMonetagScript() {
  // Pastikan kode hanya berjalan di sisi client
  if (typeof window === "undefined") return;

  // Cek apakah script sudah pernah dimuat untuk menghindari duplikasi
  if (document.querySelector('script[data-zone="11930901"]')) {
    console.log("Script Monetag sudah dimuat.");
    return;
  }

  const script = document.createElement("script");
  script.dataset.zone = "11930901";
  script.src = "https://n6wxm.com/vignette.min.js";
  script.async = true; // Praktik yang baik untuk script pihak ketiga

  // Tambahkan script ke body
  document.body.appendChild(script);
}

const MONETAG_SCRIPT_SRC = "https://5gvci.com/act/files/tag.min.js?z=11930912";

export function loadMonetagPushNotification() {
  // Pastikan hanya jalan di browser
  if (typeof window === "undefined") return;

  // Cegah duplikasi — cek berdasarkan src
  if (document.querySelector(`script[src="${MONETAG_SCRIPT_SRC}"]`)) {
    console.log("[Monetag] Script sudah dimuat, skip.");
    return;
  }

  const script = document.createElement("script");
  script.src = MONETAG_SCRIPT_SRC;
  script.async = true;
  script.setAttribute("data-cfasync", "false"); // sesuai atribut di snippet asli

  document.body.appendChild(script);

  console.log("[Monetag] Script dimuat.");
}

//<script>(function(s){s.dataset.zone='11930901',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
