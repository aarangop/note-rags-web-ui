import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { UIStore } from './notes-store.types';
import { SaveStatus } from '../services/auto-save-service.types';

// Enable Map and Set support in immer (if not already enabled)
enableMapSet();

export const useUIStore = create<UIStore>()(
  immer((set, get) => ({
    // === STATE ===
    saveStatus: new Map<number, SaveStatus>(),
    errors: new Map<number, string>(),

    // === ACTIONS ===
    setSaveStatus: (id, status) => set((state) => {
      state.saveStatus.set(id, status);
    }),

    setError: (id, error) => set((state) => {
      state.errors.set(id, error);
    }),

    clearError: (id) => set((state) => {
      state.errors.delete(id);
    }),

    reset: () => set((state) => {
      state.saveStatus.clear();
      state.errors.clear();
    }),

    // === SELECTORS ===
    getSaveStatus: (id) => {
      return get().saveStatus.get(id) || 'idle';
    },

    getError: (id) => {
      return get().errors.get(id);
    },
  }))
);