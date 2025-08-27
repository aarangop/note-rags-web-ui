"use client";
import { components } from "@/lib/api/notes/types";
import { NoteContext, NoteContextValue } from "@/lib/contexts/note-context";
import {
  useDeleteNote,
  useNote,
  useUpdateNoteContent,
} from "@/lib/hooks/use-notes";
import { SaveStatus } from "@/lib/stores/notes-store";
import React, { useCallback, useEffect, useRef, useState } from "react";

type Note = components["schemas"]["Note"];

interface NoteProviderProps {
  noteId: number;
  placeholder: string;
  debounceTimeout?: number;
  onSave?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
}

export default function NoteProvider({
  noteId,
  placeholder,
  debounceTimeout = 2000,
  onSave = () => {},
  onDelete = () => {},
  children,
}: NoteProviderProps) {
  // Local state
  const [status, setStatus] = useState<SaveStatus>("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const saveInProgressRef = useRef(false);
  const [localNote, setLocalNote] = useState<Note | null>(null);

  // API hooks
  const { data: fetchedNote, isLoading, error } = useNote(noteId);
  const updateNoteMutation = useUpdateNoteContent();
  const deleteNoteMutation = useDeleteNote();

  useEffect(() => {
    if (fetchedNote) {
      console.log("Setting fetched note", fetchedNote);
      setLocalNote(fetchedNote);
    }
  }, [fetchedNote]);

  // Update methods
  const saveNote = useCallback(async () => {
    if (saveInProgressRef.current || !localNote) return;

    saveInProgressRef.current = true;
    try {
      await updateNoteMutation.mutateAsync({
        ...localNote,
        id: noteId,
      });

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error("Save failed:", error);
      setStatus("error");
    } finally {
      saveInProgressRef.current = false;
    }
  }, [noteId, localNote, updateNoteMutation, onSave]);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setStatus("saving");
      await saveNote();
    }, debounceTimeout);
  }, [debounceTimeout, saveNote]);

  const updateContent = useCallback(
    (newContent: string) => {
      setStatus("unsaved");
      if (!localNote) return;
      if (localNote.content !== newContent) {
        setLocalNote({ ...localNote, content: newContent });
        debouncedSave();
      }
    },
    [localNote, debouncedSave]
  );

  const updateTitle = useCallback(
    async (newTitle: string) => {
      setStatus("unsaved");
      if (!localNote) return;
      if (localNote.title !== newTitle) {
        setLocalNote({ ...localNote, title: newTitle });
        await saveNote();
      }
    },
    [localNote, saveNote]
  );

  const deleteNote = useCallback(async () => {
    try {
      await deleteNoteMutation.mutateAsync(noteId);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  }, [noteId, deleteNoteMutation, onDelete]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Update status based on mutation state
  useEffect(() => {
    if (updateNoteMutation.isPending) {
      setStatus("saving");
    }
    if (updateNoteMutation.isSuccess) {
      setStatus("saved");
    }
    if (updateNoteMutation.isError) {
      setStatus("error");
    }
  }, [
    updateNoteMutation.isPending,
    updateNoteMutation.isSuccess,
    updateNoteMutation.isError,
    noteId,
  ]);
  const contextValue: NoteContextValue = {
    id: noteId,
    note: localNote,
    placeholder,
    status,
    isLoading,
    error,
    updateContent,
    updateTitle,
    saveNote,
    deleteNote,
  };

  return (
    <NoteContext.Provider value={contextValue}>{children}</NoteContext.Provider>
  );
}
