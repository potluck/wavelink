import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from 'next/head'
import { Analytics } from "@vercel/analytics/react"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Wavelink - a Pots production</title>
        <meta property="og:site_name" content="Wavelink"></meta>
        <meta property="og:title" content="Wavelink - A word association game"></meta>
        <meta property="og:description" content="Can you match your partner's wave?"></meta>
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
