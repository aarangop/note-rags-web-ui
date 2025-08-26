import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NoteProvider from './note-provider';
import { useNoteContext } from '@/lib/contexts/note-context';
import { RepositoryProvider } from './repository-provider';
import { QueryProvider } from './query-provider';
import { createMockNotesRepository } from '@/test-utils';
import type { Note } from '@/lib/api/interfaces/notes-repository.interface';
import { mockHelpers } from '@/mocks/handlers';

// Test component to access the note context
function TestNoteComponent() {
  const {
    id,
    note,
    placeholder,
    status,
    isLoading,
    error,
    updateContent,
    updateTitle,
    saveNote,
    deleteNote,
  } = useNoteContext();
  
  return (
    <div>
      <span data-testid="note-id">{id}</span>
      <span data-testid="note-title">{note?.title || 'null'}</span>
      <span data-testid="note-content">{note?.content || 'null'}</span>
      <span data-testid="placeholder">{placeholder}</span>
      <span data-testid="status">{status}</span>
      <span data-testid="is-loading">{isLoading.toString()}</span>
      <span data-testid="error">{error?.message || 'null'}</span>
      <button 
        data-testid="update-content-btn"
        onClick={() => updateContent('Updated content')}
      >
        Update Content
      </button>
      <button 
        data-testid="update-title-btn"
        onClick={() => updateTitle('Updated Title')}
      >
        Update Title
      </button>
      <button 
        data-testid="save-btn"
        onClick={() => saveNote()}
      >
        Save
      </button>
      <button 
        data-testid="delete-btn"
        onClick={() => deleteNote()}
      >
        Delete
      </button>
    </div>
  );
}

// Test component that should fail when used outside provider
function TestComponentOutsideProvider() {
  const { note } = useNoteContext();
  return <div>{note?.title}</div>;
}

// Test wrapper with all necessary providers
function TestWrapper({ 
  children, 
  noteId = 1, 
  placeholder = 'Test placeholder',
  debounceTimeout = 100,
  onSave = vi.fn(),
  onDelete = vi.fn(),
  mockRepo
}: { 
  children: React.ReactNode;
  noteId?: number;
  placeholder?: string;
  debounceTimeout?: number;
  onSave?: () => void;
  onDelete?: () => void;
  mockRepo?: ReturnType<typeof createMockNotesRepository>;
}) {
  const notesRepository = mockRepo || createMockNotesRepository();
  
  return (
    <QueryProvider>
      <RepositoryProvider repositories={{ notesRepository }}>
        <NoteProvider 
          noteId={noteId}
          placeholder={placeholder}
          debounceTimeout={debounceTimeout}
          onSave={onSave}
          onDelete={onDelete}
        >
          {children}
        </NoteProvider>
      </RepositoryProvider>
    </QueryProvider>
  );
}

