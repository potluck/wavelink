import { useRouter } from 'next/router'
import React from 'react';
import GameState from './components/GameState';

export enum PlayerState {
  NeedTeammate,
  NoGame,
  GameToPlay,
  Playing,
  Waiting
}


export default function Page() {
  const router = useRouter();
  console.log("hi pots", router.query.players);
  const players = !Array.isArray(router.query.players)? (router.query.players? [router.query.players] : []): router.query.players;
  const player1 = players.length > 0 ? players[0] : "No player set";
  const player2 = players.length > 1 ? players[1] : "No teammate set";

  const [playerState, setPlayerState] = React.useState(PlayerState.NeedTeammate);

  if (playerState == PlayerState.NeedTeammate && players.length > 1) {
    setPlayerState(PlayerState.NoGame);
  }

  // get rounds for pair


  const [word1, setWord1] = React.useState("");
  const [word2, setWord2] = React.useState("");

  function startGame() {
    if (playerState == PlayerState.NoGame) {
      setPlayerState(PlayerState.Playing);
      setWord1("Dog");
      setWord2("Tree");
    }
  }

  function submitAnswer(submission : string) {
    setPlayerState(PlayerState.Waiting);
    console.log(submission);
  }

  return  (
  <div className={`grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}>
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
      <ul className="list-inside text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
        <li className="mb-2">
          Welcome: {player1}
        </li>
        <li className="mb-2">
          You're playing with: {player2}
        </li>

        <GameState
            playerState={playerState}
            startGame={startGame}
            word1={word1}
            word2={word2}
            submitAnswer={submitAnswer}
        />

    </ul>
    </main>
  </div>
  );
}
