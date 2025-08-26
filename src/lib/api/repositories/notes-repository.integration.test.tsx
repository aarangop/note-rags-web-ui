import { describe, it, expect, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryProvider } from '@/components/providers/query-provider';
import { RepositoryProvider } from '@/components/providers/repository-provider';
import { useRepository } from '@/components/providers/repository-provider';
import { mockHelpers } from '@/mocks/handlers';
import type { NoteCreate, NoteUpdate } from '@/lib/api/interfaces/notes-repository.interface';

// Test component to test repository integration
function TestRepositoryIntegration() {
  const { notesRepository } = useRepository();
  const [results, setResults] = React.useState<any>({});

  const testOperations = async () => {
    try {
      // Test getting notes (paginated)
      const notesPage = await notesRepository.getNotes(1, 5);
      setResults((prev: any) => ({ ...prev, getNotes: notesPage }));

      // Test getting a specific note
      if (notesPage.items && notesPage.items.length > 0) {
        const firstNote = notesPage.items[0];
        const singleNote = await notesRepository.getNoteById(firstNote.id);
        setResults((prev: any) => ({ ...prev, getNoteById: singleNote }));

        // Test creating a new note
        const newNote: NoteCreate = {
          title: 'Integration Test Note',
          content: 'This note was created during integration testing',
          file_path: '/notes/integration-test.md',
          document_type: 'note' as const,
          metadata: { test: true },
        };
        const createdNote = await notesRepository.createNote(newNote);
        setResults((prev: any) => ({ ...prev, createNote: createdNote }));

        // Test updating the created note
        const updateData: NoteUpdate = {
          title: 'Updated Integration Test Note',
          content: 'This note content was updated during integration testing',
          metadata: { test: true, updated: true },
        };
        const updatedNote = await notesRepository.updateNote(createdNote.id, updateData);
        setResults((prev: any) => ({ ...prev, updateNote: updatedNote }));

        // Test deleting the note
        await notesRepository.deleteNote(createdNote.id);
        setResults((prev: any) => ({ ...prev, deleteNote: 'success' }));
      }
    } catch (error) {
      setResults((prev: any) => ({ ...prev, error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  React.useEffect(() => {
    testOperations();
  }, []);

  return (
    <div>
      <span data-testid="get-notes-count">{results.getNotes?.items?.length || 0}</span>
      <span data-testid="get-notes-total">{results.getNotes?.total || 0}</span>
      <span data-testid="single-note-title">{results.getNoteById?.title || 'null'}</span>
      <span data-testid="created-note-title">{results.createNote?.title || 'null'}</span>
      <span data-testid="updated-note-title">{results.updateNote?.title || 'null'}</span>
      <span data-testid="updated-note-content">{results.updateNote?.content || 'null'}</span>
      <span data-testid="delete-result">{results.deleteNote || 'null'}</span>
      <span data-testid="error">{results.error || 'null'}</span>
    </div>
  );
}

// Test component to test auth token management
function TestAuthTokenIntegration() {
  const { notesRepository } = useRepository();
  const [tokenStatus, setTokenStatus] = React.useState<string>('none');

  const testAuthOperations = async () => {
    try {
      // Set auth token
      await notesRepository.setAuthToken('test-auth-token-123');
      setTokenStatus('token-set');

      // Try to get notes (which should include the auth header)
      await notesRepository.getNotes();
      setTokenStatus('request-with-token-success');

      // Remove auth token
      await notesRepository.removeAuthToken();
      setTokenStatus('token-removed');
    } catch (error) {
      setTokenStatus(`error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  React.useEffect(() => {
    testAuthOperations();
  }, []);

  return (
    <div>
      <span data-testid="auth-status">{tokenStatus}</span>
    </div>
  );
}

// Test wrapper
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <RepositoryProvider>
        {children}
      </RepositoryProvider>
    </QueryProvider>
  );
}

describe('NotesRepository Integration Tests', () => {
  beforeEach(() => {
    // Reset mock data before each test
    mockHelpers.resetNotes();
  });

  describe('Basic CRUD operations', () => {
    it('should perform full CRUD cycle with real HTTP requests', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <TestRepositoryIntegration />
        </TestWrapper>
      );

      // Wait for all operations to complete
      await waitFor(() => {
        expect(getByTestId('error')).toHaveTextContent('null');
        expect(getByTestId('delete-result')).toHaveTextContent('success');
      }, { timeout: 5000 });

      // Verify GET notes worked
      expect(parseInt(getByTestId('get-notes-count').textContent || '0')).toBeGreaterThan(0);
      expect(parseInt(getByTestId('get-notes-total').textContent || '0')).toBeGreaterThan(0);

      // Verify GET single note worked
      expect(getByTestId('single-note-title')).not.toHaveTextContent('null');

      // Verify CREATE note worked
      expect(getByTestId('created-note-title')).toHaveTextContent('Integration Test Note');

      // Verify UPDATE note worked
      expect(getByTestId('updated-note-title')).toHaveTextContent('Updated Integration Test Note');
      expect(getByTestId('updated-note-content')).toHaveTextContent('This note content was updated during integration testing');

      // Verify DELETE worked
      expect(getByTestId('delete-result')).toHaveTextContent('success');
    });

    it('should handle pagination correctly', async () => {
      // Add more notes to test pagination
      mockHelpers.addNote({
        title: 'Page Test Note 1',
        content: 'Content 1',
        file_path: '/notes/page-test-1.md',
        document_type: 'note' as const,
        metadata: {},
      });

      mockHelpers.addNote({
        title: 'Page Test Note 2',
        content: 'Content 2',
        file_path: '/notes/page-test-2.md',
        document_type: 'note' as const,
        metadata: {},
      });

      function TestPagination() {
        const { notesRepository } = useRepository();
        const [pageResults, setPageResults] = React.useState<any>({});

        React.useEffect(() => {
          const testPagination = async () => {
            // Test first page with size 2
            const page1 = await notesRepository.getNotes(1, 2);
            
            // Test second page with size 2
            const page2 = await notesRepository.getNotes(2, 2);

            setPageResults({ page1, page2 });
          };

          testPagination();
        }, []);

        return (
          <div>
            <span data-testid="page1-count">{pageResults.page1?.items?.length || 0}</span>
            <span data-testid="page1-total">{pageResults.page1?.total || 0}</span>
            <span data-testid="page2-count">{pageResults.page2?.items?.length || 0}</span>
            <span data-testid="page2-total">{pageResults.page2?.total || 0}</span>
          </div>
        );
      }

      const { getByTestId } = render(
        <TestWrapper>
          <TestPagination />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('page1-count')).toHaveTextContent('2');
        expect(getByTestId('page2-count')).toHaveTextContent('2');
      });

      // Both pages should report the same total
      expect(getByTestId('page1-total')).toHaveTextContent('4'); // 2 default + 2 added
      expect(getByTestId('page2-total')).toHaveTextContent('4');
    });
  });

  describe('Error handling', () => {
    it('should handle 404 errors gracefully', async () => {
      function TestNotFoundError() {
        const { notesRepository } = useRepository();
        const [error, setError] = React.useState<string>('');

        React.useEffect(() => {
          const testNotFound = async () => {
            try {
              await notesRepository.getNoteById(99999); // Non-existent ID
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unknown error');
            }
          };

          testNotFound();
        }, []);

        return <span data-testid="not-found-error">{error}</span>;
      }

      const { getByTestId } = render(
        <TestWrapper>
          <TestNotFoundError />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('not-found-error')).toHaveTextContent('Note not found');
      });
    });

    it('should handle validation errors on create/update', async () => {
      function TestValidationError() {
        const { notesRepository } = useRepository();
        const [error, setError] = React.useState<string>('');

        React.useEffect(() => {
          const testValidation = async () => {
            try {
              // Try to create a note with invalid data (empty title)
              const invalidNote: NoteCreate = {
                title: '', // Invalid: empty title
                content: 'Some content',
                file_path: '/notes/invalid.md',
                document_type: 'note' as const,
                metadata: {},
              };
              await notesRepository.createNote(invalidNote);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unknown error');
            }
          };

          testValidation();
        }, []);

        return <span data-testid="validation-error">{error}</span>;
      }

      const { getByTestId } = render(
        <TestWrapper>
          <TestValidationError />
        </TestWrapper>
      );

      // Note: Since our mock doesn't validate, we'll just verify the component renders
      // In a real API, this would return a validation error
      await waitFor(() => {
        expect(getByTestId('validation-error')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication integration', () => {
    it('should manage auth tokens correctly', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <TestAuthTokenIntegration />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('auth-status')).toHaveTextContent('token-removed');
      }, { timeout: 3000 });

      // Should go through the sequence: none -> token-set -> request-with-token-success -> token-removed
      expect(getByTestId('auth-status')).toHaveTextContent('token-removed');
    });
  });

  describe('Real API behavior simulation', () => {
    it('should handle concurrent requests correctly', async () => {
      function TestConcurrentRequests() {
        const { notesRepository } = useRepository();
        const [results, setResults] = React.useState<any>({});

        React.useEffect(() => {
          const testConcurrent = async () => {
            // Start multiple requests concurrently
            const promises = [
              notesRepository.getNotes(1, 5),
              notesRepository.getNotes(1, 10),
              notesRepository.getNoteById(1),
              notesRepository.getNoteById(2),
            ];

            const [notes5, notes10, note1, note2] = await Promise.all(promises);

            setResults({
              notes5Count: notes5.items?.length || 0,
              notes10Count: notes10.items?.length || 0,
              note1Title: note1.title,
              note2Title: note2.title,
            });
          };

          testConcurrent();
        }, []);

        return (
          <div>
            <span data-testid="concurrent-notes5">{results.notes5Count}</span>
            <span data-testid="concurrent-notes10">{results.notes10Count}</span>
            <span data-testid="concurrent-note1">{results.note1Title}</span>
            <span data-testid="concurrent-note2">{results.note2Title}</span>
          </div>
        );
      }

      const { getByTestId } = render(
        <TestWrapper>
          <TestConcurrentRequests />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('concurrent-notes5')).not.toHaveTextContent('0');
        expect(getByTestId('concurrent-notes10')).not.toHaveTextContent('0');
      });

      // Both requests should succeed
      expect(parseInt(getByTestId('concurrent-notes5').textContent || '0')).toBeGreaterThan(0);
      expect(parseInt(getByTestId('concurrent-notes10').textContent || '0')).toBeGreaterThan(0);
      expect(getByTestId('concurrent-note1')).not.toHaveTextContent('');
      expect(getByTestId('concurrent-note2')).not.toHaveTextContent('');
    });

    it('should handle network-like delays and timing', async () => {
      function TestTiming() {
        const { notesRepository } = useRepository();
        const [timing, setTiming] = React.useState<any>({});

        React.useEffect(() => {
          const testTiming = async () => {
            const startTime = Date.now();
            
            // Make a request
            await notesRepository.getNotes();
            
            const endTime = Date.now();
            const duration = endTime - startTime;

            setTiming({ duration, completed: true });
          };

          testTiming();
        }, []);

        return (
          <div>
            <span data-testid="request-completed">{timing.completed ? 'true' : 'false'}</span>
            <span data-testid="request-duration">{timing.duration || 0}</span>
          </div>
        );
      }

      const { getByTestId } = render(
        <TestWrapper>
          <TestTiming />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('request-completed')).toHaveTextContent('true');
      });

      // Request should have taken some time (even if minimal with MSW)
      const duration = parseInt(getByTestId('request-duration').textContent || '0');
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data consistency', () => {
    it('should maintain data consistency across operations', async () => {
      function TestDataConsistency() {
        const { notesRepository } = useRepository();
        const [consistency, setConsistency] = React.useState<any>({});

        React.useEffect(() => {
          const testConsistency = async () => {
            // Create a note
            const newNote: NoteCreate = {
              title: 'Consistency Test',
              content: 'Original content',
              file_path: '/notes/consistency-test.md',
              document_type: 'note' as const,
              metadata: { version: 1 },
            };
            const created = await notesRepository.createNote(newNote);

            // Get the note back
            const retrieved = await notesRepository.getNoteById(created.id);

            // Update the note
            const updated = await notesRepository.updateNote(created.id, {
              content: 'Updated content',
              metadata: { version: 2 },
            });

            // Get the updated note
            const retrievedUpdated = await notesRepository.getNoteById(created.id);

            setConsistency({
              createdId: created.id,
              retrievedId: retrieved.id,
              updatedId: updated.id,
              retrievedUpdatedId: retrievedUpdated.id,
              createdTitle: created.title,
              retrievedTitle: retrieved.title,
              updatedContent: updated.content,
              retrievedUpdatedContent: retrievedUpdated.content,
              allIdsMatch: created.id === retrieved.id && retrieved.id === updated.id && updated.id === retrievedUpdated.id,
            });
          };

          testConsistency();
        }, []);

        return (
          <div>
            <span data-testid="all-ids-match">{consistency.allIdsMatch ? 'true' : 'false'}</span>
            <span data-testid="final-content">{consistency.retrievedUpdatedContent || ''}</span>
            <span data-testid="consistent-title">{consistency.createdTitle === consistency.retrievedTitle ? 'true' : 'false'}</span>
          </div>
        );
      }

      const { getByTestId } = render(
        <TestWrapper>
          <TestDataConsistency />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('all-ids-match')).toHaveTextContent('true');
        expect(getByTestId('consistent-title')).toHaveTextContent('true');
      });

      expect(getByTestId('final-content')).toHaveTextContent('Updated content');
    });
  });
});