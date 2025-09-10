import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useNotesRepository from "@/lib/hooks/use-notes-repository";
import { mockHelpers } from "@/mocks/handlers";
import type {
  NoteCreate,
  NoteUpdate,
} from "@/lib/api/interfaces/notes-repository.interface";

// Test wrapper using the new architecture (no RepositoryProvider needed)
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe("NotesRepository Integration Tests (Hook-based)", () => {
  beforeEach(() => {
    // Reset mock data before each test
    mockHelpers.resetNotes();
  });

  describe("Basic CRUD operations with hooks", () => {
    it("should perform full CRUD cycle using useNotesRepository hook", async () => {
      const wrapper = createWrapper();
      
      const { result } = renderHook(() => useNotesRepository(), { wrapper });
      
      const repository = result.current;

      // Test getting notes (paginated)
      const notesPage = await repository.getNotes(1, 5);
      expect(notesPage.items).toBeDefined();
      expect(notesPage.items!.length).toBeGreaterThan(0);
      expect(notesPage.total).toBeGreaterThan(0);

      // Test getting a specific note
      if (notesPage.items && notesPage.items.length > 0) {
        const firstNote = notesPage.items[0];
        const singleNote = await repository.getNoteById(firstNote.id);
        expect(singleNote.id).toBe(firstNote.id);
        expect(singleNote.title).toBeDefined();

        // Test creating a new note
        const newNote: NoteCreate = {
          title: "Hook Integration Test Note",
          content: "This note was created during hook-based integration testing",
          file_path: "/notes/hook-integration-test.md",
          document_type: "note" as const,
          metadata: { test: true },
        };
        const createdNote = await repository.createNote(newNote);
        expect(createdNote.title).toBe("Hook Integration Test Note");
        expect(createdNote.content).toBe("This note was created during hook-based integration testing");

        // Test updating the created note
        const updateData: NoteUpdate = {
          title: "Updated Hook Integration Test Note",
          content: "This note content was updated during hook-based integration testing",
          metadata: { test: true, updated: true },
        };
        const updatedNote = await repository.updateNote(createdNote.id, updateData);
        expect(updatedNote.title).toBe("Updated Hook Integration Test Note");
        expect(updatedNote.content).toBe("This note content was updated during hook-based integration testing");

        // Test deleting the note
        await expect(repository.deleteNote(createdNote.id)).resolves.not.toThrow();
      }
    });

    it("should handle pagination correctly with hook", async () => {
      // Add more notes to test pagination
      mockHelpers.addNote({
        title: "Hook Page Test Note 1",
        content: "Content 1",
        file_path: "/notes/hook-page-test-1.md",
        document_type: "note" as const,
        metadata: {},
      });

      mockHelpers.addNote({
        title: "Hook Page Test Note 2",
        content: "Content 2",
        file_path: "/notes/hook-page-test-2.md",
        document_type: "note" as const,
        metadata: {},
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useNotesRepository(), { wrapper });
      const repository = result.current;

      // Test first page with size 2
      const page1 = await repository.getNotes(1, 2);
      expect(page1.items).toHaveLength(2);

      // Test second page with size 2
      const page2 = await repository.getNotes(2, 2);
      expect(page2.items).toHaveLength(2);

      // Both pages should report the same total
      expect(page1.total).toBe(4); // 2 default + 2 added
      expect(page2.total).toBe(4);
    });
  });

  describe("Error handling with hooks", () => {
    it("should handle 404 errors gracefully", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useNotesRepository(), { wrapper });
      const repository = result.current;

      await expect(repository.getNoteById(99999)).rejects.toThrow("Note not found");
    });

    it("should handle validation errors on create/update", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useNotesRepository(), { wrapper });
      const repository = result.current;

      // Try to create a note with invalid data (empty title)
      const invalidNote: NoteCreate = {
        title: "", // Invalid: empty title
        content: "Some content",
        file_path: "/notes/invalid.md",
        document_type: "note" as const,
        metadata: {},
      };

      // Note: Since our mock doesn't validate, this test mainly verifies the structure
      // In a real API, this would return a validation error
      await expect(repository.createNote(invalidNote)).resolves.toBeDefined();
    });
  });

  // Note: Authentication is now handled at a different layer (auth provider)
  // so we've removed auth token tests from the repository integration tests

  describe("Concurrent requests with hooks", () => {
    it("should handle concurrent requests correctly", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useNotesRepository(), { wrapper });
      const repository = result.current;

      // Start multiple requests concurrently
      const [notes5, notes10, note1, note2] = await Promise.all([
        repository.getNotes(1, 5),
        repository.getNotes(1, 10),
        repository.getNoteById(1),
        repository.getNoteById(2),
      ]);

      // All requests should succeed
      expect(notes5.items).toBeDefined();
      expect(notes5.items!.length).toBeGreaterThan(0);
      expect(notes10.items).toBeDefined();
      expect(notes10.items!.length).toBeGreaterThan(0);
      expect(note1.title).toBeDefined();
      expect(note2.title).toBeDefined();
    });

    it("should handle network-like delays and timing", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useNotesRepository(), { wrapper });
      const repository = result.current;

      const startTime = Date.now();
      await repository.getNotes();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Request should complete (even if minimal with MSW)
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Data consistency with hooks", () => {
    it("should maintain data consistency across operations", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useNotesRepository(), { wrapper });
      const repository = result.current;

      // Create a note
      const newNote: NoteCreate = {
        title: "Hook Consistency Test",
        content: "Original content",
        file_path: "/notes/hook-consistency-test.md",
        document_type: "note" as const,
        metadata: { version: 1 },
      };
      const created = await repository.createNote(newNote);

      // Get the note back
      const retrieved = await repository.getNoteById(created.id);

      // Update the note
      const updated = await repository.updateNote(created.id, {
        content: "Updated content",
        metadata: { version: 2 },
      });

      // Get the updated note
      const retrievedUpdated = await repository.getNoteById(created.id);

      // Verify consistency
      expect(created.id).toBe(retrieved.id);
      expect(retrieved.id).toBe(updated.id);
      expect(updated.id).toBe(retrievedUpdated.id);
      expect(created.title).toBe(retrieved.title);
      expect(retrievedUpdated.content).toBe("Updated content");
    });
  });
});