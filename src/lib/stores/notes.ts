import { create } from 'zustand';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved';

interface NotesUIState {
  // UI-only state
  searchQuery: string;
  saveStatus: SaveStatus;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  resetSaveStatus: () => void;
}

export const useNotesUIStore = create<NotesUIState>((set) => ({
  // Initial state
  searchQuery: '',
  saveStatus: 'idle',

  // Actions
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSaveStatus: (status: SaveStatus) => {
    set({ saveStatus: status });
  },

  resetSaveStatus: () => {
    set({ saveStatus: 'idle' });
  },
}));