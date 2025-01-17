import { Nunito } from 'next/font/google'
import { useState } from 'react';
import { useRouter } from 'next/router';
import Explainer from './Explainer';

const nunito = Nunito({ subsets: ['latin'] })

// create user via API
async function callAPICreateUser(userName: string) {
  const response = await fetch(`/api/create-user?userName=${encodeURIComponent(userName)}`);
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  return response.json();
}

// TODO: If we have the user in the cookie, tell them that.


export default function Invited({ player1 }: { player1: string }) {
  const [name, setName] = useState("");
  const router = useRouter();
  const [showExplainer, setShowExplainer] = useState(false);
  return (
    <div className={`${nunito.className} grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-2 pb-20 gap-6 sm:p-8`}>
      <h1 className="text-4xl font-bold text-center max-w-md">Wavelink &nbsp;&nbsp;🌊&thinsp;🔗</h1>
      <div className="space-y-4">
        <p className="text-gray-700">Hi there, welcome to Wavelink!</p>
        <p className="text-gray-700">You&apos;ve been invited to play with {player1}!</p>
        <p className="text-gray-700">Enter your name below to play.</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          const slug = name.replace(/ /g, '-');
          callAPICreateUser(name).then(() => {
            router.push(`/${slug}/${player1}`);
          }).catch((err) => {
            console.error("error creating user: ", err);
          });
        }} className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="w-full px-6 py-2 text-lg font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Play
          </button>
        </form>
        <div className="mt-4">
          <button
            className="text-blue-500 hover:text-blue-700 underline cursor-pointer flex items-center gap-1"
            onClick={() => setShowExplainer(!showExplainer)}>How to play</button>
          <div className="max-w-md">
            {showExplainer && <Explainer />}
          </div>
        </div>
      </div>
    </div>
  );
}