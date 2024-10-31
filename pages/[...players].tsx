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

const callAPICreateOrRetrieveGame = async (userName1: string, userName2: string) => {
  try {
    const res = await fetch(`/api/create-or-retrieve-game/?userName1=${userName1}&userName2=${userName2}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
  }
}

const callAPICreateRound = async (gameId: number, thisLower: boolean) => {
  try {
    const res = await fetch(`/api/create-new-round/?gameId=${gameId}&thisLower=${thisLower}`);
    const data = await res.json();
    return data.rows[0];
  } catch (err) {
    console.log(err);
  }
}

const callAPIRetrieveRounds = async (gameId: number) => {
  try {
    const res = await fetch(`/api/retrieve-rounds/?gameId=${gameId}`);
    const data = await res.json();
    // console.log("rounds: ", data);
    return data;
  } catch (err) {
    console.log(err);
  }
}

const callAPISubmitAnswer = async (roundId: number, submission: string, thisPlayerHasLowerID: boolean) => {
  try {
    const res = await fetch(`/api/submit-answer/?roundId=${roundId}&&submission=${submission}&thisLower=${thisPlayerHasLowerID}`);
    const data = await res.json();
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

  const players = !Array.isArray(router.query.players)? (router.query.players? [router.query.players] : []): router.query.players;

  const player1 = players[0];
  const player2 = players.length > 1 ? players[1] : "No teammate set";


  // TODO: if only 1 player here:
  //  is this user the first player? (via auth, cache)
  //  if not: Potluck has invited you to play Wavelink. What's your name?
  //  redirect / add to URL

  // TODO: make sure player2 is a real player

  const [playerState, setPlayerState] = React.useState(PlayerState.NeedTeammate);

  const [previousRounds, setPreviousRounds] = React.useState<Round[]>([]);
  const [currentRound, setCurrentRound] = React.useState<Round | null>(null);
  const [gameId, setGameId] = React.useState<number>(0);
  const [thisPlayerHasLowerID, setThisPlayerLower] = React.useState<boolean>(false);

  if (playerState == PlayerState.NeedTeammate && players.length > 1) {
    // TODO: clean this up
    setPlayerState(PlayerState.NoRound);
  }

  useEffect(() => {
    callAPICreateOrRetrieveGame(player1, player2)
      .then((games) => {
        if (games.rows != null && games.rows.length > 0) {
          const game = games.rows[0];
          console.log("got a game pots: ", game);
          setGameId(game.id);
          if (game.lowerusername.toString().toLowerCase() == player1.toLowerCase()) {
            setThisPlayerLower(false);
          } else {
            setThisPlayerLower(true);
          }
      }
      })}, [router.query.players, player1, player2, thisPlayerHasLowerID]);


    useEffect(() => {
      callAPIRetrieveRounds(gameId)
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

        })}, [router.query.players, thisPlayerHasLowerID, gameId]);



  function startTurn() {
    if (playerState == PlayerState.NoRound) {
      console.log("yo pots, creating round? ", gameId, thisPlayerHasLowerID);
      callAPICreateRound(gameId, thisPlayerHasLowerID)
      .then((round) => {
        console.log("Hey pots: created a new round. ", round);
        setCurrentRound(round);
      });
      setPlayerState(PlayerState.Playing);
    } else if (playerState == PlayerState.RoundToPlay) {
      setPlayerState(PlayerState.Playing);
    }
  }

  function submitAnswer(submission : string) {
    if (submission.length < 2) {
      return false;
    }
    let completedLocally = false;
    if ((thisPlayerHasLowerID && !!currentRound?.link2) || (!thisPlayerHasLowerID && !!currentRound?.link1)) {
      completedLocally = true;
    }
    callAPISubmitAnswer(currentRound?.id || 0, submission, thisPlayerHasLowerID)
      .then(() => {
        if (completedLocally) {
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
          Hi <b>{player1}</b>. Welcome to Wavelink!
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
            thisLower={thisPlayerHasLowerID}
        />

    </ul>
    </main>
  </div>
  );
}
