import { useMemo, useCallback } from "react";
import { components } from "../api/notes/types";
import { useNotesStore } from "../stores";
import { SaveStatus } from "../types/save-status.types";
import { useDebouncedCallback } from "./use-debounced-callback";
import { useDeleteNote, useNote, useUpdateNote } from "./use-notes";

type Note = components["schemas"]["Note"];

interface UseNoteEditorReturn {
  note: Note | undefined;
  isLoading: boolean;
  error?: Error | null;
  saveStatus: SaveStatus;
  handleContentChange: (newContent: string) => void;
  handleNoteSave: () => void;
  handleTitleChanged: (newTitle: string) => Promise<void>;
  handleDelete: () => void;
}

interface UseNoteEditorProps {
  noteId: number;
  autoSaveEnabled?: boolean;
  onNoteDeleted?: () => void;
}

export default function useNoteEditor({
  noteId,
  autoSaveEnabled = true,
  onNoteDeleted = () => {},
}: UseNoteEditorProps): UseNoteEditorReturn {
  const {
    data: note,
    isLoading: fetchIsLoading,
    error: fetchError,
  } = useNote(noteId);

  const saveStatus = useNotesStore((state) => state.getNoteStatus(noteId));

  const saveNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const { updateContent, getCurrentContent, setNoteStatus } = useNotesStore();

  // Stabilize note object to prevent unnecessary re-renders
  // Only create new reference when content actually changes
  const stableNote = useMemo(() => {
    if (!note) return undefined;
    
    // Get current content from store
    const currentContent = getCurrentContent(noteId);
    
    // If store has content and it differs from fetched note, prioritize store content
    // This prevents re-renders when local changes are newer than fetched data
    const effectiveContent = currentContent || note.content;
    
    // Only create new object if content actually differs
    if (effectiveContent === note.content) {
      return note; // Return original reference to prevent re-renders
    }
    
    return {
      ...note,
      content: effectiveContent,
    };
  }, [note, getCurrentContent, noteId]);

  // Unified loading state: true if any operation is in progress
  // Exclude saves since we have optimistic updates - only show loading for initial fetch and deletes
  const isLoading =
    (fetchIsLoading && !note) || // Only show loading on initial fetch, not refetch
    deleteNoteMutation.isPending; // Only show loading for deletes (destructive operation)

  // Unified error state: prioritize fetch error, then save error, then delete error
  const error =
    fetchError || saveNoteMutation.error || deleteNoteMutation.error;

  const handleNoteSave = useCallback(async () => {
    setNoteStatus(noteId, "saving");
    try {
      await saveNoteMutation.mutateAsync({
        id: noteId,
        update: { content: getCurrentContent(noteId) },
      });
      setNoteStatus(noteId, "saved");
    } catch (error) {
      setNoteStatus(noteId, "error");
      throw error; // Re-throw to expose in unified error state
    }
  }, [noteId, saveNoteMutation, getCurrentContent, setNoteStatus]);

  const [debouncedSave] = useDebouncedCallback(handleNoteSave, 2000, [
    handleNoteSave,
  ]);

  const handleContentChange = useCallback((newContent: string) => {
    setNoteStatus(noteId, "unsaved");
    updateContent(noteId, newContent);
    if (autoSaveEnabled) {
      debouncedSave();
    }
  }, [noteId, setNoteStatus, updateContent, autoSaveEnabled, debouncedSave]);

  const handleTitleChanged = useCallback(async (newTitle: string) => {
    setNoteStatus(noteId, "saving");
    try {
      await saveNoteMutation.mutateAsync({
        id: noteId,
        update: { title: newTitle },
      });
      setNoteStatus(noteId, "saved");
    } catch (error) {
      setNoteStatus(noteId, "error");
      throw error; // Re-throw to expose in unified error state
    }
  }, [noteId, saveNoteMutation, setNoteStatus]);

  const handleDelete = useCallback(async () => {
    await deleteNoteMutation.mutateAsync(noteId);
    onNoteDeleted();
  }, [deleteNoteMutation, noteId, onNoteDeleted]);

  return {
    note: stableNote,
    isLoading,
    error,
    saveStatus,
    handleContentChange,
    handleNoteSave,
    handleTitleChanged,
    handleDelete,
  };
}
