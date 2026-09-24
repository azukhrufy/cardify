import Head from "next/head";

export const SITE_NAME = "Cardify";
export const SITE_URL = "https://cardify.my.id";
export const SITE_DESCRIPTION =
  "Cardify mengubah dasbor media sosialmu menjadi rate card yang serius dipertimbangkan brand. Gratis, tanpa daftar. Hitung tarif TikTok, YouTube, dan Instagram-mu dalam hitungan menit.";

const DEFAULT_TITLE =
  "Cardify — Kalkulator Rate Card Influencer Gratis untuk TikTok, YouTube & Instagram";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Kalkulator rate card gratis untuk influencer. Unggah dasbor media sosialmu dan dapatkan tarif berbasis data untuk TikTok, YouTube, dan Instagram.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
};

/**
 * Renders the single <Head> block for a page plus the WebApplication JSON-LD.
 * Pass `title` for any route other than the landing page — it renders as
 * "<title> | Cardify" (Pages Router has no metadata title template).
 *
 * Docs: node_modules/next/dist/docs/02-pages/04-api-reference/01-components/head.md
 * — title/meta must be direct children of <Head>.
 *
 * The JSON-LD is inlined into <Head> rather than rendered through next/script:
 * `strategy="afterInteractive"` (the default) injects it on the client, so it
 * would be absent from the server-rendered HTML that crawlers read, and
 * `beforeInteractive` is only allowed inside pages/_document.js.
 */
export default function Seo({ title, description = SITE_DESCRIPTION, path = "/" }) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonical = `${SITE_URL}${path}`;
  const ogImage = `${SITE_URL}/og-image.png`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />

        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </Head>
    </>
  );
}
