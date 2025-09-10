import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import useNotesRepository from "./use-notes-repository";
import { NotesRepository } from "../api/repositories/notes-repository";
import useApiClient from "./use-api-client";
import type { ApiClient } from "../api/client";

// Mock dependencies
vi.mock("./use-api-client");
vi.mock("../api/repositories/notes-repository", () => ({
  NotesRepository: vi.fn(),
}));

const mockUseApiClient = vi.mocked(useApiClient);
const MockNotesRepository = vi.mocked(NotesRepository);

describe("useNotesRepository", () => {
  let mockNotesClient: ApiClient;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock client
    mockNotesClient = {
      fetch: {
        GET: vi.fn(),
        POST: vi.fn(),
        PUT: vi.fn(),
        DELETE: vi.fn(),
      },
      setAuthToken: vi.fn(),
      removeAuthToken: vi.fn(),
    } as any;

    // Setup useApiClient mock
    mockUseApiClient.mockReturnValue({
      notesClient: mockNotesClient,
    });
  });

  describe("Repository initialization", () => {
    it("should create repository with client from useApiClient", () => {
      const mockRepository = { id: "repo-1" } as any;
      MockNotesRepository.mockReturnValue(mockRepository);

      const { result } = renderHook(() => useNotesRepository());

      // Should have called useApiClient to get the client
      expect(mockUseApiClient).toHaveBeenCalledOnce();

      // Should have instantiated NotesRepository with the client
      expect(MockNotesRepository).toHaveBeenCalledWith(mockNotesClient);

      // Should return the repository and reset function
      expect(result.current).toBe(mockRepository);
    });
  });

  describe("Hook consistency", () => {
    it("should work consistently across different hook instances in same component", () => {
      const mockRepository1 = { id: "repo-1" } as any;
      const mockRepository2 = { id: "repo-2" } as any;

      MockNotesRepository.mockReturnValueOnce(
        mockRepository1
      ).mockReturnValueOnce(mockRepository2);

      // Two hook instances in same render
      const { result } = renderHook(() => {
        const hook1 = useNotesRepository();
        const hook2 = useNotesRepository();
        return { hook1, hook2 };
      });

      // Each hook instance creates its own repository
      expect(result.current.hook1).toBe(mockRepository1);
      expect(result.current.hook2).toBe(mockRepository2);
      expect(result.current.hook1).not.toBe(result.current.hook2);
      expect(MockNotesRepository).toHaveBeenCalledTimes(2);
    });
  });
});
