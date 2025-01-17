import { FormEvent, useState } from "react";
import { PlayerState } from "../[...players]";
import Explainer from "./Explainer";

type GameStateProps = {
  playerState: PlayerState,
  startTurn: () => void,
  submitAnswer: (submission: string) => boolean,
  previousTurns: Turn[],
  currentTurn: Turn | null,
  completedTurn: Turn | null,
}

export type Submission = {
  // turn info:
  turn_id: number,
  rareness_score: number | null,
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
  rareness_score: number | null,
  speed_score: number | null,
  word1: string,
  word2: string,
  created_at: string,
  completed_at: string | null,
  submissions: Submission[],
}

export default function GameState({
  playerState,
  startTurn,
  submitAnswer,
  previousTurns,
  currentTurn,
  completedTurn
}: GameStateProps) {

  const [answer, setAnswer] = useState("");
  const [showPreviousRounds, setShowPreviousRounds] = useState(false);


  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitAnswer(answer)) {
      setAnswer("");
    };
  }

  const prevTurns = (previousTurns || []).map((turn, idx) =>
    <div key={idx}>
      <span className="text-orange-500"><b>Round {idx + 1}. </b></span>
      <br />Score: <b>{(turn.rareness_score || 0) + (turn.speed_score || 0)}</b> {((turn.rareness_score || 0) + (turn.speed_score || 0)) > 0 ?
        <span>
          (Rareness: {(turn.rareness_score || 0)}, Speed: {(turn.speed_score || 0)})
        </span> : ""}
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
              <b>Submission {idx + 1}: </b>{submission.link1} {submission.link2}
            </div>
          )
        )
      })}
      {lastLink1 && lastLink2 && (
        <div>Now think of a word that connects <b>{lastLink1}</b> and <b>{lastLink2}</b>!</div>
      )}
    </div>
  );

  const justCompletedTurn = completedTurn && (
    <div>
      <b>Round complete! </b>
      {completedTurn.speed_score || 0 > 0 ?
        <div className="text-green-500">Congrats! You won this round in {6 - (completedTurn.speed_score || 0)} {6 - (completedTurn.speed_score || 0) === 1 ? "try" : "tries"}!</div> :
        <div className="text-red-500">Unfortunately, you did not win this round. Try again!</div>}
      {((completedTurn.speed_score || 0) > 0 && lastLink1 === lastLink2) && (<div className="text-green-500">You and your partner both submitted <b>{lastLink1}</b>!</div>)}
      {((completedTurn.speed_score || 0) > 0 && lastLink1 !== lastLink2) && (<div className="text-green-500">You and your partner submitted <b>{lastLink1}</b> and <b>{lastLink2}</b>!</div>)}
    </div>);

  return (
    <div>
      {previousTurns == null || (previousTurns.length == 0 && completedTurn == null && lastLink1 == "" && lastLink2 == "") &&
        <Explainer />
      }
      {(playerState == PlayerState.NoRound) &&
        <button
          className="mt-4 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44 mx-auto"
          onClick={startTurn}
        >
          Start new round
        </button>
      }
      {(playerState == PlayerState.RoundToPlayNoMatch) &&
        <div className="text-purple-500">Your submission didn&apos;t match your partner&apos;s submission. Try again!</div>
      }
      {(playerState == PlayerState.RoundToPlay || playerState == PlayerState.RoundToPlayNoMatch) &&
        <div>
          It&apos;s your turn.
          <button
            className="mt-4 rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44 mx-auto"
            onClick={startTurn}
          >
            Play round.
          </button>
        </div>
      }
      {(playerState == PlayerState.Playing) &&
        <div>
          <div className="mb-2">
            Your starting words {lastLink1 && lastLink2 ? "were: " : "are: "} <b>{currentTurn?.word1}</b> and <b>{currentTurn?.word2}</b>.
            <br />
            <br />
            {lastLink1 === "" && lastLink2 === "" ? "Think of a word that connects them!" : thisTurn}
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              className="block w-full px-4 py-3 text-base text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors"
              placeholder="Enter link..."
            />
            <button
              type="submit"
              className="w-full sm:w-auto rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 transition-colors duration-200 flex items-center justify-center"
            >
              Submit Answer
            </button>
          </form>
        </div>
      }
      {(playerState == PlayerState.NeedTeammate) &&
        <div className="mb-2">Send your link to a friend to play.</div>
      }
      {(playerState == PlayerState.Waiting) &&
        <div className="mb-2 text-purple-500 max-w-md"><b>Status: </b>Waiting for your partner to complete this round. The page will auto-update when they submit!</div>
      }
      {justCompletedTurn}
      {previousTurns?.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowPreviousRounds(!showPreviousRounds)}
            className="text-blue-500 hover:text-blue-700 underline cursor-pointer flex items-center gap-1"
          >
            <b>{showPreviousRounds ? 'Hide' : 'See'} Previous Rounds {showPreviousRounds ? '▼' : '▶'}</b>
          </button>
          {showPreviousRounds && <div className="mt-2">{prevTurns}</div>}
        </div>
      )}
    </div>
  );
}
