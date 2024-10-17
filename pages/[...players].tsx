import { useRouter } from 'next/router'

export default function Page() {
  const router = useRouter();
  const players = !Array.isArray(router.query.players)? (router.query.players? [router.query.players] : []): router.query.players;
  const player1 = players.length > 0 ? players[0] : "No player set";
  const player2 = players.length > 1 ? players[1] : "No opponent set";

  return  <div>
    <p>
    Welcome: {player1}
    </p>
    <p>Your opponent is: {player2}</p>
  </div>
}
