import { useCallback, useEffect, useMemo, useRef } from "react";
import type { INotesRepository } from "../api/interfaces/notes-repository.interface";
import { useUpdateNote } from "../api/notes/queries";
import AutoSaveService from "../services/auto-save-service";
import type { AutoSaveConfig } from "../services/auto-save-service.types";
import { DEFAULT_AUTO_SAVE_CONFIG } from "../services/auto-save-service.types";
import { useNotesStore, useUIStore } from "../stores";

interface UseAutoSaveOptions {
  repository: INotesRepository;
  config?: Partial<AutoSaveConfig>;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  saveStatus: import("../services/auto-save-service.types").SaveStatus;
  lastSaved: Date | null;
  error: string | undefined;
  forceSave: () => Promise<void>;
  hasUnsavedChanges: boolean;
}

export function useAutoSave(
  noteId: number,
  options: UseAutoSaveOptions
): UseAutoSaveReturn {
  const { repository, config, enabled = true } = options;

  // Zustand store selectors
  const getCurrentContent = useNotesStore((state) => state.getCurrentContent);
  const setNote = useNotesStore((state) => state.setNote);
  const hasUnsavedChanges = useNotesStore((state) =>
    state.hasUnsavedChanges(noteId)
  );

  const setSaveStatus = useUIStore((state) => state.setSaveStatus);
  const setError = useUIStore((state) => state.setError);
  const clearError = useUIStore((state) => state.clearError);
  const getSaveStatus = useUIStore((state) => state.getSaveStatus);
  const getError = useUIStore((state) => state.getError);
  
  // Get note for updated_at timestamp
  const getNote = useNotesStore((state) => state.getNote);

  // React Query mutation
  const updateNoteMutation = useUpdateNote(repository, {
    onSuccess: (updatedNote) => {
      setNote(updatedNote);
    },
  });

  // Service reference
  const serviceRef = useRef<AutoSaveService | null>(null);

  // Memoized callbacks for AutoSaveService
  const callbacks = useMemo(
    () => ({
      getCurrentContent: () => getCurrentContent(noteId),
      saveToAPI: async (content: string) => {
        const result = await updateNoteMutation.mutateAsync({
          id: noteId,
          update: { content },
        });
        return result;
      },
      onSaveSuccess: (savedNote: any) => {
        setNote(savedNote);
        clearError(noteId);
      },
      onSaveError: (error: Error) => {
        setError(noteId, error.message);
      },
      onStatusChange: (
        status: import("../services/auto-save-service.types").SaveStatus
      ) => {
        setSaveStatus(noteId, status);
      },
    }),
    [
      noteId,
      getCurrentContent,
      updateNoteMutation,
      setNote,
      clearError,
      setError,
      setSaveStatus,
    ]
  );

  // Initialize AutoSaveService
  useEffect(() => {
    if (!enabled) return;

    const finalConfig = config
      ? { ...DEFAULT_AUTO_SAVE_CONFIG, ...config }
      : undefined;
    serviceRef.current = new AutoSaveService(noteId, callbacks, finalConfig);

    return () => {
      if (serviceRef.current) {
        serviceRef.current.destroy();
        serviceRef.current = null;
      }
    };
  }, [noteId, enabled, callbacks, config]);

  // Queue save function (for triggering auto-save)
  const queueSave = useCallback(() => {
    if (serviceRef.current && enabled) {
      serviceRef.current.queueSave();
    }
  }, [enabled]);

  // Force save function (for manual saves)
  const forceSave = useCallback(async () => {
    if (serviceRef.current && enabled) {
      return serviceRef.current.forceSave();
    }
  }, [enabled]);

  // Auto-trigger save when content changes and service is available
  useEffect(() => {
    if (hasUnsavedChanges && enabled) {
      queueSave();
    }
  }, [hasUnsavedChanges, queueSave, enabled]);

  const note = getNote(noteId);
  
  return {
    saveStatus: getSaveStatus(noteId),
    lastSaved: note?.updated_at ? new Date(note.updated_at) : null,
    error: getError(noteId),
    forceSave,
    hasUnsavedChanges,
  };
}
