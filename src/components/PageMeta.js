// next
import Head from "next/head";

// ----------------------------------------------------------------------

/**
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {ReactNode} [props.other]
 * @returns {JSX.Element}
 */
export default function PageMeta({ title, description, other }) {
  return (
    <Head>
      <title>{title ? `${title} | Cardify` : "Cardify"}</title>

      {description && <meta name="description" content={description} />}

      {other}
    </Head>
  );
}
