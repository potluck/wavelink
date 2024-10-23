import { useRouter } from 'next/router'
import React, { useEffect } from 'react';
import GameState, { Round } from './components/GameState';

export enum PlayerState {
  NeedTeammate,
  NoRound,
  RoundToPlay,
  Playing,
  Waiting
}

// const callAPICreateOrRetrieveUser = async (userName: string) => {
//   try {
//     const res = await fetch(`/api/create-user/?user=${userName}`);
//     const data = await res.json();
//     console.log(data);
//   } catch (err) {
//     console.log(err);
//   }
// }

// const callAPICreateOrRetrieveGame = async (userName: string) => {
//   try {
//     const res = await fetch(`/api/create-or-retrieve-game/?user=${userName}`);
//     const data = await res.json();
//     console.log(data);
//   } catch (err) {
//     console.log(err);
//   }
// }

const callAPIRetrieveRounds = async () => {
  try {
    const gameId = 1;
    const res = await fetch(`/api/retrieve-rounds/?gameId=${gameId}`);
    const data = await res.json();
    // console.log("rounds: ", data);
    return data;
  } catch (err) {
    console.log(err);
  }
}

const callAPISubmitAnswer = async (roundId: number, submission: string, thisPlayerHasLowerID: boolean, completed: boolean) => {
  try {
    const res = await fetch(`/api/submit-answer/?roundId=${roundId}&&submission=${submission}&thisLower=${thisPlayerHasLowerID}&completed=${completed}`);
    const data = await res.json();
    // console.log("rounds: ", data);
    return data;
  } catch (err) {
    console.log(err);
  }
}


const processRounds = (rounds : Round[]) : {prevRounds: Round[], currRound: Round | null} => {
  // console.log("processing pots! ", rounds);
  const prevRounds : Round[] = [];
  let currRound = null;
  for (const round of rounds) {
    if (round.completed_at == null) {
      currRound = round;
    } else {
      prevRounds.push(round);
    }
  }

  return {prevRounds, currRound};
}

export default function Page() {
  const router = useRouter();
  // console.log("hi pots. players: ", router.query.players);

  const players = !Array.isArray(router.query.players)? (router.query.players? [router.query.players] : []): router.query.players;

  const player1 = players[0];
  const player2 = players.length > 1 ? players[1] : "No teammate set";

  // TODO: if only 1 player here:
  //  is this user the first player? (via auth, cache)
  //  if not: Potluck has invited you to play Wavelink. What's your name?
  //  redirect / add to URL

  // TODO: make sure player2 is a real player

  // TODO: figure this out after retrieving players
  const thisPlayerHasLowerID : boolean = (player1 == "summer");

  const [playerState, setPlayerState] = React.useState(PlayerState.NeedTeammate);

  const [previousRounds, setPreviousRounds] = React.useState<Round[]>([]);
  const [currentRound, setCurrentRound] = React.useState<Round | null>(null);

  if (playerState == PlayerState.NeedTeammate && players.length > 1) {
    // TODO: clean this up
    setPlayerState(PlayerState.NoRound);
  }

  // TODO: get game for users
    // if no game for these users, create game

    useEffect(() => {
      callAPIRetrieveRounds()
        .then((rounds) => {
          const {prevRounds, currRound} = processRounds(rounds.rows);
          setPreviousRounds(prevRounds);
          setCurrentRound(currRound);

          if (currRound !== null) {
            if ((thisPlayerHasLowerID && !!(currRound?.link1)) || (!thisPlayerHasLowerID && !!currRound.link2)) {
              setPlayerState(PlayerState.Waiting);
              console.log("Waiting");
            } else {
              setPlayerState(PlayerState.RoundToPlay);
            }
          } else {
            setPlayerState(PlayerState.NoRound);
          }

        })}, [router.query.players, thisPlayerHasLowerID]);



  function startTurn() {
    if (playerState == PlayerState.NoRound) {
      // TODO: if NoRound, then create a new round
      setPlayerState(PlayerState.Playing);
    } else if (playerState == PlayerState.RoundToPlay) {
      setPlayerState(PlayerState.Playing);
    }
  }

  function submitAnswer(submission : string) {
    // console.log(submission);
    let completed = false;
    if ((thisPlayerHasLowerID && !!currentRound?.link2) || (!thisPlayerHasLowerID && !!currentRound?.link1)) {
      completed = true;
    }
    callAPISubmitAnswer(currentRound?.id || 0, submission, thisPlayerHasLowerID, completed)
      .then(() => {
        if (completed) {
          // TODO - get the score. Show the score.
          setPlayerState(PlayerState.NoRound);
        } else {
          setPlayerState(PlayerState.Waiting);
        }
      })
  }

    // callAPICreateUser(player1);

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
            previousRounds={previousRounds}
            currentRound={currentRound}
            submitAnswer={submitAnswer}
        />

    </ul>
    </main>
  </div>
  );
}
