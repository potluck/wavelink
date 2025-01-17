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
interface Game {
  id: number;
  other_player: string;
}

export default function Share({ player1, gamesToRespondTo, userId1 }: { player1: string, gamesToRespondTo: Game[], userId1: number }) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [userId, setUserId] = useState<number>(userId1);
  const [allGameIDsToRespondTo, setAllGameIDsToRespondTo] = useState<number[]>(gamesToRespondTo.map((game: Game) => game.id));
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [allGamesToRespondTo, setAllGamesToRespondTo] = useState<Game[]>([]);
  const [showAllGames, setShowAllGames] = useState(false);

  const slug = player1.toLowerCase().replace(/ /g, '-');

  useEffect(() => {
    if (userId1 == 0) {
      callAPIRetrieveUser(slug).then((data) => {
        setUserId(data.rows[0].id);
        console.log("user: ", data);

        callAPIRetrieveAllGamesToRespondTo(data.rows[0].id).then((data) => {
          console.log("games to respond to: ", data);
          setAllGameIDsToRespondTo(data.rows.map((game: Game) => game.id));
        });
      });
    }
  }, [userId1]);


  useEffect(() => {
    if (userId > 0) {
      callAPIRetrieveAllGames(userId).then((data) => {
        console.log("all games: ", data);
        setAllGames(data.rows as Game[]);
      });
    }
  }, [userId]);

  useEffect(() => {
    if (allGames.length > 0 && allGameIDsToRespondTo.length > 0) {
      setAllGamesToRespondTo(allGames.filter((game: Game) => allGameIDsToRespondTo.includes(game.id)));
    }
  }, [allGames, allGameIDsToRespondTo]);


  useEffect(() => {
    setShareUrl(`${window.location.origin}/${player1}/invite`);
  }, [player1]);

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
            value={shareUrl}
            className="flex-1 p-2 border rounded-md bg-gray-50 text-gray-600 min-w-[280px]"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-gray-700">You will be notified here of games where it&apos;s your turn to play.</p>
        {allGamesToRespondTo.length > 0 ?
          (<>
            <p className="text-gray-700"><b>It&apos;s your turn:</b></p>
            {allGamesToRespondTo.map((game) => (
              <div key={game.id}>
                <Link href={`/${player1}/${game.other_player}`} className="text-gray-700 hover:text-blue-500">
                  - With {game.other_player}
                </Link>
              </div>
            ))}
          </>
          ) : null}
        <button
          onClick={() => setShowAllGames(!showAllGames)}
          className="text-gray-700 hover:text-blue-500 flex items-center gap-2"
        >
          {showAllGames ? '▼' : '▶'} All of your games ({allGames.length})
        </button>

        {showAllGames && allGames.length > 0 && (
          <div className="pl-4">
            {allGames.map((game) => (
              <div key={game.id}>
                <Link href={`/${player1}/${game.other_player}`} className="text-gray-700 hover:text-blue-500">
                  Game with {game.other_player}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}