import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useNotesStore } from "./notes-store";
import { Note } from "./notes-store.types";

// Mock Note factory
const createMockNote = (overrides: Partial<Note> = {}): Note => ({
  id: 1,
  title: "Test Note",
  content: "Test content",
  file_path: "/test/note.md",
  document_type: "note",
  user_id: "test-user-id",
  metadata: {},
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("NoteStore", () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useNotesStore());
    act(() => {
      result.current.reset();
    });
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const { result } = renderHook(() => useNotesStore());

      expect(result.current.notes).toBeInstanceOf(Map);
      expect(result.current.notes.size).toBe(0);
      expect(result.current.selectedNoteId).toBeNull();
      expect(result.current.editingContent).toBeInstanceOf(Map);
      expect(result.current.editingContent.size).toBe(0);
    });
  });

  describe("Actions", () => {
    describe("setNote", () => {
      it("should add a new note to the store", () => {
        const { result } = renderHook(() => useNotesStore());
        const mockNote = createMockNote();

        act(() => {
          result.current.setNote(mockNote);
        });

        expect(result.current.notes.get(1)).toEqual(mockNote);
        expect(result.current.notes.size).toBe(1);
      });

      it("should update an existing note", () => {
        const { result } = renderHook(() => useNotesStore());
        const mockNote = createMockNote();
        const updatedNote = createMockNote({ title: "Updated Title" });

        act(() => {
          result.current.setNote(mockNote);
          result.current.setNote(updatedNote);
        });

        expect(result.current.notes.get(1)?.title).toBe("Updated Title");
        expect(result.current.notes.size).toBe(1);
      });
    });

    describe("setNotes", () => {
      it("should replace all notes in the store", () => {
        const { result } = renderHook(() => useNotesStore());
        const note1 = createMockNote({ id: 1 });
        const note2 = createMockNote({ id: 2, title: "Note 2" });
        const note3 = createMockNote({ id: 3, title: "Note 3" });

        // Add initial notes
        act(() => {
          result.current.setNote(note1);
          result.current.setNote(note2);
        });

        expect(result.current.notes.size).toBe(2);

        // Replace with new set
        act(() => {
          result.current.setNotes([note3]);
        });

        expect(result.current.notes.size).toBe(1);
        expect(result.current.notes.get(3)?.title).toBe("Note 3");
        expect(result.current.notes.get(1)).toBeUndefined();
      });

      it("should handle empty array", () => {
        const { result } = renderHook(() => useNotesStore());
        const note1 = createMockNote();

        act(() => {
          result.current.setNote(note1);
          result.current.setNotes([]);
        });

        expect(result.current.notes.size).toBe(0);
      });
    });

    describe("updateContent", () => {
      it("should update editing content for a note", () => {
        const { result } = renderHook(() => useNotesStore());
        const noteId = 1;
        const newContent = "Updated content";

        act(() => {
          result.current.updateContent(noteId, newContent);
        });

        expect(result.current.editingContent.get(noteId)).toBe(newContent);
      });

      it("should overwrite existing editing content", () => {
        const { result } = renderHook(() => useNotesStore());
        const noteId = 1;

        act(() => {
          result.current.updateContent(noteId, "First content");
          result.current.updateContent(noteId, "Second content");
        });

        expect(result.current.editingContent.get(noteId)).toBe(
          "Second content"
        );
      });
    });

    describe("selectNote", () => {
      it("should set the selected note ID", () => {
        const { result } = renderHook(() => useNotesStore());
        const noteId = 5;

        act(() => {
          result.current.selectNote(noteId);
        });

        expect(result.current.selectedNoteId).toBe(noteId);
      });

      it("should change selected note ID", () => {
        const { result } = renderHook(() => useNotesStore());

        act(() => {
          result.current.selectNote(1);
          result.current.selectNote(2);
        });

        expect(result.current.selectedNoteId).toBe(2);
      });
    });

    describe("clearNote", () => {
      it("should remove note from both maps", () => {
        const { result } = renderHook(() => useNotesStore());
        const mockNote = createMockNote();

        act(() => {
          result.current.setNote(mockNote);
          result.current.updateContent(1, "editing content");
          result.current.clearNote(1);
        });

        expect(result.current.notes.get(1)).toBeUndefined();
        expect(result.current.editingContent.get(1)).toBeUndefined();
      });

      it("should clear selection if clearing selected note", () => {
        const { result } = renderHook(() => useNotesStore());
        const mockNote = createMockNote();

        act(() => {
          result.current.setNote(mockNote);
          result.current.selectNote(1);
          result.current.clearNote(1);
        });

        expect(result.current.selectedNoteId).toBeNull();
      });

      it("should not affect selection if clearing different note", () => {
        const { result } = renderHook(() => useNotesStore());
        const note1 = createMockNote({ id: 1 });
        const note2 = createMockNote({ id: 2 });

        act(() => {
          result.current.setNote(note1);
          result.current.setNote(note2);
          result.current.selectNote(1);
          result.current.clearNote(2);
        });

        expect(result.current.selectedNoteId).toBe(1);
      });
    });

    describe("reset", () => {
      it("should reset all state to initial values", () => {
        const { result } = renderHook(() => useNotesStore());
        const mockNote = createMockNote();

        act(() => {
          result.current.setNote(mockNote);
          result.current.selectNote(1);
          result.current.updateContent(1, "editing");
          result.current.reset();
        });

        expect(result.current.notes.size).toBe(0);
        expect(result.current.selectedNoteId).toBeNull();
        expect(result.current.editingContent.size).toBe(0);
      });
    });
  });

  describe("Selectors", () => {
    describe("getNote", () => {
      it("should return note by ID", () => {
        const { result } = renderHook(() => useNotesStore());
        const mockNote = createMockNote();

        act(() => {
          result.current.setNote(mockNote);
        });

        expect(result.current.getNote(1)).toEqual(mockNote);
      });

      it("should return undefined for non-existent note", () => {
        const { result } = renderHook(() => useNotesStore());

        expect(result.current.getNote(999)).toBeUndefined();
      });
    });

    describe("getSelectedNote", () => {
      it("should return the selected note", () => {
        const { result } = renderHook(() => useNotesStore());
        const mockNote = createMockNote();

        act(() => {
          result.current.setNote(mockNote);
          result.current.selectNote(1);
        });

        expect(result.current.getSelectedNote()).toEqual(mockNote);
      });

      it("should return undefined when no note is selected", () => {
        const { result } = renderHook(() => useNotesStore());

        expect(result.current.getSelectedNote()).toBeUndefined();
      });

      it("should return undefined when selected note does not exist", () => {
        const { result } = renderHook(() => useNotesStore());

        act(() => {
          result.current.selectNote(999);
        });

        expect(result.current.getSelectedNote()).toBeUndefined();
      });
    });

    describe("getCurrentContent", () => {
      it("should return editing content when available", () => {
        const { result } = renderHook(() => useNotesStore());
        const mockNote = createMockNote({ content: "original content" });

        act(() => {
          result.current.setNote(mockNote);
          result.current.updateContent(1, "edited content");
        });

        expect(result.current.getCurrentContent(1)).toBe("edited content");
      });

      it("should return note content when no editing content", () => {
        const { result } = renderHook(() => useNotesStore());
        const mockNote = createMockNote({ content: "original content" });

        act(() => {
          result.current.setNote(mockNote);
        });

        expect(result.current.getCurrentContent(1)).toBe("original content");
      });

      it("should return empty string when neither exists", () => {
        const { result } = renderHook(() => useNotesStore());

        expect(result.current.getCurrentContent(999)).toBe("");
      });
    });

    describe("hasUnsavedChanges", () => {
      it("should return true when editing content differs from saved", () => {
        const { result } = renderHook(() => useNotesStore());
        const mockNote = createMockNote({ content: "original" });

        act(() => {
          result.current.setNote(mockNote);
          result.current.updateContent(1, "edited");
        });

        expect(result.current.hasUnsavedChanges(1)).toBe(true);
      });

      it("should return false when editing content matches saved", () => {
        const { result } = renderHook(() => useNotesStore());
        const mockNote = createMockNote({ content: "same content" });

        act(() => {
          result.current.setNote(mockNote);
          result.current.updateContent(1, "same content");
        });

        expect(result.current.hasUnsavedChanges(1)).toBe(false);
      });

      it("should return false when no editing content exists", () => {
        const { result } = renderHook(() => useNotesStore());
        const mockNote = createMockNote();

        act(() => {
          result.current.setNote(mockNote);
        });

        expect(result.current.hasUnsavedChanges(1)).toBe(false);
      });

      it("should return false for non-existent note", () => {
        const { result } = renderHook(() => useNotesStore());

        expect(result.current.hasUnsavedChanges(999)).toBe(false);
      });
    });

    describe("getAllNotes", () => {
      it("should return all notes as array", () => {
        const { result } = renderHook(() => useNotesStore());
        const note1 = createMockNote({ id: 1, title: "Note 1" });
        const note2 = createMockNote({ id: 2, title: "Note 2" });

        act(() => {
          result.current.setNote(note1);
          result.current.setNote(note2);
        });

        const allNotes = result.current.getAllNotes();
        expect(allNotes).toHaveLength(2);
        expect(allNotes).toContain(note1);
        expect(allNotes).toContain(note2);
      });

      it("should return empty array when no notes", () => {
        const { result } = renderHook(() => useNotesStore());

        expect(result.current.getAllNotes()).toEqual([]);
      });
    });
  });

  describe("Performance", () => {
    it("should handle large numbers of notes efficiently", () => {
      const { result } = renderHook(() => useNotesStore());
      const notes = Array.from({ length: 1000 }, (_, i) =>
        createMockNote({ id: i + 1, title: `Note ${i + 1}` })
      );

      act(() => {
        result.current.setNotes(notes);
      });

      // Map operations should be O(1)
      const start = performance.now();
      result.current.getNote(500);
      const end = performance.now();

      expect(end - start).toBeLessThan(1); // Should be very fast
      expect(result.current.notes.size).toBe(1000);
    });
  });
});
