import { useRouter } from 'next/router'
import React, { useEffect } from 'react';
import GameState, { Submission, Turn } from './components/GameState';

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

const callAPICreateTurn = async (gameId: number) => {
  try {
    const res = await fetch(`/api/create-new-turn/?gameId=${gameId}`);
    const data = await res.json();
    return data.rows[0];
  } catch (err) {
    console.log(err);
  }
}

const callAPIRetrieveTurns = async (gameId: number) => {
  try {
    const res = await fetch(`/api/retrieve-turns/?gameId=${gameId}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
  }
}

const callAPISubmitAnswer = async (turnId: number, submission: string, thisPlayerHasLowerID: boolean) => {
  try {
    const res = await fetch(`/api/submit-answer/?turnId=${turnId}&&submission=${submission}&thisLower=${thisPlayerHasLowerID}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
  }
}


const processTurns = (subs : Submission[]) : {prevTurns: Turn[], currTurn: Turn | null} => {
  const prevTurns : Turn[] = [];
  let currTurn = null;
  for (const sub of subs) {
    if (sub.turn_completed_at == null) {
      if (currTurn == null) {
        currTurn = {
          id: sub.turn_id,
          rareness_score: sub.rareness_score,
          speed_score: sub.speed_score,
          word1: sub.word1,
          word2: sub.word2,
          created_at: sub.turn_created_at,
          completed_at: sub.turn_completed_at,
          submissions: [sub]
        };
      } else {
        currTurn.submissions.push(sub);
      }
    } else {
      const foundTurn = prevTurns.find(turn => turn.id == sub.turn_id);
      if (foundTurn == null) {
        prevTurns.push({
          id: sub.turn_id,
          rareness_score: sub.rareness_score,
          speed_score: sub.speed_score,
          word1: sub.word1,
          word2: sub.word2,
          created_at: sub.turn_created_at,
          completed_at: sub.turn_completed_at,
          submissions: [sub]
        });
      } else {
        foundTurn.submissions.push(sub)
      }
    }
  }

  // TODO: sort submissions by counter
  if (currTurn != null) {
    currTurn.submissions.sort((a, b) => a.counter - b.counter);
  }

  return {prevTurns, currTurn};
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

  const [previousTurns, setPreviousTurns] = React.useState<Turn[]>([]);
  const [currentTurn, setCurrentTurn] = React.useState<Turn | null>(null);
  const [completedTurn, setCompletedTurn] = React.useState<Turn | null>(null);
  const currentTurnRef = React.useRef<Turn | null>(null);
  const [gameId, setGameId] = React.useState<number>(0);
  const [thisPlayerHasLowerID, setThisPlayerLower] = React.useState<boolean>(false);

  if (playerState == PlayerState.NeedTeammate && players.length > 1) {
    // TODO: clean this up
    setPlayerState(PlayerState.NoRound);
  }
  useEffect(() => {
    currentTurnRef.current = currentTurn;
}, [currentTurn]);

  useEffect(() => {
    callAPICreateOrRetrieveGame(player1, player2)
      .then((games) => {
        if (games.rows != null && games.rows.length > 0) {
          const game = games.rows[0];
          setGameId(game.id);
          if (game.lowerusername.toString().toLowerCase() == player1.toLowerCase()) {
            setThisPlayerLower(true);
          } else {
            setThisPlayerLower(false);
          }
      }
      })}, [router.query.players, player1, player2, thisPlayerHasLowerID]);


    useEffect(() => {
      callAPIRetrieveTurns(gameId)
        .then((turns) => {
          const {prevTurns, currTurn} = processTurns(turns?.rows || []);
          console.log("any curr turn pots? ", currTurn);
          setPreviousTurns(prevTurns);
          setCurrentTurn(currTurn);

          if (currTurn !== null) {
            const latestSub = currTurn.submissions[currTurn.submissions.length - 1];
            if ((thisPlayerHasLowerID && !!(latestSub?.link1)) || (!thisPlayerHasLowerID && !!latestSub.link2)) {
              setPlayerState(PlayerState.Waiting);
            } else {
              setPlayerState(PlayerState.RoundToPlay);
            }
          } else {
            setPlayerState(PlayerState.NoRound);
          }

        })}, [router.query.players, thisPlayerHasLowerID, gameId]);

      // useEffect(() => {
      //   const eventSource = new EventSource(`/api/poll?gameId=${gameId}`);

      //   eventSource.onmessage = (event) => {
      //     const data = JSON.parse(event.data);
      //     const justCompletedRound = data && data.length>0? data[0] : null;
      //     if (justCompletedRound?.id == currentRoundRef.current?.id) {
      //       setCompletedRound(justCompletedRound);
      //       setPlayerState(PlayerState.NoRound);
      //     }
      //   };
      //   eventSource.onerror = function(e){
      //     console.log("error pots: "+e.type+" "+eventSource.readyState);
      // };
      //   return () => {
      //     eventSource.close();
      //   };
      // }, [gameId, thisPlayerHasLowerID]);

  function startTurn() {
    if (playerState == PlayerState.NoRound) {
      callAPICreateTurn(gameId)
      .then((turn) => {
        console.log("anything pots?2 ", turn);
        const {currTurn} = processTurns([turn]);
        setCurrentTurn(currTurn);
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
    callAPISubmitAnswer(currentTurn?.id || 0, submission, thisPlayerHasLowerID)
      .then(({submissionCompleted, turnCompleted, rarenessScore, speedScore /*, link1, link2*/}) => {
        if (turnCompleted) {
          const newTurn:Turn = {
            id: currentTurn?.id || 0,
            rareness_score: rarenessScore,
            speed_score: speedScore,
            word1: currentTurn?.word1 || "",
            word2: currentTurn?.word2 || "",
            created_at: currentTurn?.created_at || "",
            completed_at: "",
            submissions: []
          };
          setCompletedTurn(newTurn);
          setPlayerState(PlayerState.NoRound);
        } else if (submissionCompleted) {
          setPlayerState(PlayerState.RoundToPlay);
        } else {
          setPlayerState(PlayerState.Waiting);
        }
      })
      return true;
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
          Hi <b>{player1}</b>. Welcome to Wavelink!
        </li>
        <li className="mb-2">
          You&apos;re playing with: {player2}
        </li>

        <GameState
            playerState={playerState}
            startTurn={startTurn}
            previousTurns={previousTurns}
            currentTurn={currentTurn}
            submitAnswer={submitAnswer}
            thisLower={thisPlayerHasLowerID}
            completedTurn={completedTurn}
        />

    </ul>
    </main>
  </div>
  );
}
