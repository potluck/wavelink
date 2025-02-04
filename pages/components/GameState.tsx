import { FormEvent, useState, useEffect } from "react";
import { PlayerState } from "../[...players]";
import Explainer from "./Explainer";

type GameStateProps = {
  playerState: PlayerState,
  startTurn: () => void,
  submitAnswer: (submission: string) => { success: boolean, error: string | null },
  previousTurns: Turn[],
  currentTurn: Turn | null,
  completedTurn: Turn | null,
  player1Slug: string
  player2Slug: string
  player2Name: string
  thisLower: boolean
}

export type Submission = {
  // turn info:
  turn_id: number,
  speed_score: number | null,
  word1: string,
  word2: string,
  turn_created_at: string,
  turn_completed_at: string | null,
  // submission info:
  id: number,
  counter: number,
  link1: string | null,
  link2: string | null,
  created_at: string,
  completed_at: string | null,
}

export type Turn = {
  id: number,
  speed_score: number | null,
  word1: string,
  word2: string,
  created_at: string,
  completed_at: string | null,
  submissions: Submission[],
}

const analyzePreviousTurns = (previousTurns: Turn[]) => {
  let currentStreak = 0;
  let maxStreak = 0;
  let oneShotCount = 0;
  let totalScore = 0;
  let numTurns = 0;
  let numWins = 0;

  for (const idx in previousTurns) {
    numTurns++;
    const turn = previousTurns[idx];
    if (turn.speed_score || 0 > 0) {
      numWins++;
      currentStreak++;
      totalScore += turn.speed_score || 0;
      if (turn.submissions.length === 1) {
        oneShotCount++;
      }
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }

  return { currentStreak, maxStreak, oneShotCount, totalScore, numTurns, numWins };
}


export default function GameState({
  playerState,
  startTurn,
  submitAnswer,
  previousTurns,
  currentTurn,
  completedTurn,
  player1Slug,
  player2Slug,
  player2Name,
  thisLower
}: GameStateProps) {

  const [answer, setAnswer] = useState("");
  const [showPreviousRounds, setShowPreviousRounds] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [submitting, setSubmitting] = useState(true);
  const [copyButtonText, setCopyButtonText] = useState("Copy");
  const [timeLeft, setTimeLeft] = useState(30);
  const [showCurrentRound, setShowCurrentRound] = useState(false);
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleShare = () => {
    if (navigator.share && isMobileDevice()) {
      navigator.share({
        url: `/${player2Slug}/${player1Slug}`,
        text: "I played in Wavelink - your move!"
      }).catch(console.error);
    } else {
      setShowNudgeModal(true);
    }
  };

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { success, error } = submitAnswer(answer.trim());
    if (success) {
      setError(null);
      setSubmitting(true);
      setAnswer("");
    } else {
      setError(error);
      setSubmitting(false);
    }
  }

  const { currentStreak, maxStreak, oneShotCount, totalScore, numTurns, numWins } = analyzePreviousTurns(previousTurns);
  const prevTurns = (previousTurns || []).map((turn, idx) =>
    <div key={idx}>
      <span className="text-orange-500"><b>Round {idx + 1}. </b></span>
      <br />Score: <b>{(turn.speed_score || 0)}</b> {(turn.speed_score || 0) == 5 ? "🔥" : ""}
      <br />Words: {turn.word1}, {turn.word2}
      {turn.submissions?.map((submission, idx) => {
        return (
          <div className="pl-4" key={idx}>
            <u>Submission {idx + 1}:</u> {submission.link1} <b>|</b> {submission.link2}
          </div>
        )
      })}
    </div>
  ).reverse();

  let lastLink1 = "";
  let lastLink2 = "";

  // For showing the turn while playing
  const thisTurn = currentTurn && currentTurn.submissions.length > 0 && (
    <div>
      {currentTurn.submissions.map((submission, idx) => {
        if (submission.link1 && submission.link2) {
          lastLink1 = submission.link1;
          lastLink2 = submission.link2;
        }
        return (
          submission.link1 && submission.link2 && (
            <div key={idx}>
              <b>Submission {idx + 1}: </b>{submission.link1} <b>|</b> {submission.link2}
            </div>
          )
        )
      })}
      {lastLink1 && lastLink2 && (
        <div>Now think of a word (or two-word phrase) that connects <b>{lastLink1}</b> and <b>{lastLink2}</b>!</div>
      )}
    </div>
  );

  // Mostly redundant with thisTurn - this is for when player is waiting
  const currRound = currentTurn && (
    <div>
      <span className="inline-flex gap-2">
        Starting words:
        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
          {currentTurn?.word1}
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
          {currentTurn?.word2}
        </span>
      </span>
      {currentTurn.submissions.map((submission, idx) => {
        return (
          <div key={idx}>
            <b>Submission {idx + 1}: </b>
            {submission.link1 || "____"} <b>|</b> {submission.link2 || "____"}
          </div>
        )
      })}
    </div>
  );

  if (completedTurn && !(lastLink1 && lastLink2)) {
    lastLink1 = completedTurn.submissions[completedTurn.submissions.length - 1].link1 || "";
    lastLink2 = completedTurn.submissions[completedTurn.submissions.length - 1].link2 || "";
  }

  const justCompletedTurn = completedTurn && (
    <div>
      <b>Round complete! </b>
      {completedTurn.speed_score || 0 > 0 ?
        <div className="text-green-500">Congrats! You won this round in {6 - (completedTurn.speed_score || 0)} {6 - (completedTurn.speed_score || 0) === 1 ? "try" : "tries"}!</div> :
        <div className="text-red-500">
          Unfortunately, you did not win this round.
          <br />
          Your final submissions were <b>{lastLink1}</b> and <b>{lastLink2}</b>.
          <br />
          Try again!
        </div>
      }
      {((completedTurn.speed_score || 0) > 0 && lastLink1 === lastLink2) && (<div className="text-green-500">You and {player2Name} both submitted <b>{lastLink1}</b>!</div>)}
      {((completedTurn.speed_score || 0) > 0 && lastLink1 !== lastLink2) && (<div className="text-green-500">You and {player2Name} submitted <b>{lastLink1}</b> and <b>{lastLink2}</b>!</div>)}
    </div>);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNudgeModal(false);
      }
    };

    if (showNudgeModal) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNudgeModal]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (playerState === PlayerState.Playing && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [playerState, timeLeft]);

  useEffect(() => {
    if (playerState === PlayerState.Playing) {
      setAnswer("");
      setSubmitting(false);
      setTimeLeft(30);
    }
  }, [playerState]);

  return (
    <div className="max-w-md">
      {(playerState === PlayerState.NoRound || playerState === PlayerState.RoundToPlay) && (previousTurns == null || (previousTurns.length == 0 && completedTurn == null && lastLink1 == "" && lastLink2 == "")) &&
        <Explainer />
      }
      {(playerState == PlayerState.NoRound) &&
        <button
          className="mb-6 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44 mx-auto"
          onClick={startTurn}
        >
          Start new round
        </button>
      }
      {(playerState == PlayerState.RoundToPlayNoMatch) &&
        <div className="text-purple-500">Your submission didn&apos;t match {player2Name}&apos;s submission.
          <br />
          You submitted <b>{thisLower ? lastLink1 : lastLink2}</b> and {player2Name} submitted <b>{thisLower ? lastLink2 : lastLink1}</b>.
        </div>
      }
      {(playerState == PlayerState.RoundToPlay) &&
        <div>It&apos;s your turn.</div>
      }
      {(playerState == PlayerState.RoundToPlay) &&
        <div>
          <button
            className="mt-6 mb-6 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44 mx-auto"
            onClick={startTurn}
          >
            Play round.
          </button>
        </div>
      }
      {(playerState == PlayerState.RoundToPlayNoMatch) &&
        <div>
          <button
            className="mt-6 mb-6 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44 mx-auto"
            onClick={startTurn}
          >
            Try again
          </button>
        </div>
      }
      {(playerState == PlayerState.Playing) &&
        <div>
          <div className="mb-2 text-base">
            Suggested time limit: 0:{timeLeft.toString().padStart(2, '0')}
          </div>
          <div className="mb-2">
            Your starting words {lastLink1 && lastLink2 ? "were: " : "are: "}
            <span className="inline-flex gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                {currentTurn?.word1}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                {currentTurn?.word2}
              </span>
            </span>
            <br />
            <br />
            {lastLink1 === "" && lastLink2 === "" ? `Think of a word (or two-word phrase) that connects ${currentTurn?.word1} and ${currentTurn?.word2}!` : thisTurn}
            {(previousTurns == null || (previousTurns.length == 0 && completedTurn == null && lastLink1 == "" && lastLink2 == "")) &&
              <div>
                <br />
                Remember, your goal is to submit the <b>same connection</b> as {player2Name}!
              </div>
            }
          </div>
          {error && <div className="text-red-500">{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              value={answer}
              autoFocus
              onChange={e => setAnswer(e.target.value)}
              className="block w-full px-4 py-3 text-base text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors"
              placeholder="Enter word..."
              autoComplete="off"
            />
            <button
              type="submit"
              className="w-full sm:w-auto rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 transition-colors duration-200 flex items-center justify-center"
            >
              {submitting ? "Submitting..." : "Submit Answer"}
            </button>
          </form>
        </div>
      }
      {(playerState == PlayerState.Waiting) &&
        <div className="mb-2 text-purple-500 max-w-md"><b>Status: </b>Waiting for {player2Name} to complete this round.
          <br /><br />
          The page will auto-update when they submit, but you can also refresh the page to reload.
          <button
            onClick={() => setShowCurrentRound(!showCurrentRound)}
            className="text-blue-500 hover:text-blue-700 underline cursor-pointer flex items-center gap-1 pt-4"
          >
            <b>{showCurrentRound ? 'Hide' : 'See'} Current Round Progress {showCurrentRound ? '▲' : '▼'}</b>
          </button>
          {showCurrentRound && <div className="mt-2 text-gray-900 dark:text-white">{currRound}</div>}
        </div>
      }
      {(playerState == PlayerState.Waiting) && (
        <>
          <button
            onClick={handleShare}
            className="mt-4 w-full sm:w-auto rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 transition-colors duration-200 flex items-center justify-center"
          >
            Let {player2Name} know you made your move!
          </button>
          {showNudgeModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-bold mb-4">Nudge {player2Name} to make their move!</h3>
                <p className="mb-4">Copy this text to share:</p>
                <div className="flex gap-2 mb-4">
                  <textarea
                    readOnly
                    value={`I played in Wavelink! It's your move.\n${window.location.origin.replace(/^(https?:\/\/)www\./, '$1')}/${player2Slug}/${player1Slug}`}
                    className="block w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                    rows={2}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`I played in Wavelink! It's your move.\n${window.location.origin}/${player2Slug}/${player1Slug}`);
                      setCopyButtonText("Copied!");
                      setTimeout(() => setCopyButtonText("Copy"), 2000);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    {copyButtonText}
                  </button>
                </div>
                <button
                  onClick={() => setShowNudgeModal(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {justCompletedTurn}
      {previousTurns?.length > 0 && (
        <div className="mt-4">
          {maxStreak > 0 && (
            <div className="mb-2">
              Current streak: {currentStreak} <b>{currentStreak > 0 ? "🔥 Keep it going!" : ""}</b>
              <br />
              Max streak: {maxStreak}
              {oneShotCount > 0 && (
                <>
                  <br />
                  Number of one-shot wins: {oneShotCount}
                </>
              )}
              <br />
              Total: {numWins} {numWins === 1 ? "win" : "wins"} in {numTurns} {numTurns === 1 ? "round" : "rounds"} for {totalScore} {totalScore === 1 ? "point" : "points"}
            </div>
          )}
          <button
            onClick={() => setShowPreviousRounds(!showPreviousRounds)}
            className="text-blue-500 hover:text-blue-700 underline cursor-pointer flex items-center gap-1"
          >
            <b>{showPreviousRounds ? 'Hide' : 'See'} Previous Rounds {showPreviousRounds ? '▲' : '▼'}</b>
          </button>
          {showPreviousRounds && <div className="mt-2">{prevTurns}</div>}
        </div>
      )}
    </div>
  );
}
