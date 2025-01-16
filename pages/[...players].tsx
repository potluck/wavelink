import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react';
import GameState, { Submission, Turn } from './components/GameState';
import { Nunito } from 'next/font/google'
import Share from './components/Share';
import Link from 'next/link'

const nunito = Nunito({ subsets: ['latin'] })

export enum PlayerState {
  NeedTeammate,
  NoRound,
  RoundToPlay,
  RoundToPlayNoMatch,
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


const processTurns = (subs: Submission[]): { prevTurns: Turn[], currTurn: Turn | null } => {
  const prevTurns: Turn[] = [];
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

  if (currTurn != null) {
    currTurn.submissions.sort((a, b) => a.counter - b.counter);
  }

  return { prevTurns, currTurn };
}

export default function Page() {
  const router = useRouter();

  // TODO: if only 1 player here:
  //  is this user the first player? (via auth, cache)
  //  if not: Potluck has invited you to play Wavelink. What's your name?
  //  redirect / add to URL

  // TODO: make sure player2 is a real player
  const [playerState, setPlayerState] = useState(PlayerState.NeedTeammate);
  const [isLoading, setIsLoading] = useState(true);
  const [players, setPlayers] = useState<string[]>([]);
  const [player1, setPlayer1] = useState<string>("");
  const [player2, setPlayer2] = useState<string>("");

  const [previousTurns, setPreviousTurns] = useState<Turn[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);
  const [completedTurn, setCompletedTurn] = useState<Turn | null>(null);
  const currentTurnRef = useRef<Turn | null>(null);
  const previousTurnsRef = useRef<Turn[]>([]);
  const playerStateRef = useRef<PlayerState>(PlayerState.NeedTeammate);
  const [gameId, setGameId] = useState<number>(0);
  const [thisPlayerHasLowerID, setThisPlayerLower] = useState<boolean>(false);

  if (playerState == PlayerState.NeedTeammate && players.length > 1) {
    // TODO: clean this up
    setPlayerState(PlayerState.NoRound);
  }
  useEffect(() => {
    currentTurnRef.current = currentTurn;
  }, [currentTurn]);

  useEffect(() => {
    previousTurnsRef.current = previousTurns;
  }, [previousTurns]);

  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  useEffect(() => {
    async function fetchGameData(player1l: string, player2l: string) {
      let thisLower = false;
      callAPICreateOrRetrieveGame(player1l, player2l)
        .then((games) => {
          if (games.rows != null && games.rows.length > 0) {
            const game = games.rows[0];
            setGameId(game.id);
            thisLower = game.lowerusername.toString().toLowerCase() == player1l.toLowerCase();
            setThisPlayerLower(thisLower);
            fetchTurnsData(game.id, thisLower);
          }
        })
    }

    async function fetchTurnsData(gameIdl: number, thisLower: boolean) {
      callAPIRetrieveTurns(gameIdl)
        .then((turns) => {
          const { prevTurns, currTurn } = processTurns(turns?.rows || []);
          // console.log("any curr turn pots? ", currTurn);
          setPreviousTurns(prevTurns);
          setCurrentTurn(currTurn);

          if (currTurn !== null) {
            const latestSub = currTurn.submissions[currTurn.submissions.length - 1];
            if ((thisLower && !!(latestSub?.link1)) || (!thisLower && !!latestSub.link2)) {
              setPlayerState(PlayerState.Waiting);
            } else {
              setPlayerState(PlayerState.RoundToPlay);
            }
          } else {
            setPlayerState(PlayerState.NoRound);
          }
          setIsLoading(false);
          setupPolling(gameIdl);
        })
    }
    async function setupPolling(gameIdl: number) {
      const eventSource = new EventSource(`/api/poll?gameId=${gameIdl}`);

      eventSource.onmessage = (event) => {
        if (event.data && event.data.length > 2) {
          console.log("got data: ", event.data);
        }
        const data = JSON.parse(event.data);
        const justCompletedSubmission = data && data.length > 0 ? data[0] : null;
        // console.log("got data: ", data, justCompletedSubmission, currentTurnRef.current);
        if ((justCompletedSubmission?.turn_id == currentTurnRef.current?.id) && justCompletedSubmission?.counter + 1 >= (currentTurnRef.current?.submissions.length || 0)
          && playerStateRef.current == PlayerState.Waiting) {
          setPlayerState(PlayerState.RoundToPlayNoMatch);
          const lastSubmission = currentTurnRef.current?.submissions[currentTurnRef.current?.submissions.length - 1];
          // console.log("last submission: ", lastSubmission);
          if (lastSubmission) {
            lastSubmission.link1 = justCompletedSubmission.link1;
            lastSubmission.link2 = justCompletedSubmission.link2;
            lastSubmission.completed_at = new Date().toISOString();
          }
          if (justCompletedSubmission.turn_completed_at != null) {
            // console.log("completed turn");
            const newTurn: Turn = {
              id: currentTurnRef.current?.id || 0,
              rareness_score: justCompletedSubmission.rareness_score,
              speed_score: justCompletedSubmission.speed_score,
              word1: currentTurnRef.current?.word1 || "",
              word2: currentTurnRef.current?.word2 || "",
              created_at: currentTurnRef.current?.created_at || "",
              completed_at: "",
              submissions: currentTurnRef.current?.submissions || []
            };
            setCompletedTurn(newTurn);
            setPreviousTurns([...previousTurnsRef.current, newTurn]);
            setPlayerState(PlayerState.NoRound);
          } else if (lastSubmission) {
            const newSubmission = {
              ...lastSubmission,
              completed_at: null,
              counter: lastSubmission.counter + 1,
              link1: null,
              link2: null,
            };
            currentTurnRef.current?.submissions.push(newSubmission);
          }
        }
      };
      eventSource.onerror = function (e) {
        console.log("eventsource error: " + e.type);
      };
      return () => {
        eventSource.close();
      };
    }

    if (router.isReady && router.query.players) {
      const queryPlayers = router.query.players as string[];
      setPlayers(queryPlayers);
      setPlayer1(queryPlayers[0]);
      setPlayer2(queryPlayers.length > 1 ? queryPlayers[1] : "No teammate set");
      if (queryPlayers.length > 1) {
        fetchGameData(queryPlayers[0], queryPlayers[1]);
      }
    }
  }, [router.isReady, router.query.players]);

  function startTurn() {
    if (playerState == PlayerState.NoRound) {
      callAPICreateTurn(gameId)
        .then((turn) => {
          const { currTurn } = processTurns([turn]);
          setCurrentTurn(currTurn);
          setPlayerState(PlayerState.Playing);
          setCompletedTurn(null);
        });
    } else if (playerState == PlayerState.RoundToPlay || playerState == PlayerState.RoundToPlayNoMatch) {
      setPlayerState(PlayerState.Playing);
      setCompletedTurn(null);
    }
  }

  function submitAnswer(submission: string) {
    if (submission.length < 2) {
      return false;
    }
    // TODO: check to make sure submission doesn't match previous words / submissions

    callAPISubmitAnswer(currentTurn?.id || 0, submission, thisPlayerHasLowerID)
      .then(({ submissionCompleted, turnCompleted, rarenessScore, speedScore, link1, link2 }) => {
        if (turnCompleted) {
          if (currentTurn) {
            const lastSubmission = currentTurnRef.current?.submissions[currentTurnRef.current?.submissions.length - 1];
            if (lastSubmission) {
              lastSubmission.link1 = link1;
              lastSubmission.link2 = link2;
              lastSubmission.completed_at = new Date().toISOString();
            }
          }
          const newTurn: Turn = {
            id: currentTurn?.id || 0,
            rareness_score: rarenessScore,
            speed_score: speedScore,
            word1: currentTurn?.word1 || "",
            word2: currentTurn?.word2 || "",
            created_at: currentTurn?.created_at || "",
            completed_at: "",
            submissions: currentTurn?.submissions || []
          };
          setCompletedTurn(newTurn);
          setPlayerState(PlayerState.NoRound);
          setPreviousTurns([...previousTurnsRef.current, newTurn]);
        } else if (submissionCompleted) {
          setPlayerState(PlayerState.RoundToPlayNoMatch);
          const lastSubmission = currentTurnRef.current?.submissions[currentTurnRef.current?.submissions.length - 1];
          if (lastSubmission) {
            lastSubmission.link1 = link1;
            lastSubmission.link2 = link2;
            lastSubmission.completed_at = new Date().toISOString();
            const newSubmission = {
              ...lastSubmission,
              completed_at: null,
              counter: lastSubmission.counter + 1,
              link1: null,
              link2: null,
            };
            currentTurnRef.current?.submissions.push(newSubmission);
          }
        } else {
          setPlayerState(PlayerState.Waiting);
        }
      })
    return true;
  }

  console.log("Yo pots, submission are : ", currentTurn?.submissions);

  if (players.length == 0) {
    return (
      <div className={`${nunito.className} grid grid-rows-[5px_1fr_20px] items-center justify-items-center min-h-screen p-2 pb-20 gap-6 sm:p-8`}>
        Loading...
      </div>
    );
  }

  if (players.length == 1) {
    return <Share player1={player1} />;
  }

  return (
    <div className={`${nunito.className} grid grid-rows-[5px_1fr_20px] items-center justify-items-center min-h-screen p-2 pb-20 gap-6 sm:p-8`}>
      <main className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-center w-full">Wavelink &nbsp;&nbsp;🌊&thinsp;🔗</h1>
        <div className="mb-2">
          Hi <b>{player1}</b>. You&apos;re playing with: {player2}
        </div>
        {isLoading ? <div>Loading...</div> : (<div>
          <GameState
            playerState={playerState}
            startTurn={startTurn}
            previousTurns={previousTurns}
            currentTurn={currentTurn}
            submitAnswer={submitAnswer}
            completedTurn={completedTurn}
          />
          <div className="mb-2 mt-6">
            <Link href={`/${player1}`} className="text-blue-600 hover:text-blue-800 underline">Invite other friends or play against the AI</Link>
          </div>
        </div>
        )}

      </main>
      <footer className="row-start-3 text-sm">
        <Link href="/help" className="text-blue-600 hover:text-blue-800 underline">How to play</Link>
      </footer>
    </div>
  );
}
