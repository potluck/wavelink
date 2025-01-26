import { Nunito } from 'next/font/google'
import Link from "next/link";

const nunito = Nunito({ subsets: ['latin'] })

export default function Home() {
  return (
    <div
      className={`${nunito.className} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20`}
    >
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <ul className="list-inside text-base sm:text-base text-center sm:text-left">
          <li>Hey! You&apos;ve reached the homepage for Wavelink. This game is in the Beta phase of development.</li>
          <br />
          <li>You can start a game with Potluck by clicking the button below!</li>
        </ul>
        <Link href="/potluck/invite" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Start a game with Potluck
        </Link>
      </main>
      <footer className="row-start-3 text-base">
        <Link href="/help" className="text-blue-600 hover:text-blue-800 underline">How to play</Link>
      </footer>
    </div>
  );
}
