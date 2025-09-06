import { useEffect } from "react";
import { useNote } from "./use-notes";
import { useNotesStore } from "../stores";

interface UseNoteSyncOptions {
  enabled?: boolean;
}

export function useNoteSync(noteId: number, options: UseNoteSyncOptions = {}) {
  const { enabled = true } = options;

  const setNote = useNotesStore((state) => state.setNote);
  const getNote = useNotesStore((state) => state.getNote);
  const updateContent = useNotesStore((state) => state.updateContent);

  const { data: fetchedNote, isLoading, error } = useNote(noteId);

  useEffect(() => {
    if (fetchedNote && enabled) {
      setNote(fetchedNote);
      // Initialize editing content with the note's content if not already set
      const existingEditingContent = useNotesStore.getState().editingContent.get(noteId);
      if (!existingEditingContent) {
        updateContent(noteId, fetchedNote.content);
      }
    }
  }, [fetchedNote, setNote, updateContent, noteId, enabled]);

  const localNote = getNote(noteId);

  return {
    note: localNote || fetchedNote,
    isLoading,
    error,
    isSynced: !!localNote && !!fetchedNote,
  };
}
