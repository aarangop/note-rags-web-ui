import { useNoteContext } from "@/lib/contexts/note-context";
import { mockHelpers } from "@/mocks/handlers";
import { createMockNotesRepository, createMockSession } from "@/test-utils";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthProvider, { useAuth } from "./auth-provider";
import NoteProvider from "./note-provider";
import { QueryProvider } from "./query-provider";
import { RepositoryProvider, useRepository } from "./repository-provider";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: vi.fn(),
}));

const mockUseSession = vi.mocked(useSession);

// Test component that uses all providers together
function FullIntegrationTestComponent() {
  const auth = useAuth();
  const repository = useRepository();
  const note = useNoteContext();

  return (
    <div>
      {/* Auth state */}
      <span data-testid="auth-token">{auth.token || "null"}</span>
      <span data-testid="auth-is-authenticated">
        {auth.isAuthenticated.toString()}
      </span>
      <span data-testid="auth-is-loading">{auth.isLoading.toString()}</span>

      {/* Repository availability */}
      <span data-testid="repo-available">
        {!!repository.notesRepository ? "true" : "false"}
      </span>

      {/* Note state */}
      <span data-testid="note-id">{note.id}</span>
      <span data-testid="note-title">{note.note?.title || "null"}</span>
      <span data-testid="note-status">{note.status}</span>
      <span data-testid="note-loading">{note.isLoading.toString()}</span>

      <button
        data-testid="update-note-btn"
        onClick={() => note.updateContent("Updated via integration test")}
      >
        Update Note
      </button>
      <button data-testid="save-note-btn" onClick={() => note.saveNote()}>
        Save Note
      </button>
    </div>
  );
}

