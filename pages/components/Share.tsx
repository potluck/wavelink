import { Nunito } from 'next/font/google'
import { useState } from 'react'

const nunito = Nunito({ subsets: ['latin'] })

export default function Share({ player1 }: { player1: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className={`${nunito.className} grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-2 pb-20 gap-6 sm:p-8 max-w-5xl mx-auto w-full`}>
      <h1 className="text-4xl font-bold text-center w-full">Wavelink &nbsp;&nbsp;🌊&thinsp;🔗</h1>
      <div className="space-y-4">
        <p className="text-gray-700">Hi, {player1}!</p>
        <p className="text-gray-700">Send your link to a friend to play:</p>
        <div className="flex gap-2 items-center w-full max-w-xl">
          <input
            type="text"
            readOnly
            value={`${window.location.origin}/${player1}/invite`}
            className="flex-1 p-2 border rounded-md bg-gray-50 text-gray-600 min-w-[280px]"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/${player1}/invite`);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-gray-700">You'll be notified here of games where it's your turn to play.</p>
        <p className="text-gray-700">TODO: Grab all your opponents</p>
        <p className="text-gray-700">TODO: Play against the AI</p>
      </div>
    </div>
  );
}