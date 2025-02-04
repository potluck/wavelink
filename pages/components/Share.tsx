import { Nunito } from 'next/font/google'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useGameContext } from '../../contexts/GameContext'

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
export interface GameInfo {
  id: number;
  other_player: string;
  other_player_slug: string;
  last_turn_completed_at: string;
}

export default function Share({ player1, userId1 }: { player1: string, userId1: number }) {
  const { gameIDsToRespondTo, setGameIDsToRespondTo } = useGameContext();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [userId, setUserId] = useState<number>(userId1);
  const [userName, setUserName] = useState<string>("");
  const [allGames, setAllGames] = useState<GameInfo[]>([]);
  const [allGamesLastDay, setAllGamesLastDay] = useState<GameInfo[]>([]);
  const [allGamesToRespondTo, setAllGamesToRespondTo] = useState<GameInfo[]>([]);
  const [showAllGames, setShowAllGames] = useState(false);
  const [invalidUser, setInvalidUser] = useState(false);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (userId1 === 0 && !initialFetchDone.current) {
      setShowAllGames(false);
      initialFetchDone.current = true;
      const slug = player1?.toLowerCase().replace(/ /g, '-') || "";
      callAPIRetrieveUser(slug).then((data) => {
        if (!data || !data.rows || data.rows.length === 0) {
          setInvalidUser(true);
        } else {
          setUserId(data.rows[0]?.id || 0);
          setUserName(data.rows[0]?.name || "");
          callAPIRetrieveAllGamesToRespondTo(data.rows[0]?.id).then((data) => {
            setGameIDsToRespondTo(data.rows.map((game: GameInfo) => game.id));
          });
        }
      });
    }
  }, [userId1, player1]);


  useEffect(() => {
    if (userId > 0) {
      callAPIRetrieveAllGames(userId).then((data) => {
        setAllGames(data.rows as GameInfo[]);
        setAllGamesLastDay(data.rows.filter((game: GameInfo) => new Date(game.last_turn_completed_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)));
      });
    }
  }, [userId]);

  useEffect(() => {
    if (allGames.length > 0 && gameIDsToRespondTo.length > 0) {
      setAllGamesToRespondTo(allGames.filter((game: GameInfo) => gameIDsToRespondTo.includes(game.id)));
    }
  }, [allGames, gameIDsToRespondTo]);


  useEffect(() => {
    const origin = window.location.origin.replace(/^(https?:\/\/)www\./, '$1');
    setShareUrl(`${origin}/${player1}/invite`);
  }, [player1]);

  if (invalidUser) {
    return (
      <div className="min-h-screen">
        <div className={`${nunito.className} grid grid-rows-[auto_1fr_auto] items-center justify-items-center p-2 pb-20 gap-6 sm:p-8 max-w-5xl mx-auto w-full`}>
          <h1 className="text-4xl font-bold text-center w-full dark:text-white">Wavelink &nbsp;&nbsp;🌊&thinsp;🔗</h1>
          <div className="space-y-4">
            <p className="text-red-700 dark:text-red-300">It looks like the user ID <b>{player1}</b> is invalid. Please try again with a different name.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className={`${nunito.className} grid grid-rows-[auto_1fr_auto] items-center justify-items-center p-2 pb-20 gap-6 sm:p-8 max-w-5xl mx-auto w-full`}>
        <h1 className="text-4xl font-bold text-center w-full dark:text-white">Wavelink &nbsp;&nbsp;🌊&thinsp;🔗</h1>
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">Hi, {userName || player1}!</p>
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
                  <Link
                    href={`/${player1}/${game.other_player_slug}`}
                    className="text-gray-700 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
                    onClick={() => setShowAllGames(false)}
                  >
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
          {showAllGames && allGamesLastDay.length > 0 && (
            <div className="pl-4">
              <p className="text-gray-700 dark:text-gray-300"><u>Games from the last 24 hours:</u></p>
              {allGamesLastDay.map((game) => (
                <div key={game.id}>
                  <Link
                    href={`/${player1}/${game.other_player_slug}`}
                    className="text-gray-700 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
                    onClick={() => setShowAllGames(false)}
                  >
                    Game with {game.other_player}
                  </Link>
                </div>
              ))}
            </div>
          )}

          {showAllGames && allGames.length > allGamesLastDay.length && (
            <div className="pl-4">
              <p className="text-gray-700 dark:text-gray-300"><u>All other games:</u></p>
              {allGames.filter((game) => !allGamesLastDay.includes(game)).map((game) => (
                <div key={game.id}>
                  <Link
                    href={`/${player1}/${game.other_player_slug}`}
                    className="text-gray-700 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
                    onClick={() => setShowAllGames(false)}
                  >
                    Game with {game.other_player}
                  </Link>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-4 items-center">
            <div className="flex gap-4">
              <Link href={`/${player1}/ai`} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-800 mt-4 inline-block">
                Play with the AI
              </Link>
              <Link href={`/${player1}/potluck`} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-800 mt-4 inline-block">
                Play with Potluck
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}