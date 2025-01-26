import { Nunito } from 'next/font/google'
import Link from "next/link";
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const nunito = Nunito({ subsets: ['latin'] })

const getUserFromLocalStorage = () => {
  const userId = localStorage.getItem('wavelink-userId');
  const userSlug = localStorage.getItem('wavelink-userSlug');
  return {
    userId: userId ? parseInt(userId) : null,
    userSlug: userSlug
  };
}


export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const localUser = getUserFromLocalStorage();
    if (localUser.userId) {
      router.push(`/${localUser.userSlug}`);
      return;
    }
  }, [router.isReady, router]);


  return (
    <div
      className={`${nunito.className} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 dark:bg-gray-900 dark:text-white`}
    >
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-center w-full dark:text-white">Wavelink &nbsp;&nbsp;🌊&thinsp;🔗</h1>
        <ul className="list-inside text-base sm:text-base text-center sm:text-left dark:text-gray-300">
          <li>Hey! You&apos;ve reached the homepage for Wavelink. This game is in the Beta phase of development.</li>
          <br />
          <li>You can start a game with Potluck by clicking the button below!</li>
        </ul>
        <Link href="/potluck/invite" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-800">
          Start a game with Potluck
        </Link>
      </main>
      <footer className="row-start-3 text-base">
        <Link href="/help" className="text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300">How to play</Link>
      </footer>
    </div>
  );
}
