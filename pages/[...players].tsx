import { useRouter } from 'next/router'
import React from 'react';
import GameState from './components/GameState';

export enum PlayerState {
  NeedTeammate,
  NoRound,
  RoundToPlay,
  Playing,
  Waiting
}


export default function Page() {
  const router = useRouter();
  console.log("hi pots", router.query.players);

  const players = !Array.isArray(router.query.players)? (router.query.players? [router.query.players] : []): router.query.players;

  const player1 = players[0];
  const player2 = players.length > 1 ? players[1] : "No teammate set";

  // TODO: if only 1 player here:
  //  is this user the first player? (via auth, cache)
  //  if not: Potluck has invited you to play Wavelink. What's your name?
  //  redirect / add to URL

  // TODO: make sure player2 is a real player

  const [playerState, setPlayerState] = React.useState(PlayerState.NeedTeammate);

  if (playerState == PlayerState.NeedTeammate && players.length > 1) {
    setPlayerState(PlayerState.NoRound);
  }

  // TODO: get game for users
    // if no game for these users, create game


  // TODO: get rounds for game
    // Highlight latest round

  // TODO: Is there an active round? (No time_completed)
    // if I have to play, then set state to RoundToPlay
    // if Waiting, then set state to Waiting
  // If not, set state to NoROund



  const [word1, setWord1] = React.useState("");
  const [word2, setWord2] = React.useState("");

  function startTurn() {
    // TODO: if NoRound, then create a new round
    if (playerState == PlayerState.NoRound) {
      setPlayerState(PlayerState.Playing);
      setWord1("Dog");
      setWord2("Tree");
    }

    // else if RoundToPlay, insert the pair
  }

  function submitAnswer(submission : string) {
    // submit link
    console.log(submission);
    // return - update on this round

    // If other player submitted for this round
    // set state to RoundComplete

    // else set to Waiting
    setPlayerState(PlayerState.Waiting);
  }

  if (players.length == 0) {
    return (
      <div className={`grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}>
        Loading...
      </div>
    );
  }

  if (players.length == 1) {
    return (
      <div className={`grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}>
        Hey {player1}. 
        <br />TODO: Grab all your opponents
        <br />Send your link to a friend to play.
      </div>  
    );
  }

  return  (
  <div className={`grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}>
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
      <ul className="list-inside text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
        <li className="mb-2">
          Welcome: {player1}
        </li>
        <li className="mb-2">
          You&apos;re playing with: {player2}
        </li>

        <GameState
            playerState={playerState}
            startTurn={startTurn}
            word1={word1}
            word2={word2}
            submitAnswer={submitAnswer}
        />

    </ul>
    </main>
  </div>
  );
}
