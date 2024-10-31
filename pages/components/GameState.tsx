import { FormEvent, useState } from "react";
import { PlayerState } from "../[...players]";

type GameStateProps = {
  playerState: PlayerState,
  startTurn: () => void,
  submitAnswer: (submission: string) => boolean,
  previousRounds: Round[],
  currentRound: Round | null,
  thisLower: boolean
  completedRound: Round | null,
}

export type Round = {
  id: number,
  similarity_score: number | null,
  rareness_score: number | null,
  word1: string,
  word2: string,
  link1: string | null,
  link2: string | null,
  created_at: string,
  completed_at: string | null,
}

export default function GameState({
  playerState,
  startTurn,
  submitAnswer,
  previousRounds,
  currentRound,
  thisLower,
  completedRound
} : GameStateProps) {

  const [answer, setAnswer] = useState("");


  function handleSubmit(e : FormEvent<HTMLFormElement>){
    e.preventDefault();
    if (submitAnswer(answer)) {
      setAnswer("");
    };
  }

  const prevRounds = (previousRounds || []).map((round, idx) =>
    <li key={idx}>
      <b>Round {idx + 1}. </b>
      <br />- Score: {(round.similarity_score || 0) + (round.rareness_score || 0)} (Similarity: {(round.similarity_score || 0)}, Rareness: {(round.rareness_score || 0)})
      <br />- Words: {round.word1}, {round.word2}
      <br />- Your submission: {thisLower? round.link1:round.link2}, Their submission: {thisLower? round.link2:round.link1}
    </li>
  ).reverse();

  const justCompletedRound = completedRound && (
  <div>
    <b>Round complete! </b>
    <br />- Score: {(completedRound.similarity_score || 0) + (completedRound.rareness_score || 0)} (Similarity: {(completedRound.similarity_score || 0)}, Rareness: {(completedRound.rareness_score || 0)})
    <br />- Words: {completedRound.word1}, {completedRound.word2}
    <br />- Your submission: {thisLower? completedRound.link1:completedRound.link2}, Their submission: {thisLower? completedRound.link2:completedRound.link1}
  </div>);


  // TODO: loading state
  return (
    <div>
      {previousRounds == null || previousRounds.length == 0 && completedRound == null &&
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
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
          onClick={startTurn}
      >
        Play round.
      </button>
      </div>
  }
  { (playerState == PlayerState.Playing ) &&
    <div>
      <li className="mb-2">
        Your words are: {currentRound?.word1} and {currentRound?.word2}.
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
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
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
      <li className="mb-2">Waiting for your partner to complete this round. You will need to refresh to see their submission.</li>
  }
  {justCompletedRound}
  {previousRounds?.length>0 && <div><b>Previous Rounds:</b> {prevRounds}</div>}
  </div>
  );
}