describe('NoteProvider', () => {
  let mockNotesRepository: ReturnType<typeof createMockNotesRepository>;
  let mockOnSave: ReturnType<typeof vi.fn>;
  let mockOnDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNotesRepository = createMockNotesRepository();
    mockOnSave = vi.fn();
    mockOnDelete = vi.fn();
    mockHelpers.resetNotes();
    vi.clearAllMocks();
  });

  describe('Initial state and note loading', () => {
    it('should provide correct initial context values', async () => {
      const mockNote: Note = mockHelpers.getNotes()[0];
      
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);

      const { getByTestId } = render(
        <TestWrapper 
          noteId={mockNote.id}
          placeholder="Test placeholder"
          mockRepo={mockNotesRepository}
        >
          <TestNoteComponent />
        </TestWrapper>
      );

      expect(getByTestId('note-id')).toHaveTextContent(mockNote.id.toString());
      expect(getByTestId('placeholder')).toHaveTextContent('Test placeholder');
      expect(getByTestId('status')).toHaveTextContent('idle');

      // Wait for note to load
      await waitFor(() => {
        expect(getByTestId('note-title')).toHaveTextContent(mockNote.title);
      });

      expect(getByTestId('note-content')).toHaveTextContent(mockNote.content);
      expect(getByTestId('is-loading')).toHaveTextContent('false');
    });

    it('should handle loading state correctly', () => {
      mockNotesRepository.getNoteById.mockImplementation(
        () => new Promise(() => {}) // Never resolves to test loading state
      );

      const { getByTestId } = render(
        <TestWrapper noteId={1} mockRepo={mockNotesRepository}>
          <TestNoteComponent />
        </TestWrapper>
      );

      expect(getByTestId('is-loading')).toHaveTextContent('true');
      expect(getByTestId('note-title')).toHaveTextContent('null');
      expect(getByTestId('note-content')).toHaveTextContent('null');
    });
  });

  describe('Content updates', () => {
    it('should update content locally and set unsaved status', async () => {
      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);

      const { getByTestId } = render(
        <TestWrapper 
          noteId={mockNote.id}
          debounceTimeout={1000} // Longer timeout to test intermediate state
          mockRepo={mockNotesRepository}
        >
          <TestNoteComponent />
        </TestWrapper>
      );

      // Wait for note to load
      await waitFor(() => {
        expect(getByTestId('note-content')).toHaveTextContent(mockNote.content);
      });

      // Update content
      act(() => {
        fireEvent.click(getByTestId('update-content-btn'));
      });

      // Should immediately show unsaved status and updated content
      expect(getByTestId('status')).toHaveTextContent('unsaved');
      expect(getByTestId('note-content')).toHaveTextContent('Updated content');
    });

    it('should trigger debounced save after content update', async () => {
      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);
      mockNotesRepository.updateNote.mockResolvedValue({ ...mockNote, content: 'Updated content' });

      const { getByTestId } = render(
        <TestWrapper 
          noteId={mockNote.id}
          debounceTimeout={50}
          onSave={mockOnSave}
          mockRepo={mockNotesRepository}
        >
          <TestNoteComponent />
        </TestWrapper>
      );

      // Wait for note to load
      await waitFor(() => {
        expect(getByTestId('note-content')).toHaveTextContent(mockNote.content);
      });

      // Update content
      act(() => {
        fireEvent.click(getByTestId('update-content-btn'));
      });

      // Wait for debounced save to trigger
      await waitFor(() => {
        expect(mockNotesRepository.updateNote).toHaveBeenCalled();
      }, { timeout: 200 });

      expect(mockNotesRepository.updateNote).toHaveBeenCalledWith(
        mockNote.id,
        expect.objectContaining({ content: 'Updated content' })
      );
      expect(mockOnSave).toHaveBeenCalledOnce();
    });
  });

  describe('Title updates', () => {
    it('should update title immediately without debouncing', async () => {
      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);
      mockNotesRepository.updateNote.mockResolvedValue({ ...mockNote, title: 'Updated Title' });

      const { getByTestId } = render(
        <TestWrapper 
          noteId={mockNote.id}
          onSave={mockOnSave}
          mockRepo={mockNotesRepository}
        >
          <TestNoteComponent />
        </TestWrapper>
      );

      // Wait for note to load
      await waitFor(() => {
        expect(getByTestId('note-title')).toHaveTextContent(mockNote.title);
      });

      // Update title
      act(() => {
        fireEvent.click(getByTestId('update-title-btn'));
      });

      // Should immediately show unsaved status and updated title
      expect(getByTestId('status')).toHaveTextContent('unsaved');
      expect(getByTestId('note-title')).toHaveTextContent('Updated Title');

      // Should save immediately (no debounce for titles)
      await waitFor(() => {
        expect(mockNotesRepository.updateNote).toHaveBeenCalled();
      });

      expect(mockNotesRepository.updateNote).toHaveBeenCalledWith(
        mockNote.id,
        expect.objectContaining({ title: 'Updated Title' })
      );
      expect(mockOnSave).toHaveBeenCalledOnce();
    });
  });

  describe('Manual save functionality', () => {
    it('should allow manual save', async () => {
      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);
      mockNotesRepository.updateNote.mockResolvedValue(mockNote);

      const { getByTestId } = render(
        <TestWrapper 
          noteId={mockNote.id}
          onSave={mockOnSave}
          mockRepo={mockNotesRepository}
        >
          <TestNoteComponent />
        </TestWrapper>
      );

      // Wait for note to load
      await waitFor(() => {
        expect(getByTestId('note-title')).toHaveTextContent(mockNote.title);
      });

      // Manual save
      act(() => {
        fireEvent.click(getByTestId('save-btn'));
      });

      await waitFor(() => {
        expect(mockNotesRepository.updateNote).toHaveBeenCalled();
      });

      expect(mockNotesRepository.updateNote).toHaveBeenCalledWith(
        mockNote.id,
        mockNote
      );
      expect(mockOnSave).toHaveBeenCalledOnce();
    });

    it('should handle save errors', async () => {
      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);
      mockNotesRepository.updateNote.mockRejectedValue(new Error('Save failed'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { getByTestId } = render(
        <TestWrapper 
          noteId={mockNote.id}
          mockRepo={mockNotesRepository}
        >
          <TestNoteComponent />
        </TestWrapper>
      );

      // Wait for note to load
      await waitFor(() => {
        expect(getByTestId('note-title')).toHaveTextContent(mockNote.title);
      });

      // Manual save that will fail
      act(() => {
        fireEvent.click(getByTestId('save-btn'));
      });

      await waitFor(() => {
        expect(getByTestId('status')).toHaveTextContent('error');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Save failed:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should prevent concurrent saves', async () => {
      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);
      
      // Make the first save slow
      let resolveFirstSave: (value: any) => void;
      const firstSavePromise = new Promise((resolve) => {
        resolveFirstSave = resolve;
      });
      
      mockNotesRepository.updateNote.mockImplementationOnce(() => firstSavePromise);

      const { getByTestId } = render(
        <TestWrapper 
          noteId={mockNote.id}
          mockRepo={mockNotesRepository}
        >
          <TestNoteComponent />
        </TestWrapper>
      );

      // Wait for note to load
      await waitFor(() => {
        expect(getByTestId('note-title')).toHaveTextContent(mockNote.title);
      });

      // Start first save
      act(() => {
        fireEvent.click(getByTestId('save-btn'));
      });
      
      // Try second save immediately
      act(() => {
        fireEvent.click(getByTestId('save-btn'));
      });

      // Should only call updateNote once
      expect(mockNotesRepository.updateNote).toHaveBeenCalledTimes(1);

      // Complete the first save
      act(() => {
        resolveFirstSave!(mockNote);
      });

      await waitFor(() => {
        expect(getByTestId('status')).not.toHaveTextContent('saving');
      });
    });
  });

  describe('Delete functionality', () => {
    it('should delete note and call onDelete callback', async () => {
      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);
      mockNotesRepository.deleteNote.mockResolvedValue();

      const { getByTestId } = render(
        <TestWrapper 
          noteId={mockNote.id}
          onDelete={mockOnDelete}
          mockRepo={mockNotesRepository}
        >
          <TestNoteComponent />
        </TestWrapper>
      );

      // Wait for note to load
      await waitFor(() => {
        expect(getByTestId('note-title')).toHaveTextContent(mockNote.title);
      });

      // Delete note
      act(() => {
        fireEvent.click(getByTestId('delete-btn'));
      });

      await waitFor(() => {
        expect(mockNotesRepository.deleteNote).toHaveBeenCalledWith(mockNote.id);
      });

      expect(mockOnDelete).toHaveBeenCalledOnce();
    });

    it('should handle delete errors', async () => {
      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);
      mockNotesRepository.deleteNote.mockRejectedValue(new Error('Delete failed'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { getByTestId } = render(
        <TestWrapper 
          noteId={mockNote.id}
          mockRepo={mockNotesRepository}
        >
          <TestNoteComponent />
        </TestWrapper>
      );

      // Wait for note to load
      await waitFor(() => {
        expect(getByTestId('note-title')).toHaveTextContent(mockNote.title);
      });

      // Delete note that will fail
      act(() => {
        fireEvent.click(getByTestId('delete-btn'));
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete note:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Cleanup behavior', () => {
    it('should cleanup timeout on unmount', async () => {
      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);

      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { unmount, getByTestId } = render(
        <TestWrapper 
          noteId={mockNote.id}
          debounceTimeout={1000}
          mockRepo={mockNotesRepository}
        >
          <TestNoteComponent />
        </TestWrapper>
      );

      // Wait for note to load
      await waitFor(() => {
        expect(getByTestId('note-title')).toHaveTextContent(mockNote.title);
      });

      // Start a debounced save
      act(() => {
        fireEvent.click(getByTestId('update-content-btn'));
      });
      expect(getByTestId('status')).toHaveTextContent('unsaved');

      // Unmount before timeout completes
      unmount();

      // Should have called clearTimeout
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should throw error when useNoteContext is used outside NoteProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow('useNoteContext must be used within a NoteProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Provider composition', () => {
    it('should work with all necessary providers', async () => {
      const mockNote = mockHelpers.getNotes()[0];
      mockNotesRepository.getNoteById.mockResolvedValue(mockNote);

      const { getByTestId } = render(
        <TestWrapper noteId={mockNote.id} mockRepo={mockNotesRepository}>
          <TestNoteComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('note-title')).toHaveTextContent(mockNote.title);
      });

      // All context should be available
      expect(getByTestId('note-id')).toHaveTextContent(mockNote.id.toString());
      expect(getByTestId('note-content')).toHaveTextContent(mockNote.content);
      expect(getByTestId('status')).toHaveTextContent('idle');
    });
  });
});