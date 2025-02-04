import { createContext, useContext, useState, ReactNode } from 'react';

interface GameContextType {
  gameIDsToRespondTo: number[];
  setGameIDsToRespondTo: (gameIDs: number[]) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameIDsToRespondTo, setGameIDsToRespondTo] = useState<number[]>([]);

  return (
    <GameContext.Provider value={{
      gameIDsToRespondTo,
      setGameIDsToRespondTo
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
} 