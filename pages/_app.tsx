import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from 'next/head'
import { Analytics } from "@vercel/analytics/react"
import { GameProvider } from '../contexts/GameContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GameProvider>
      <Head>
        <title>Wavelink - a Potluck production</title>
        <meta property="og:site_name" content="Wavelink"></meta>
        <meta property="og:title" content="Wavelink - A word association game"></meta>
        <meta property="og:description" content="Can you match your partner's wave?"></meta>
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </GameProvider>
  );
}
