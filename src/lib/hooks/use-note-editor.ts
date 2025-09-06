import { useCallback, useEffect, useRef } from "react";
import { useRepository } from "../../components/providers/repository-provider";
import { useAutoSave } from "./use-auto-save";
import { useNoteOperations } from "./use-note-operations";
import { useNotesStore } from "../stores";
import type { AutoSaveConfig } from "../services/auto-save-service.types";
import type { Note } from "../stores/notes-store.types";

interface UseNoteEditorOptions {
  autoSave?: {
    enabled?: boolean;
    config?: Partial<AutoSaveConfig>;
  };
}

export function useNoteEditor(
  noteId: number,
  initialNote: Note,
  options: UseNoteEditorOptions = {}
) {
  const { autoSave = { enabled: true } } = options;

  const { notesRepository } = useRepository();

  // Initialize store with the initial note
  const setNote = useNotesStore((state) => state.setNote);
  const updateContentStore = useNotesStore((state) => state.updateContent);
  const selectNote = useNotesStore((state) => state.selectNote);
  
  // Track what we've initialized to avoid overwriting user edits
  const initializedRef = useRef<number | null>(null);

  useEffect(() => {
    // Only initialize if we haven't initialized this specific note yet
    if (initializedRef.current !== noteId) {
      setNote(initialNote);
      updateContentStore(noteId, initialNote.content);
      initializedRef.current = noteId;
    }
  }, [setNote, updateContentStore, noteId, initialNote]);

  const { updateTitle, deleteNote, createNote, mutations } =
    useNoteOperations();

  const autoSaveResult = useAutoSave(noteId, {
    repository: notesRepository,
    config: autoSave.config,
    enabled: autoSave.enabled,
  });

  // Make these reactive to store changes
  const currentContent = useNotesStore((state) => {
    const editingContent = state.editingContent.get(noteId);
    if (editingContent !== undefined) return editingContent;

    const note = state.notes.get(noteId);
    return note?.content || "";
  });

  const hasChanges = useNotesStore((state) => {
    const editingContent = state.editingContent.get(noteId);
    const note = state.notes.get(noteId);

    if (!editingContent || !note) return false;
    return editingContent !== note.content;
  });


  const handleUpdateContent = useCallback(
    (content: string) => {
      updateContentStore(noteId, content);
    },
    [updateContentStore, noteId]
  );

  const handleUpdateTitle = useCallback(
    (title: string) => {
      return updateTitle(noteId, title);
    },
    [updateTitle, noteId]
  );

  const handleDeleteNote = useCallback(() => {
    return deleteNote(noteId);
  }, [deleteNote, noteId]);

  const selectThisNote = useCallback(() => {
    selectNote(noteId);
  }, [selectNote, noteId]);

  return {
    note: initialNote,
    content: currentContent,
    error: autoSaveResult.error,
    hasUnsavedChanges: hasChanges,

    updateContent: handleUpdateContent,
    updateTitle: handleUpdateTitle,
    deleteNote: handleDeleteNote,
    createNote,
    selectNote: selectThisNote,

    saveStatus: autoSaveResult.saveStatus,
    lastSaved: autoSaveResult.lastSaved,
    forceSave: autoSaveResult.forceSave,

    mutations,
  };
}
