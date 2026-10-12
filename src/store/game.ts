import { create } from 'zustand';
import type { Game } from '@/lib/types';

interface GameState {
  game: Game | null;
  setGame: (game: Game | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  game: null,
  setGame: (game) => {
      if (game) {
        localStorage.setItem('activeGameId', game.id);
      } else {
        localStorage.removeItem('activeGameId');
      }
      set({ game })
    },
}));
