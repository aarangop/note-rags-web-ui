import { useCallback } from "react";
import { useUpdateNote } from "./use-notes";
import { components } from "../api/notes/types";

type NoteUpdate = components["schemas"]["NoteUpdate"];

export default function useSaveNote() {
  const saveNoteMutation = useUpdateNote();

  const saveNote = useCallback(
    async (id: number, update: Partial<NoteUpdate> = {}) => {
      return await saveNoteMutation.mutateAsync({
        id,
        update,
      });
    },
    [saveNoteMutation]
  );

  return {
    saveNote,
    isLoading: saveNoteMutation.isPending,
    error: saveNoteMutation.error,
  };
}
