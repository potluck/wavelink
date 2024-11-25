import { FormEvent, useState } from "react";
import { PlayerState } from "../[...players]";

type GameStateProps = {
  playerState: PlayerState,
  startTurn: () => void,
  submitAnswer: (submission: string) => boolean,
  previousTurns: Turn[],
  currentTurn: Turn | null,
  thisLower: boolean
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
  // thisLower,
  completedTurn
} : GameStateProps) {

  const [answer, setAnswer] = useState("");


  function handleSubmit(e : FormEvent<HTMLFormElement>){
    e.preventDefault();
    if (submitAnswer(answer)) {
      setAnswer("");
    };
  }

  const prevTurns = (previousTurns || []).map((turn, idx) =>
    <li key={idx}>
      <b>Round {idx + 1}. </b>
      <br />- Score: {(turn.rareness_score || 0) + (turn.speed_score || 0)} (Rareness: {(turn.rareness_score || 0)}, Speed: {(turn.speed_score || 0)})
      <br />- Words: {turn.word1}, {turn.word2}
      {/* <br />- Your submission: {thisLower? round.link1:round.link2}, Their submission: {thisLower? round.link2:round.link1} */}
    </li>
  ).reverse();

  const justCompletedTurn = completedTurn && (
  <div>
    <b>Round complete! </b>
    <br />- Score: {(completedTurn.rareness_score || 0) + (completedTurn.speed_score || 0)} (Rareness: {(completedTurn.rareness_score || 0)}, Speed: {(completedTurn.speed_score || 0)})
    <br />- Words: {completedTurn.word1}, {completedTurn.word2}
    {/* <br />- Your submission: {thisLower? completedRound.link1:completedRound.link2}, Their submission: {thisLower? completedRound.link2:completedRound.link1} */}
  </div>);

  const thisTurn = currentTurn && (
    <div>
      {currentTurn.submissions.map((submission, idx) =>
        submission.link1 && submission.link2 && (
          <div key={idx}>
            <b>Submission {idx+1}: </b>{submission.link1} {submission.link2}
          </div>
      ))}
    </div>
  );

  // TODO: loading state
  return (
    <div>
      {previousTurns == null || previousTurns.length == 0 && completedTurn == null &&
      <div>
        <li>
          This is a game of making connections between words <b>while being on a similar wavelength as your partner</b>.
        </li>
        <br />
        <li>
          Rounds are quick! Spend less than 20 seconds for a round. In each round, you receive 2 words.
        </li>
        <br />
        <li>
          You and your partner will each submit a single word that connects those clues. Your mission is:
        </li>
        <li>&nbsp;</li>
        <li>
          1) Submit the same word as your partner.
        </li>
        <li>&nbsp;</li>
        <li>
          2) Submit a more uncommon word. This gets you bonus points, but only if you and your partner submit the same word!
        </li>
        <br />
        </div>
      }
    { (playerState == PlayerState.NoRound ) &&
      <button
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44 mx-auto"
          onClick={startTurn}
      >
        Start new round
      </button>
  }
    { (playerState == PlayerState.RoundToPlay ) &&
      <div>
        It&apos;s your turn.
      <button
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44 mx-auto"
          onClick={startTurn}
      >
        Play round.
      </button>
      </div>
  }
  { (playerState == PlayerState.Playing ) &&
    <div>
      <li className="mb-2">
        Your starting words are: {currentTurn?.word1} and {currentTurn?.word2}.
        {thisTurn}
      </li>
      <form onSubmit={handleSubmit}>
        <input
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          className={"block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"}
          placeholder={"Input wavelink..."}
        />
        <button
          type="submit"
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44 mx-auto"
        >
          Submit
        </button>
      </form>
    </div>
  }
  { (playerState == PlayerState.NeedTeammate ) &&
      <li className="mb-2">Send your link to a friend to play.</li>
  }
  { (playerState == PlayerState.Waiting ) &&
      <li className="mb-2">Waiting for your partner to complete this round. The page will update when they submit!</li>
  }
  {justCompletedTurn}
  {previousTurns?.length>0 && <div><b>Previous Rounds:</b> {prevTurns}</div>}
  </div>
  );
}
