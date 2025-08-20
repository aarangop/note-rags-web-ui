"use client";

import { createContext, useContext } from "react";
import { components } from "../api/notes/types";
import { SaveStatus } from "../stores/notes";

type Note = components["schemas"]["Note"];

export interface NoteContextValue {
  id: number;
  note: Note | null;
  placeholder: string;
  status: SaveStatus;
  isLoading: boolean;
  error: Error | null;
  updateContent: (newContent: string) => void;
  updateTitle: (newTitle: string) => void;
  saveNote: () => void;
  deleteNote: () => void;
}

export const NoteContext = createContext<NoteContextValue | null>(null);

export function useNoteContext(): NoteContextValue {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error("useNoteContext must be used within a NoteProvider");
  }
  return context;
}
