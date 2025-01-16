import { Nunito } from 'next/font/google'

const nunito = Nunito({ subsets: ['latin'] })

export default function Share({ player1 }: { player1: string }) {
  return (
    <div className={`${nunito.className} grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-2 pb-20 gap-6 sm:p-8`}>
        <h1 className="text-4xl font-bold text-center w-full">Wavelink &nbsp;&nbsp;🌊&thinsp;🔗</h1>
        <div className="space-y-4">
          <p className="text-gray-700">Hi, {player1}!</p>
          <p className="text-gray-700">TODO: Grab all your opponents</p>
          <p className="text-gray-700">Send your link to a friend to play.</p>
          <p className="text-gray-700">TODO: Play against the AI</p>
      </div>
    </div>
  );  
}