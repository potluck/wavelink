import { FormEvent, useState } from "react";
import { PlayerState } from "../[...players]";

type GameStateProps = {
  playerState: PlayerState,
  startTurn: () => void,
  word1: string,
  word2: string,
  submitAnswer: (submission: string) => void,
}

export default function GameState({
  playerState,
  startTurn,
  word1,
  word2,
  submitAnswer,
} : GameStateProps) {

  const [answer, setAnswer] = useState("");


  function handleSubmit(e : FormEvent<HTMLFormElement>){
    e.preventDefault();
    submitAnswer(answer);
  }

  return (
    <div>
    { (playerState == PlayerState.NoRound ) &&
      <button
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
          onClick={startTurn}
      >
        Start round
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
        Your words are: {word1} and {word2}.
      </li>
      <form onSubmit={handleSubmit}>
        <textarea
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
      <li className="mb-2">Waiting for your friend to complete this round.</li>
  }
  </div>
  );
}
