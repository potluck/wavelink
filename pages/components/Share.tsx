import { Nunito } from 'next/font/google'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const nunito = Nunito({ subsets: ['latin'] })

const callAPIRetrieveAllGamesToRespondTo = async (userId: number) => {
  try {
    const res = await fetch(`/api/retrieve-all-games-to-respond-to/?userId=${userId}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
  }

}

const callAPIRetrieveAllGames = async (userId: number) => {
  try {
    const res = await fetch(`/api/retrieve-all-games/?userId=${userId}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
  }
}


const callAPIRetrieveUser = async (slug: string) => {
  try {
    const res = await fetch(`/api/retrieve-user/?slug=${slug}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
  }
}

// Add interface for game type
export interface GameToRespondTo {
  id: number;
  other_player: string;
  other_player_slug: string;
}

export default function Share({ player1, gamesToRespondTo, userId1 }: { player1: string, gamesToRespondTo: GameToRespondTo[], userId1: number }) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [userId, setUserId] = useState<number>(userId1);
  const [allGameIDsToRespondTo, setAllGameIDsToRespondTo] = useState<number[]>(gamesToRespondTo?.map((game: GameToRespondTo) => game.id) || []);
  const [allGames, setAllGames] = useState<GameToRespondTo[]>([]);
  const [allGamesToRespondTo, setAllGamesToRespondTo] = useState<GameToRespondTo[]>([]);
  const [showAllGames, setShowAllGames] = useState(false);

  useEffect(() => {
    if (userId1 == 0) {
      const slug = player1?.toLowerCase().replace(/ /g, '-') || "";
      callAPIRetrieveUser(slug).then((data) => {
        setUserId(data.rows[0].id);
        console.log("user: ", data);

        callAPIRetrieveAllGamesToRespondTo(data.rows[0].id).then((data) => {
          console.log("games to respond to: ", data);
          setAllGameIDsToRespondTo(data.rows.map((game: GameToRespondTo) => game.id));
        });
      });
    }
  }, [userId1, player1]);


  useEffect(() => {
    if (userId > 0) {
      callAPIRetrieveAllGames(userId).then((data) => {
        console.log("all games: ", data);
        setAllGames(data.rows as GameToRespondTo[]);
      });
    }
  }, [userId]);

  useEffect(() => {
    if (allGames.length > 0 && allGameIDsToRespondTo.length > 0) {
      setAllGamesToRespondTo(allGames.filter((game: GameToRespondTo) => allGameIDsToRespondTo.includes(game.id)));
    }
  }, [allGames, allGameIDsToRespondTo]);


  useEffect(() => {
    const origin = window.location.origin.replace(/^https?:\/\/(www\.)?/, '');
    setShareUrl(`${origin}/${player1}/invite`);
  }, [player1]);

  return (
    <div className="min-h-screen">
      <div className={`${nunito.className} grid grid-rows-[auto_1fr_auto] items-center justify-items-center p-2 pb-20 gap-6 sm:p-8 max-w-5xl mx-auto w-full`}>
        <h1 className="text-4xl font-bold text-center w-full dark:text-white">Wavelink &nbsp;&nbsp;🌊&thinsp;🔗</h1>
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">Hi, {player1}!</p>
          <p className="text-gray-700 dark:text-gray-300">Send your invite link to a friend to play:</p>
          <div className="flex gap-2 items-center w-full max-w-xl">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 p-2 border rounded-md bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 min-w-[280px]"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-gray-700 dark:text-gray-300">You will be notified here of games where it&apos;s your turn to play.</p>
          {allGamesToRespondTo.length > 0 ?
            (<>
              <p className="text-gray-700 dark:text-gray-300"><b>It&apos;s your turn:</b></p>
              {allGamesToRespondTo.map((game) => (
                <div key={game.id}>
                  <Link href={`/${player1}/${game.other_player_slug}`} className="text-gray-700 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400">
                    - With {game.other_player}
                  </Link>
                </div>
              ))}
            </>
            ) : null}
          <button
            onClick={() => setShowAllGames(!showAllGames)}
            className="text-gray-700 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 flex items-center gap-2"
          >
            {showAllGames ? '▼' : '▶'} All of your games ({allGames.length})
          </button>

          {showAllGames && allGames.length > 0 && (
            <div className="pl-4">
              {allGames.map((game) => (
                <div key={game.id}>
                  <Link href={`/${player1}/${game.other_player_slug}`} className="text-gray-700 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400">
                    Game with {game.other_player}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}