import { create } from "zustand";
import type { INotesRepository } from "../api/interfaces/notes-repository.interface";
import { NotesRepository } from "../api/repositories/notes-repository";
import useApiClient from "../hooks/use-api-client";

interface RepositoryStore {
  // === STATE ===
  notesRepository: INotesRepository | null;

  // === ACTIONS ===
  setNotesRepository: (repository: INotesRepository) => void;
  getNotesRepository: () => INotesRepository;
}

export const useRepositoryStore = create<RepositoryStore>((set, get) => ({
  // === STATE ===
  notesRepository: null,

  // === ACTIONS ===
  setNotesRepository: (repository: INotesRepository) => {
    set({ notesRepository: repository });
  },

  getNotesRepository: () => {
    const { notesRepository } = get();
    if (!notesRepository) {
      throw new Error(
        "NotesRepository not initialized. Call setNotesRepository first."
      );
    }
    return notesRepository;
  },
}));
