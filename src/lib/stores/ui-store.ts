import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { UIStore } from './notes-store.types';

// Enable Map and Set support in immer (if not already enabled)
enableMapSet();

export const useUIStore = create<UIStore>()(
  immer((set, get) => ({
    // === STATE ===
    errors: new Map<number, string>(),

    // === ACTIONS ===
    setError: (id, error) => set((state) => {
      state.errors.set(id, error);
    }),

    clearError: (id) => set((state) => {
      state.errors.delete(id);
    }),

    reset: () => set((state) => {
      state.errors.clear();
    }),

    // === SELECTORS ===
    getError: (id) => {
      return get().errors.get(id);
    },
  }))
);