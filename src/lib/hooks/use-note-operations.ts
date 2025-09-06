import { useCallback } from "react";
import { useCreateNote, useUpdateNoteContent, useDeleteNote } from "./use-notes";
import { useNotesStore } from "../stores";

export function useNoteOperations() {
  const updateContent = useNotesStore((state) => state.updateContent);
  const setNote = useNotesStore((state) => state.setNote);
  const clearNote = useNotesStore((state) => state.clearNote);
  const getNote = useNotesStore((state) => state.getNote);
  
  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNoteContent();
  const deleteNoteMutation = useDeleteNote();
  
  const updateNoteContent = useCallback(
    async (noteId: number, content: string) => {
      updateContent(noteId, content);
      
      const note = getNote(noteId);
      if (note) {
        const updatedNote = await updateNoteMutation.mutateAsync({
          id: noteId,
          content
        });
        setNote(updatedNote);
        return updatedNote;
      }
    },
    [updateContent, getNote, updateNoteMutation, setNote]
  );
  
  const updateNoteTitle = useCallback(
    async (noteId: number, title: string) => {
      const note = getNote(noteId);
      if (note) {
        const updatedNote = await updateNoteMutation.mutateAsync({
          id: noteId,
          title
        });
        setNote(updatedNote);
        return updatedNote;
      }
    },
    [getNote, updateNoteMutation, setNote]
  );
  
  const deleteNote = useCallback(
    async (noteId: number) => {
      await deleteNoteMutation.mutateAsync(noteId);
      clearNote(noteId);
    },
    [deleteNoteMutation, clearNote]
  );
  
  const createNote = useCallback(
    async (data: { title: string; content: string }) => {
      const newNote = await createNoteMutation.mutateAsync(data);
      setNote(newNote);
      return newNote;
    },
    [createNoteMutation, setNote]
  );
  
  return {
    updateContent: updateNoteContent,
    updateTitle: updateNoteTitle,
    deleteNote,
    createNote,
    mutations: {
      create: createNoteMutation,
      update: updateNoteMutation,
      delete: deleteNoteMutation,
    }
  };
}