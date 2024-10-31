import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Wavelink - a Pots production</title>
        <meta property="og:site_name" content="Wavelink"></meta>
        <meta property="og:title" content="A game of connections"></meta>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
