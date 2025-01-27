import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react';
import { Nunito } from 'next/font/google'
import Link from 'next/link'
import GameState, { Submission, Turn } from './components/GameState';
import SetPasskeyModal from './components/SetPasskeyModal';
import Share from './components/Share';
import Invited from './components/Invited';
import ConfirmPasskeyModal from './components/ConfirmPasskeyModal';
import { GameToRespondTo } from './components/Share';

const nunito = Nunito({ subsets: ['latin'] })

export enum PlayerState {
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
    return err;
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

const callAPISavePasskey = async (userId: number, passkey: string) => {
  try {
    const res = await fetch(`/api/save-passkey/?userId=${userId}&passkey=${passkey}`);
    const data = await res.json();
    return data;
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

const callAPIRetrieveGamesToRespondTo = async (userId: number) => {
  try {
    const res = await fetch(`/api/retrieve-all-games-to-respond-to/?userId=${userId}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
  }
}

const processTurns = (subs: Submission[], thisLower: boolean): { prevTurns: Turn[], currTurn: Turn | null, completedTurn: Turn | null } => {
  const prevTurns: Turn[] = [];
  let currTurn = null;
  let completedTurn = null;
  for (const sub of subs) {
    if (sub.turn_completed_at == null) {
      if (currTurn == null) {
        currTurn = {
          id: sub.turn_id,
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
        const newTurn = {
          id: sub.turn_id,
          speed_score: sub.speed_score,
          word1: sub.word1,
          word2: sub.word2,
          created_at: sub.turn_created_at,
          completed_at: sub.turn_completed_at,
          submissions: [sub]
        };
        prevTurns.push(newTurn);
        completedTurn = newTurn;
      } else {
        completedTurn = foundTurn;
        foundTurn.submissions.push(sub)
      }
    }
  }

  if (currTurn != null) {
    currTurn.submissions.sort((a, b) => a.counter - b.counter);
    if ((thisLower && !!currTurn.submissions[0].link1) || (!thisLower && !!currTurn.submissions[0].link2)) {
      completedTurn = null;
    }
  }

  return { prevTurns, currTurn, completedTurn };
}

const saveUserToLocalStorage = (userId: number, userName: string) => {
  localStorage.setItem('wavelink-userId', userId.toString());
  localStorage.setItem('wavelink-userSlug', userName);
}

const getUserFromLocalStorage = () => {
  const userId = localStorage.getItem('wavelink-userId');
  const userSlug = localStorage.getItem('wavelink-userSlug');
  return {
    userId: userId ? parseInt(userId) : null,
    userSlug: userSlug
  };
}

const InviteLink = ({ player1, numOtherGamesToRespondTo }: { player1: string, numOtherGamesToRespondTo: number }) => (
  <div className="mb-2 mt-6 text-center">
    <Link href={`/${player1}`} className="text-blue-600 hover:text-blue-800 underline">
      {numOtherGamesToRespondTo > 0 ?
        (<>
          <b>You have {numOtherGamesToRespondTo} other {numOtherGamesToRespondTo === 1 ? 'game' : 'games'} to respond to!</b>
          <br />
          In addition, you can invite other friends or play against the AI.
        </>)
        : "Invite other friends or play against the AI"}
    </Link>
  </div>
);

export default function Page() {
  const router = useRouter();

  const [playerState, setPlayerState] = useState(PlayerState.NoRound);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [players, setPlayers] = useState<string[]>([]);
  const [player1, setPlayer1] = useState<string>("");
  const [player2, setPlayer2] = useState<string>("");
  const [userId1, setUserId1] = useState<number>(0);
  const [userName1, setUserName1] = useState<string>("");
  const [userName2, setUserName2] = useState<string>("");
  const [userHasPasskey, setUserHasPasskey] = useState<boolean>(false);
  const [gamesToRespondTo, setGamesToRespondTo] = useState<GameToRespondTo[]>([]);
  const [numOtherGamesToRespondTo, setNumOtherGamesToRespondTo] = useState<number>(0);
  const [gameId, setGameId] = useState<number>(0);
  const [thisPlayerHasLowerID, setThisPlayerLower] = useState<boolean>(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState<boolean>(false);
  const [showConfirmPasskeyModal, setShowConfirmPasskeyModal] = useState<boolean>(false);

  const [previousTurns, setPreviousTurns] = useState<Turn[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);
  const [completedTurn, setCompletedTurn] = useState<Turn | null>(null);
  const currentTurnRef = useRef<Turn | null>(null);
  const previousTurnsRef = useRef<Turn[]>([]);
  const playerStateRef = useRef<PlayerState>(PlayerState.NoRound);

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
      callAPICreateOrRetrieveGame(player1l, player2l)
        .then((games) => {
          if (games.rows != null && games.rows.length > 0) {

            const gameUserId1 = games.userId1;
            const gameUserHasPasskey = games.userHasPasskey;
            const localUser = getUserFromLocalStorage();
            if (!gameUserHasPasskey) {
              if (localUser.userId == gameUserId1) {
                // No-op. All good. Game user matches local storage
              } else if (localUser.userId == null) {
                // no passkey, no local user. Save the user to local storage
                saveUserToLocalStorage(gameUserId1, player1l);
              } else if (localUser.userId == games.userId2) {
                // local user matches user 2
                router.push(`/${player2l}/${player1l}`);
                return;
              } else {
                // User doesn't match local storage.
                // TODO: Ask user to switch account.
                // TODO: Notify user that we're switching from saved user
                console.log("local User ID didn't match game User Id: ", localUser.userId, gameUserId1);
                saveUserToLocalStorage(gameUserId1, player1l);
              }
            } else {
              if (localUser.userId == gameUserId1) {
                // No-op. All good. Game user matches local storage
              } else if (localUser.userId == null) {
                setShowConfirmPasskeyModal(true);
                // TODO: Do I want to return here? If I do, I need to make sure I can still trigger the subsequent API calls
              } else if (localUser.userId == games.userId2) {
                // local user matches user 2
                router.push(`/${player2l}/${player1l}`);
                return;
              } else {
                // TODO: Ask user to switch account & confirm passkey.
                //  Notify that we're switching from saved user
                console.log("local User ID didn't match game User ID w/ passkey: ", localUser.userId, gameUserId1);
                saveUserToLocalStorage(gameUserId1, player1l);
              }
            }

            setUserHasPasskey(gameUserHasPasskey);
            setUserId1(gameUserId1);
            setUserName1(games.userName1);
            setUserName2(games.userName2);

            const game = games.rows[0];
            setGameId(game.id);
            setThisPlayerLower(games.thisLower);
            fetchTurnsData(game.id, games.thisLower);
            fetchGamesToRespondTo(games.userId1, game.id);
          } else if (games.error) {
            setIsLoading(false);
            console.error("Error loading game between ", player1, " and ", player2, ": ", games.error);
            setLoadingError("Sorry, there was an error loading the game. Please refresh and try again.");
          }
        })
    }

    async function fetchTurnsData(gameIdl: number, thisLower: boolean) {
      callAPIRetrieveTurns(gameIdl)
        .then((turns) => {
          const { prevTurns, currTurn, completedTurn } = processTurns(turns?.rows || [], thisLower);
          setPreviousTurns(prevTurns);
          setCurrentTurn(currTurn);
          setCompletedTurn(completedTurn);

          if (currTurn !== null) {
            const latestSub = currTurn.submissions[currTurn.submissions.length - 1];
            if ((thisLower && !!(latestSub?.link1)) || (!thisLower && !!latestSub.link2)) {
              setPlayerState(PlayerState.Waiting);
            } else if (((thisLower && !!(latestSub?.link2)) || (!thisLower && !!latestSub.link1))) {
              if (currTurn.submissions.length > 1) {
                setPlayerState(PlayerState.RoundToPlayNoMatch);
              } else {
                setPlayerState(PlayerState.RoundToPlay);
              }
            } else { // neither of us have a link for this submission
              if (currTurn.submissions.length > 1) {
                setPlayerState(PlayerState.RoundToPlayNoMatch);
              } else {
                setPlayerState(PlayerState.RoundToPlay);
              }
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
            document.title = "(1) Wavelink - a Pots production";
          } else if (lastSubmission) {
            const newSubmission = {
              ...lastSubmission,
              completed_at: null,
              counter: lastSubmission.counter + 1,
              link1: null,
              link2: null,
            };
            currentTurnRef.current?.submissions.push(newSubmission);
            setPlayerState(PlayerState.RoundToPlayNoMatch);
            document.title = "(1) Wavelink - a Pots production";
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

    async function fetchGamesToRespondTo(userId: number, gameId: number) {
      callAPIRetrieveGamesToRespondTo(userId)
        .then((games) => {
          if (games?.rows != null && games.rows.length > 0) {
            setGamesToRespondTo(games.rows);
            setNumOtherGamesToRespondTo(games.rows.filter((game: GameToRespondTo) => game.id != gameId).length);
          }
        })
    }

    if (router.isReady && router.query.players) {
      const queryPlayers = router.query.players as string[];
      setPlayers(queryPlayers);
      setPlayer1(queryPlayers[0]);
      setPlayer2(queryPlayers.length > 1 ? queryPlayers[1] : "No teammate set");
      if (queryPlayers.length > 1 && queryPlayers[1].toLowerCase() != "invite" && queryPlayers[1] !== queryPlayers[0]) {
        fetchGameData(queryPlayers[0], queryPlayers[1]);
      }
    }
  }, [router.isReady, router.query.players, router]);


  useEffect(() => {
    if (completedTurn && !userHasPasskey) {
      const timeoutId = setTimeout(() => {
        setShowPasskeyModal(true);
      }, 3000);

      // Cleanup function to clear the timeout if the component unmounts
      return () => clearTimeout(timeoutId);
    }
  }, [completedTurn, userHasPasskey]);

  function startTurn() {
    if (playerState == PlayerState.NoRound) {
      document.title = "Wavelink - a Pots production";
      callAPICreateTurn(gameId)
        .then((turn) => {
          const { currTurn } = processTurns([turn], thisPlayerHasLowerID);
          setCurrentTurn(currTurn);
          setPlayerState(PlayerState.Playing);
          setCompletedTurn(null);
        });
    } else if (playerState == PlayerState.RoundToPlay || playerState == PlayerState.RoundToPlayNoMatch) {
      document.title = "Wavelink - a Pots production";
      setPlayerState(PlayerState.Playing);
      setCompletedTurn(null);
    }
  }

  function setUserPasskey(passkey: string | null) {
    if (passkey) {
      callAPISavePasskey(userId1, passkey);
      setUserHasPasskey(true);
    }
    setShowPasskeyModal(false);
    return;
  }

  function checkAgainstPrevious(submission: string) {
    const submissions = currentTurnRef.current?.submissions || [];
    const word1 = (currentTurnRef.current?.word1 || "").toLowerCase();
    const word2 = (currentTurnRef.current?.word2 || "").toLowerCase();
    if (word1 == submission || word2 == submission || (submission.length > 2 && (word1.indexOf(submission) != -1 || word2.indexOf(submission) != -1))
      || (word1.length > 2 && submission.indexOf(word1) != -1) || (word2.length > 2 && submission.indexOf(word2) != -1)) {
      return true;
    }
    for (const sub of submissions) {
      if (!sub.link1 || !sub.link2) {
        continue;
      }
      const sub1 = sub.link1.toLowerCase();
      const sub2 = sub.link2.toLowerCase();
      if (sub1 == submission || sub2 == submission || (submission.length > 2 && (sub1.indexOf(submission) != -1 || sub2.indexOf(submission) != -1))
        || (sub1.length > 2 && submission.indexOf(sub1) != -1) || (sub2.length > 2 && submission.indexOf(sub2) != -1)) {
        return true;
      }
    }
    return false;
  }

  function submitAnswer(submission: string) {
    if (submission.length < 2) {
      return { success: false, error: "Submission must be at least 2 characters" };
    }

    if (submission.split(/\s+/).length > 2) {
      return { success: false, error: "Submission must be a single word or two-word phrase" };
    }

    const matchesPrevious = checkAgainstPrevious(submission.toLowerCase());
    if (matchesPrevious) {
      return { success: false, error: "Can't repeat previous words or submissions" };
    }

    callAPISubmitAnswer(currentTurn?.id || 0, submission, thisPlayerHasLowerID)
      .then(({ submissionCompleted, turnCompleted, speedScore, link1, link2 }) => {
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
    return { success: true, error: null };
  }

  if (players.length == 1 || (players.length == 2 && players[0].toLowerCase() == players[1].toLowerCase())) {
    if (players.length == 2 && players[0].toLowerCase() == players[1].toLowerCase()) {
      router.push(`/${players[0]}`);
    }
    return <Share player1={player1} gamesToRespondTo={gamesToRespondTo} userId1={userId1} />;
  }

  if (players.length == 2 && players[1].toLowerCase() == "invite") {
    return <Invited player1={player1} />;
  }

  return (
    <div className={`${nunito.className} grid grid-rows-[5px_1fr_20px] items-center justify-items-center min-h-screen p-2 pb-20 gap-6 sm:p-8`}>
      <main className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-center w-full">Wavelink &nbsp;&nbsp;🌊&thinsp;🔗</h1>
        <div className="mb-2">
          Hi <b>{userName1 || player1}</b>. You&apos;re playing with: <b>{userName2 || player2}</b>
        </div>
        {showPasskeyModal && <SetPasskeyModal inputPassKey={setUserPasskey} />}
        {showConfirmPasskeyModal &&
          <ConfirmPasskeyModal
            userId={userId1}
            userName={player1}
            onConfirm={(confirmed) => {
              if (confirmed) {
                setShowConfirmPasskeyModal(false);
                saveUserToLocalStorage(userId1, player1);
              } else {
                setShowConfirmPasskeyModal(false);
                router.push(`/${player2}/invite`);
              }
            }}
          />
        }
        {isLoading ? <div>Loading...</div>
          : loadingError ?
            <div> <div className="text-red-600">{loadingError}</div> <InviteLink player1={player1} numOtherGamesToRespondTo={numOtherGamesToRespondTo} /></div>
            : (<div>
              <GameState
                playerState={playerState}
                startTurn={startTurn}
                previousTurns={previousTurns}
                currentTurn={currentTurn}
                submitAnswer={submitAnswer}
                completedTurn={completedTurn}
                player1Slug={player1}
                player2Slug={player2}
                player2Name={userName2}
              />
              <InviteLink player1={player1} numOtherGamesToRespondTo={numOtherGamesToRespondTo} />
            </div>
            )}

      </main>
      <footer className="row-start-3 text-sm">
        <Link href="/help" className="text-blue-600 hover:text-blue-800 underline">How to play</Link>
      </footer>
    </div>
  );
}
