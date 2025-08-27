import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type {
  INotesRepository,
  Note,
} from "../api/interfaces/notes-repository.interface";
import { useUpdateNote } from "../api/notes/queries";
import AutoSaveService from "../services/auto-save-service";
import { useNotesStore, useUIStore } from "../stores";
import { useAutoSave } from "./use-auto-save";

// Mock dependencies
vi.mock("../stores");
vi.mock("../api/notes/queries");
vi.mock("../services/auto-save-service");

// Mock implementations
const mockNotesStore = {
  getCurrentContent: vi.fn(),
  setNote: vi.fn(),
  hasUnsavedChanges: vi.fn(),
  getNote: vi.fn(),
};

const mockUIStore = {
  setSaveStatus: vi.fn(),
  setError: vi.fn(),
  clearError: vi.fn(),
  getSaveStatus: vi.fn(),
  getError: vi.fn(),
};

const mockUpdateNoteMutation = {
  mutateAsync: vi.fn(),
};

const mockRepository: INotesRepository = {
  getNotes: vi.fn(),
  getNoteById: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
};

const MockAutoSaveService = vi.mocked(AutoSaveService);

describe("useAutoSave", () => {
  const noteId = 1;
  const testNote: Note = {
    id: noteId,
    user_id: "test-user",
    file_path: "/test/note.md",
    title: "Test Note",
    content: "Test content",
    document_type: "note" as const,
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:00:00Z",
    metadata: {},
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock implementations
    (useNotesStore as unknown as Mock).mockImplementation((selector) => {
      const store = {
        getCurrentContent: mockNotesStore.getCurrentContent,
        setNote: mockNotesStore.setNote,
        hasUnsavedChanges: mockNotesStore.hasUnsavedChanges,
        getNote: mockNotesStore.getNote,
      };
      return selector(store);
    });

    (useUIStore as unknown as Mock).mockImplementation((selector) => {
      const store = {
        setSaveStatus: mockUIStore.setSaveStatus,
        setError: mockUIStore.setError,
        clearError: mockUIStore.clearError,
        getSaveStatus: mockUIStore.getSaveStatus,
        getError: mockUIStore.getError,
      };
      return selector(store);
    });

    (useUpdateNote as Mock).mockReturnValue(mockUpdateNoteMutation);

    // Default store states
    mockNotesStore.getCurrentContent.mockReturnValue("Test content");
    mockNotesStore.hasUnsavedChanges.mockReturnValue(false);
    mockNotesStore.getNote.mockReturnValue(testNote);
    mockUIStore.getSaveStatus.mockReturnValue("idle");
    mockUIStore.getError.mockReturnValue(undefined);
  });

  describe("Initialization", () => {
    it("should initialize AutoSaveService with correct parameters", () => {
      renderHook(() => useAutoSave(noteId, { repository: mockRepository }));

      expect(MockAutoSaveService).toHaveBeenCalledWith(
        noteId,
        expect.objectContaining({
          getCurrentContent: expect.any(Function),
          saveToAPI: expect.any(Function),
          onSaveSuccess: expect.any(Function),
          onSaveError: expect.any(Function),
          onStatusChange: expect.any(Function),
        }),
        undefined
      );
    });

    it("should pass custom config merged with defaults to AutoSaveService", () => {
      const customConfig = { debounceMs: 5000 };

      renderHook(() =>
        useAutoSave(noteId, {
          repository: mockRepository,
          config: customConfig,
        })
      );

      expect(MockAutoSaveService).toHaveBeenCalledWith(
        noteId,
        expect.any(Object),
        expect.objectContaining({
          debounceMs: 5000,
          retryAttempts: 3,
          retryDelayMs: 1000,
        })
      );
    });

    it("should not initialize AutoSaveService when disabled", () => {
      renderHook(() =>
        useAutoSave(noteId, {
          repository: mockRepository,
          enabled: false,
        })
      );

      expect(MockAutoSaveService).not.toHaveBeenCalled();
    });

    it("should destroy service on unmount", () => {
      const mockDestroy = vi.fn();
      MockAutoSaveService.mockImplementation(() => ({
        destroy: mockDestroy,
        queueSave: vi.fn(),
        forceSave: vi.fn(),
        status: "idle",
        lastSaved: null,
      } as any));

      const { unmount } = renderHook(() =>
        useAutoSave(noteId, { repository: mockRepository })
      );

      unmount();

      expect(mockDestroy).toHaveBeenCalled();
    });
  });

  describe("Return Values", () => {
    it("should return current save status from UI store", () => {
      mockUIStore.getSaveStatus.mockReturnValue("saving");

      const { result } = renderHook(() =>
        useAutoSave(noteId, { repository: mockRepository })
      );

      expect(result.current.saveStatus).toBe("saving");
      expect(mockUIStore.getSaveStatus).toHaveBeenCalledWith(noteId);
    });

    it("should return last saved timestamp from note's updated_at", () => {
      const testNoteWithTimestamp = { 
        ...testNote, 
        updated_at: "2024-01-01T10:30:00Z" 
      };
      mockNotesStore.getNote.mockReturnValue(testNoteWithTimestamp);

      const { result } = renderHook(() =>
        useAutoSave(noteId, { repository: mockRepository })
      );

      expect(result.current.lastSaved).toEqual(new Date("2024-01-01T10:30:00Z"));
      expect(mockNotesStore.getNote).toHaveBeenCalledWith(noteId);
    });

    it("should return error from UI store", () => {
      const errorMessage = "Save failed";
      mockUIStore.getError.mockReturnValue(errorMessage);

      const { result } = renderHook(() =>
        useAutoSave(noteId, { repository: mockRepository })
      );

      expect(result.current.error).toBe(errorMessage);
      expect(mockUIStore.getError).toHaveBeenCalledWith(noteId);
    });

    it("should return hasUnsavedChanges from notes store", () => {
      mockNotesStore.hasUnsavedChanges.mockReturnValue(true);

      const { result } = renderHook(() =>
        useAutoSave(noteId, { repository: mockRepository })
      );

      expect(result.current.hasUnsavedChanges).toBe(true);
    });
  });

  describe("Auto-Save Triggering", () => {
    it("should trigger queueSave when hasUnsavedChanges becomes true", () => {
      const mockQueueSave = vi.fn();
      MockAutoSaveService.mockImplementation(() => ({
        destroy: vi.fn(),
        queueSave: mockQueueSave,
        forceSave: vi.fn(),
        status: "idle",
        lastSaved: null,
      } as any));

      mockNotesStore.hasUnsavedChanges.mockReturnValue(false);

      const { rerender } = renderHook(() =>
        useAutoSave(noteId, { repository: mockRepository })
      );

      expect(mockQueueSave).not.toHaveBeenCalled();

      // Simulate content change
      mockNotesStore.hasUnsavedChanges.mockReturnValue(true);
      rerender();

      expect(mockQueueSave).toHaveBeenCalled();
    });

    it("should not trigger queueSave when disabled", () => {
      const mockQueueSave = vi.fn();
      MockAutoSaveService.mockImplementation(() => ({
        destroy: vi.fn(),
        queueSave: mockQueueSave,
        forceSave: vi.fn(),
        status: "idle",
        lastSaved: null,
      } as any));

      mockNotesStore.hasUnsavedChanges.mockReturnValue(true);

      renderHook(() =>
        useAutoSave(noteId, {
          repository: mockRepository,
          enabled: false,
        })
      );

      expect(mockQueueSave).not.toHaveBeenCalled();
    });
  });

  describe("Force Save", () => {
    it("should call AutoSaveService forceSave method", async () => {
      const mockForceSave = vi.fn().mockResolvedValue(undefined);
      MockAutoSaveService.mockImplementation(() => ({
        destroy: vi.fn(),
        queueSave: vi.fn(),
        forceSave: mockForceSave,
        status: "idle",
        lastSaved: null,
      } as any));

      const { result } = renderHook(() =>
        useAutoSave(noteId, { repository: mockRepository })
      );

      await act(async () => {
        await result.current.forceSave();
      });

      expect(mockForceSave).toHaveBeenCalled();
    });

    it("should handle disabled state in forceSave", async () => {
      const { result } = renderHook(() =>
        useAutoSave(noteId, {
          repository: mockRepository,
          enabled: false,
        })
      );

      const saveResult = await act(async () => {
        return await result.current.forceSave();
      });

      expect(saveResult).toBeUndefined();
    });
  });

  describe("Callbacks Integration", () => {
    let callbacks: any;

    beforeEach(() => {
      MockAutoSaveService.mockImplementation((_, callbacksParam) => {
        callbacks = callbacksParam;
        return {
          destroy: vi.fn(),
          queueSave: vi.fn(),
          forceSave: vi.fn(),
          status: "idle",
          lastSaved: null,
        } as any;
      });
    });

    it("should get current content from notes store", () => {
      mockNotesStore.getCurrentContent.mockReturnValue("Current content");

      renderHook(() => useAutoSave(noteId, { repository: mockRepository }));

      const content = callbacks.getCurrentContent();
      expect(content).toBe("Current content");
      expect(mockNotesStore.getCurrentContent).toHaveBeenCalledWith(noteId);
    });

    it("should save to API using updateNote mutation", async () => {
      const updatedNote = { ...testNote, content: "Updated content" };
      mockUpdateNoteMutation.mutateAsync.mockResolvedValue(updatedNote);

      renderHook(() => useAutoSave(noteId, { repository: mockRepository }));

      const result = await callbacks.saveToAPI("Updated content");

      expect(mockUpdateNoteMutation.mutateAsync).toHaveBeenCalledWith({
        id: noteId,
        update: { content: "Updated content" },
      });
      expect(result).toBe(updatedNote);
    });

    it("should handle save success callback", () => {
      renderHook(() => useAutoSave(noteId, { repository: mockRepository }));

      const savedNote = { ...testNote, content: "Saved content" };

      act(() => {
        callbacks.onSaveSuccess(savedNote);
      });

      expect(mockNotesStore.setNote).toHaveBeenCalledWith(savedNote);
      expect(mockUIStore.clearError).toHaveBeenCalledWith(noteId);
    });

    it("should handle save error callback", () => {
      renderHook(() => useAutoSave(noteId, { repository: mockRepository }));

      const error = new Error("Network error");

      act(() => {
        callbacks.onSaveError(error);
      });

      expect(mockUIStore.setError).toHaveBeenCalledWith(
        noteId,
        "Network error"
      );
    });

    it("should handle status change callback", () => {
      renderHook(() => useAutoSave(noteId, { repository: mockRepository }));

      act(() => {
        callbacks.onStatusChange("saving");
      });

      expect(mockUIStore.setSaveStatus).toHaveBeenCalledWith(noteId, "saving");
    });
  });

  describe("React Query Integration", () => {
    it("should configure updateNote mutation with onSuccess handler", () => {
      renderHook(() => useAutoSave(noteId, { repository: mockRepository }));

      expect(useUpdateNote).toHaveBeenCalledWith(
        mockRepository,
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });

    it("should update note in store on mutation success", () => {
      renderHook(() =>
        useAutoSave(noteId, { repository: mockRepository })
      );

      // Get the onSuccess callback from the useUpdateNote call
      const onSuccessCallback = (useUpdateNote as Mock).mock.calls[0][1]
        .onSuccess;

      const updatedNote = { ...testNote, content: "Updated via mutation" };

      act(() => {
        onSuccessCallback(updatedNote);
      });

      expect(mockNotesStore.setNote).toHaveBeenCalledWith(updatedNote);
    });
  });

  describe("Edge Cases", () => {
    it("should handle service recreation when noteId changes", () => {
      const mockDestroy = vi.fn();
      MockAutoSaveService.mockImplementation(() => ({
        destroy: mockDestroy,
        queueSave: vi.fn(),
        forceSave: vi.fn(),
        status: "idle",
        lastSaved: null,
      } as any));

      const { rerender } = renderHook(
        ({ id }) => useAutoSave(id, { repository: mockRepository }),
        { initialProps: { id: 1 } }
      );

      expect(MockAutoSaveService).toHaveBeenCalledTimes(1);

      rerender({ id: 2 });

      expect(mockDestroy).toHaveBeenCalled();
      expect(MockAutoSaveService).toHaveBeenCalledTimes(2);
    });

    it("should handle null lastSaved when note has no updated_at", () => {
      const noteWithoutTimestamp = { ...testNote, updated_at: undefined };
      mockNotesStore.getNote.mockReturnValue(noteWithoutTimestamp);

      const { result } = renderHook(() =>
        useAutoSave(noteId, { repository: mockRepository })
      );

      expect(result.current.lastSaved).toBeNull();
    });

    it("should not queue save when hasUnsavedChanges is false", () => {
      const mockQueueSave = vi.fn();
      MockAutoSaveService.mockImplementation(() => ({
        destroy: vi.fn(),
        queueSave: mockQueueSave,
        forceSave: vi.fn(),
        status: "idle",
        lastSaved: null,
      } as any));

      mockNotesStore.hasUnsavedChanges.mockReturnValue(false);

      renderHook(() => useAutoSave(noteId, { repository: mockRepository }));

      expect(mockQueueSave).not.toHaveBeenCalled();
    });
  });

  describe("Performance", () => {
    it("should memoize callbacks to prevent unnecessary service recreations", () => {
      const { rerender } = renderHook(() =>
        useAutoSave(noteId, { repository: mockRepository })
      );

      rerender();

      // Note: Due to memoization, the service should only be created once
      // unless dependencies actually change
      expect(MockAutoSaveService).toHaveBeenCalledTimes(1);
    });
  });
});