// Component that tests auth flow integration
function AuthFlowTestComponent() {
  const auth = useAuth();
  const [operationResults, setOperationResults] = React.useState<any>({});

  const testAuthenticatedOperation = async () => {
    try {
      const { notesRepository } = useRepository();

      // This should work if auth is properly integrated
      const notes = await notesRepository.getNotes();
      setOperationResults({
        success: true,
        notesCount: notes.items?.length || 0,
      });
    } catch (error) {
      setOperationResults({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <div>
      <span data-testid="auth-status">
        {auth.isAuthenticated ? "authenticated" : "unauthenticated"}
      </span>
      <span data-testid="operation-success">
        {operationResults.success ? "true" : "false"}
      </span>
      <span data-testid="operation-notes-count">
        {operationResults.notesCount || 0}
      </span>
      <span data-testid="operation-error">
        {operationResults.error || "null"}
      </span>
      <button
        data-testid="test-operation-btn"
        onClick={testAuthenticatedOperation}
      >
        Test Operation
      </button>
    </div>
  );
}

// Test wrapper with all providers
function FullProviderWrapper({
  children,
  session = null,
  noteId = 1,
  mockRepo,
}: {
  children: React.ReactNode;
  session?: Session | null;
  noteId?: number;
  mockRepo?: ReturnType<typeof createMockNotesRepository>;
}) {
  const repositories = mockRepo ? { notesRepository: mockRepo } : undefined;

  return (
    <QueryProvider>
      <RepositoryProvider repositories={repositories}>
        <AuthProvider>
          <NoteProvider
            noteId={noteId}
            placeholder="Integration test placeholder"
            debounceTimeout={50}
          >
            {children}
          </NoteProvider>
        </AuthProvider>
      </RepositoryProvider>
    </QueryProvider>
  );
}

describe("Cross-Provider Integration Tests", () => {
  let mockNotesRepository: ReturnType<typeof createMockNotesRepository>;

  beforeEach(() => {
    mockNotesRepository = createMockNotesRepository();
    mockHelpers.resetNotes();
    vi.clearAllMocks();
  });

  describe("Full provider stack integration", () => {
    it("should integrate auth, repository, query, and note providers successfully", async () => {
      const mockSession = createMockSession();
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: "authenticated",
        update: vi.fn(),
      });

      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);

      const { getByTestId } = render(
        <FullProviderWrapper
          session={mockSession}
          noteId={mockNote.id}
          mockRepo={mockNotesRepository}
        >
          <FullIntegrationTestComponent />
        </FullProviderWrapper>
      );

      // Wait for all providers to initialize
      await waitFor(() => {
        expect(getByTestId("note-title")).toHaveTextContent(mockNote.title);
      });

      // Verify auth integration
      expect(getByTestId("auth-token")).toHaveTextContent(
        mockSession.accessToken!
      );
      expect(getByTestId("auth-is-authenticated")).toHaveTextContent("true");
      expect(getByTestId("auth-is-loading")).toHaveTextContent("false");

      // Verify repository integration
      expect(getByTestId("repo-available")).toHaveTextContent("true");

      // Verify note integration
      expect(getByTestId("note-id")).toHaveTextContent(mockNote.id.toString());
      expect(getByTestId("note-title")).toHaveTextContent(mockNote.title);
      expect(getByTestId("note-loading")).toHaveTextContent("false");

      // Verify auth token was set in repository
      expect(mockNotesRepository.setAuthToken).toHaveBeenCalledWith(
        mockSession.accessToken
      );
    });

    it("should handle unauthenticated state across all providers", async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: vi.fn(),
      });

      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);

      const { getByTestId } = render(
        <FullProviderWrapper
          noteId={mockNote.id}
          mockRepo={mockNotesRepository}
        >
          <FullIntegrationTestComponent />
        </FullProviderWrapper>
      );

      // Wait for note to load
      await waitFor(() => {
        expect(getByTestId("note-title")).toHaveTextContent(mockNote.title);
      });

      // Auth should be unauthenticated
      expect(getByTestId("auth-token")).toHaveTextContent("null");
      expect(getByTestId("auth-is-authenticated")).toHaveTextContent("false");

      // Repository should still be available
      expect(getByTestId("repo-available")).toHaveTextContent("true");

      // Note should still work (for public notes)
      expect(getByTestId("note-title")).toHaveTextContent(mockNote.title);

      // Auth token should have been removed from repository
      expect(mockNotesRepository.removeAuthToken).toHaveBeenCalled();
    });
  });

  describe("Auth state changes across providers", () => {
    it("should propagate auth state changes to all providers", async () => {
      const mockSession = createMockSession();

      // Start unauthenticated
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: vi.fn(),
      });

      const { getByTestId, rerender } = render(
        <FullProviderWrapper mockRepo={mockNotesRepository}>
          <FullIntegrationTestComponent />
        </FullProviderWrapper>
      );

      // Initially unauthenticated
      expect(getByTestId("auth-is-authenticated")).toHaveTextContent("false");
      expect(mockNotesRepository.removeAuthToken).toHaveBeenCalled();

      // Change to authenticated
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: "authenticated",
        update: vi.fn(),
      });

      rerender(
        <FullProviderWrapper
          session={mockSession}
          mockRepo={mockNotesRepository}
        >
          <FullIntegrationTestComponent />
        </FullProviderWrapper>
      );

      // Should now be authenticated
      await waitFor(() => {
        expect(getByTestId("auth-is-authenticated")).toHaveTextContent("true");
      });

      expect(getByTestId("auth-token")).toHaveTextContent(
        mockSession.accessToken!
      );
      expect(mockNotesRepository.setAuthToken).toHaveBeenCalledWith(
        mockSession.accessToken
      );
    });

    it("should handle session loading state", async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "loading",
        update: vi.fn(),
      });

      const { getByTestId } = render(
        <FullProviderWrapper mockRepo={mockNotesRepository}>
          <FullIntegrationTestComponent />
        </FullProviderWrapper>
      );

      expect(getByTestId("auth-is-loading")).toHaveTextContent("true");
      expect(getByTestId("auth-is-authenticated")).toHaveTextContent("false");
    });
  });

  describe("Note operations with auth integration", () => {
    it("should perform note operations with authenticated context", async () => {
      const mockSession = createMockSession();
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: "authenticated",
        update: vi.fn(),
      });

      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);
      mockNotesRepository.updateNote.mockResolvedValue({
        ...mockNote,
        content: "Updated via integration test",
      });

      const { getByTestId } = render(
        <FullProviderWrapper
          session={mockSession}
          noteId={mockNote.id}
          mockRepo={mockNotesRepository}
        >
          <FullIntegrationTestComponent />
        </FullProviderWrapper>
      );

      // Wait for note to load
      await waitFor(() => {
        expect(getByTestId("note-title")).toHaveTextContent(mockNote.title);
      });

      // Update note content
      act(() => {
        fireEvent.click(getByTestId("update-note-btn"));
      });

      // Wait for debounced save to trigger
      await waitFor(
        () => {
          expect(mockNotesRepository.updateNote).toHaveBeenCalled();
        },
        { timeout: 200 }
      );

      // Verify the update was called with auth context
      expect(mockNotesRepository.updateNote).toHaveBeenCalledWith(
        mockNote.id,
        expect.objectContaining({ content: "Updated via integration test" })
      );

      // Verify auth token is still set
      expect(mockNotesRepository.setAuthToken).toHaveBeenCalledWith(
        mockSession.accessToken
      );
    });
  });

  describe("Error handling across providers", () => {
    it("should handle repository errors gracefully while maintaining auth state", async () => {
      const mockSession = createMockSession();
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: "authenticated",
        update: vi.fn(),
      });

      // Make getNoteById fail
      mockNotesRepository.getNoteById.mockRejectedValue(
        new Error("Note not found")
      );

      const { getByTestId } = render(
        <FullProviderWrapper
          session={mockSession}
          noteId={999}
          mockRepo={mockNotesRepository}
        >
          <FullIntegrationTestComponent />
        </FullProviderWrapper>
      );

      // Auth should still work despite note error
      expect(getByTestId("auth-is-authenticated")).toHaveTextContent("true");
      expect(getByTestId("auth-token")).toHaveTextContent(
        mockSession.accessToken!!
      );
      expect(getByTestId("repo-available")).toHaveTextContent("true");

      // Note should show error state
      await waitFor(() => {
        expect(getByTestId("note-loading")).toHaveTextContent("false");
      });
    });

    it("should maintain query state during auth transitions", async () => {
      const mockSession = createMockSession();
      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);

      // Start authenticated
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: "authenticated",
        update: vi.fn(),
      });

      const { getByTestId, rerender } = render(
        <FullProviderWrapper
          session={mockSession}
          noteId={mockNote.id}
          mockRepo={mockNotesRepository}
        >
          <FullIntegrationTestComponent />
        </FullProviderWrapper>
      );

      // Wait for note to load
      await waitFor(() => {
        expect(getByTestId("note-title")).toHaveTextContent(mockNote.title);
      });

      // Change to unauthenticated
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: vi.fn(),
      });

      rerender(
        <FullProviderWrapper
          noteId={mockNote.id}
          mockRepo={mockNotesRepository}
        >
          <FullIntegrationTestComponent />
        </FullProviderWrapper>
      );

      // Note data should still be available (cached by React Query)
      expect(getByTestId("note-title")).toHaveTextContent(mockNote.title);

      // Auth should be updated
      expect(getByTestId("auth-is-authenticated")).toHaveTextContent("false");
    });
  });

  describe("Provider dependency chain", () => {
    it("should maintain correct provider hierarchy and dependencies", async () => {
      const mockSession = createMockSession();
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: "authenticated",
        update: vi.fn(),
      });

      function DependencyTestComponent() {
        // Test that hooks work correctly in the provider hierarchy
        const auth = useAuth();
        const repository = useRepository();
        const note = useNoteContext();

        return (
          <div>
            <span data-testid="all-contexts-available">
              {auth && repository && note ? "true" : "false"}
            </span>
            <span data-testid="hierarchy-working">
              {auth.isAuthenticated && repository.notesRepository && note.id
                ? "true"
                : "false"}
            </span>
          </div>
        );
      }

      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);

      const { getByTestId } = render(
        <FullProviderWrapper
          session={mockSession}
          noteId={mockNote.id}
          mockRepo={mockNotesRepository}
        >
          <DependencyTestComponent />
        </FullProviderWrapper>
      );

      await waitFor(() => {
        expect(getByTestId("all-contexts-available")).toHaveTextContent("true");
        expect(getByTestId("hierarchy-working")).toHaveTextContent("true");
      });
    });
  });

  describe("Real-world usage patterns", () => {
    it("should handle typical user authentication flow", async () => {
      // Simulate a user logging in and using the app
      const { getByTestId, rerender } = render(
        <FullProviderWrapper mockRepo={mockNotesRepository}>
          <AuthFlowTestComponent />
        </FullProviderWrapper>
      );

      // Start unauthenticated
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: vi.fn(),
      });

      expect(getByTestId("auth-status")).toHaveTextContent("unauthenticated");

      // User logs in
      const mockSession = createMockSession();
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: "authenticated",
        update: vi.fn(),
      });

      rerender(
        <FullProviderWrapper
          session={mockSession}
          mockRepo={mockNotesRepository}
        >
          <AuthFlowTestComponent />
        </FullProviderWrapper>
      );

      await waitFor(() => {
        expect(getByTestId("auth-status")).toHaveTextContent("authenticated");
      });

      // User performs an authenticated operation
      mockNotesRepository.getNotes.mockResolvedValue({
        items: mockHelpers.getNotes(),
        page: 1,
        size: 20,
        total: mockHelpers.getNotes().length,
        pages: 1,
      });

      act(() => {
        fireEvent.click(getByTestId("test-operation-btn"));
      });

      await waitFor(() => {
        expect(getByTestId("operation-success")).toHaveTextContent("true");
      });

      expect(
        parseInt(getByTestId("operation-notes-count").textContent || "0")
      ).toBeGreaterThan(0);
      expect(mockNotesRepository.setAuthToken).toHaveBeenCalledWith(
        mockSession.accessToken
      );
      expect(mockNotesRepository.getNotes).toHaveBeenCalled();
    });
  });
});
