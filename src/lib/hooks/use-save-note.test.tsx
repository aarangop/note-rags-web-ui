import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { server } from "@/mocks/server";
import { mockHelpers } from "@/mocks/handlers";
import { http, HttpResponse } from "msw";
import { TestProviders, createTestQueryClient } from "@/test-utils";
import useSaveNote from "./use-save-note";
import type { components } from "@/lib/api/notes/types";
import { API_CONFIG } from "../api/config";
import { useRepositoryStore } from "../stores/repository-store";

type NoteUpdate = components["schemas"]["NoteUpdate"];

const API_BASE = API_CONFIG.notes.baseUrl;

describe("useSaveNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHelpers.resetNotes();
  });

  const renderUseSaveNote = () => {
    return renderHook(() => useSaveNote(), {
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    });
  };

  describe("Hook state management", () => {
    it("should return saveNote function, isLoading false, and no error initially", () => {
      const { result } = renderUseSaveNote();

      expect(result.current.saveNote).toBeInstanceOf(Function);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should show loading state during save operation", async () => {
      let resolveRequest: (response: any) => void;
      const pendingRequest = new Promise((resolve) => {
        resolveRequest = resolve;
      });

      server.use(
        http.put(`${API_BASE}/notes/:id`, async () => {
          await pendingRequest;
          return HttpResponse.json({ id: 1, title: "Updated Note" });
        })
      );

      const { result } = renderUseSaveNote();

      let savePromise: Promise<any>;
      
      act(() => {
        savePromise = result.current.saveNote(1, { title: "Updated Note" });
      });

      // Should be loading after calling saveNote
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
      expect(result.current.error).toBeNull();

      // Resolve the request
      act(() => {
        resolveRequest!({ id: 1, title: "Updated Note" });
      });
      await savePromise!;

      // Should not be loading after completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should set error state when save fails", async () => {
      server.use(
        http.put(`${API_BASE}/notes/:id`, () => {
          return HttpResponse.json(
            { detail: "Note not found" },
            { status: 404 }
          );
        })
      );

      const { result } = renderUseSaveNote();

      await expect(
        result.current.saveNote(999, { title: "Test" })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).not.toBeNull();
      });
    });

    it("should clear error state on successful save after previous error", async () => {
      const { result } = renderUseSaveNote();

      // First, create an error state
      server.use(
        http.put(`${API_BASE}/notes/:id`, () => {
          return HttpResponse.json({ detail: "Server error" }, { status: 500 });
        })
      );

      await expect(
        result.current.saveNote(1, { title: "Test" })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Reset to successful response
      server.resetHandlers();

      // Should clear error on successful save
      await result.current.saveNote(1, { title: "Success" });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("API integration and request verification", () => {
    it("should make PUT request to correct endpoint with provided update", async () => {
      let capturedRequest: { id: string; body: NoteUpdate } | null = null;

      server.use(
        http.put(`${API_BASE}/notes/:id`, async ({ params, request }) => {
          capturedRequest = {
            id: params.id as string,
            body: (await request.json()) as NoteUpdate,
          };
          return HttpResponse.json({
            id: parseInt(params.id as string),
            title: "Updated Title",
            content: "Updated Content",
          });
        })
      );

      const { result } = renderUseSaveNote();
      const updateData: Partial<NoteUpdate> = {
        title: "New Title",
        content: "New Content",
      };

      await result.current.saveNote(123, updateData);

      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest!.id).toBe("123");
      expect(capturedRequest!.body).toEqual(updateData);
    });

    it("should handle empty update object", async () => {
      let capturedRequest: { body: NoteUpdate } | null = null;

      server.use(
        http.put(`${API_BASE}/notes/:id`, async ({ request }) => {
          capturedRequest = {
            body: (await request.json()) as NoteUpdate,
          };
          return HttpResponse.json({ id: 1 });
        })
      );

      const { result } = renderUseSaveNote();

      await result.current.saveNote(1, {});

      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest!.body).toEqual({});
    });

    it("should pass through partial NoteUpdate objects correctly", async () => {
      let capturedRequest: { body: NoteUpdate } | null = null;

      server.use(
        http.put(`${API_BASE}/notes/:id`, async ({ request }) => {
          capturedRequest = {
            body: (await request.json()) as NoteUpdate,
          };
          return HttpResponse.json({ id: 1 });
        })
      );

      const { result } = renderUseSaveNote();
      const partialUpdate: Partial<NoteUpdate> = {
        title: "Only Title Updated",
      };

      await result.current.saveNote(1, partialUpdate);

      expect(capturedRequest!.body).toEqual(partialUpdate);
    });

    it("should handle successful save with full note response", async () => {
      const mockUpdatedNote = {
        id: 1,
        title: "Updated Title",
        content: "Updated Content",
        file_path: "/notes/updated.md",
        document_type: "note" as const,
        user_id: "test-user-123",
        metadata: {},
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-02T10:00:00Z",
      };

      server.use(
        http.put(`${API_BASE}/notes/:id`, () => {
          return HttpResponse.json(mockUpdatedNote);
        })
      );

      const { result } = renderUseSaveNote();

      await expect(
        result.current.saveNote(1, { title: "Updated Title" })
      ).resolves.not.toThrow();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe("Error handling scenarios", () => {
    it("should handle 404 Not Found error", async () => {
      server.use(
        http.put(`${API_BASE}/notes/:id`, () => {
          return HttpResponse.json(
            { detail: "Note not found" },
            { status: 404 }
          );
        })
      );

      const { result } = renderUseSaveNote();

      await expect(
        result.current.saveNote(999, { title: "Test" })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should handle 500 Internal Server Error", async () => {
      server.use(
        http.put(`${API_BASE}/notes/:id`, () => {
          return HttpResponse.json(
            { detail: "Internal server error" },
            { status: 500 }
          );
        })
      );

      const { result } = renderUseSaveNote();

      await expect(
        result.current.saveNote(1, { title: "Test" })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });

    it("should handle network errors", async () => {
      server.use(
        http.put(`${API_BASE}/notes/:id`, () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderUseSaveNote();

      await expect(
        result.current.saveNote(1, { title: "Test" })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });

    it("should handle validation errors", async () => {
      server.use(
        http.put(`${API_BASE}/notes/:id`, () => {
          return HttpResponse.json(
            {
              detail: "Validation error",
              errors: { title: "Title is required" },
            },
            { status: 422 }
          );
        })
      );

      const { result } = renderUseSaveNote();

      await expect(result.current.saveNote(1, { title: "" })).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });
  });

  describe("Function behavior", () => {
    it("should handle multiple consecutive saves", async () => {
      let requestCount = 0;
      const capturedRequests: Array<{ id: string; body: NoteUpdate }> = [];

      server.use(
        http.put(`${API_BASE}/notes/:id`, async ({ params, request }) => {
          requestCount++;
          capturedRequests.push({
            id: params.id as string,
            body: (await request.json()) as NoteUpdate,
          });
          return HttpResponse.json({ id: parseInt(params.id as string) });
        })
      );

      const { result } = renderUseSaveNote();

      // Make multiple saves
      await result.current.saveNote(1, { title: "First Save" });
      await result.current.saveNote(1, { title: "Second Save" });
      await result.current.saveNote(2, { content: "Different Note" });

      expect(requestCount).toBe(3);
      expect(capturedRequests).toHaveLength(3);
      expect(capturedRequests[0]).toEqual({
        id: "1",
        body: { title: "First Save" },
      });
      expect(capturedRequests[1]).toEqual({
        id: "1",
        body: { title: "Second Save" },
      });
      expect(capturedRequests[2]).toEqual({
        id: "2",
        body: { content: "Different Note" },
      });
    });

    it("should work with different note IDs", async () => {
      const capturedIds: string[] = [];

      server.use(
        http.put(`${API_BASE}/notes/:id`, async ({ params }) => {
          capturedIds.push(params.id as string);
          return HttpResponse.json({ id: parseInt(params.id as string) });
        })
      );

      const { result } = renderUseSaveNote();

      await result.current.saveNote(1, { title: "Note 1" });
      await result.current.saveNote(42, { title: "Note 42" });
      await result.current.saveNote(999, { title: "Note 999" });

      expect(capturedIds).toEqual(["1", "42", "999"]);
    });

    it("should accept complex update objects", async () => {
      let capturedRequest: { body: NoteUpdate } | null = null;

      server.use(
        http.put(`${API_BASE}/notes/:id`, async ({ request }) => {
          capturedRequest = {
            body: (await request.json()) as NoteUpdate,
          };
          return HttpResponse.json({ id: 1 });
        })
      );

      const { result } = renderUseSaveNote();
      const complexUpdate: Partial<NoteUpdate> = {
        title: "Complex Note",
        content: "# Markdown Content\n\nWith multiple lines",
        metadata: { tags: ["important", "draft"], priority: "high" },
      };

      await result.current.saveNote(1, complexUpdate);

      expect(capturedRequest!.body).toEqual(complexUpdate);
    });
  });
});
