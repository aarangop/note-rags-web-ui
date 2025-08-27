import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from './use-auto-save';
import { useNotesStore, useUIStore } from '../stores';
import type { INotesRepository, Note } from '../api/interfaces/notes-repository.interface';

// Mock only external dependencies - let AutoSaveService and stores work naturally
vi.mock('../api/notes/queries', () => ({
  useUpdateNote: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({
      id: 1,
      user_id: "test-user",
      file_path: "/test/note.md",
      title: "Test Note",
      content: "Updated content",
      document_type: "note" as const,
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z",
      metadata: {},
    }),
  })),
}));

const mockRepository: INotesRepository = {
  getNotes: vi.fn(),
  getNoteById: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
};

describe('useAutoSave Integration', () => {
  const noteId = 1;
  const testNote: Note = {
    id: noteId,
    user_id: "test-user",
    file_path: "/test/note.md",
    title: "Test Note",
    content: "Original content",
    document_type: "note" as const,
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:00:00Z",
    metadata: {},
  };

  beforeEach(() => {
    // Reset stores
    act(() => {
      useNotesStore.getState().reset();
      useUIStore.getState().reset();
    });
    
    // Setup initial note
    act(() => {
      useNotesStore.getState().setNote(testNote);
      useNotesStore.getState().selectNote(noteId);
    });
  });

  it('should connect AutoSaveService to Zustand stores via callbacks', async () => {
    const { result } = renderHook(() => 
      useAutoSave(noteId, { repository: mockRepository })
    );

    // Initial state should come from stores
    expect(result.current.saveStatus).toBe('idle');
    expect(result.current.hasUnsavedChanges).toBe(false);

    // Edit content in store
    act(() => {
      useNotesStore.getState().updateContent(noteId, 'Modified content');
    });

    // Hook should detect changes from store
    expect(result.current.hasUnsavedChanges).toBe(true);
    
    // Force save should work end-to-end: AutoSaveService → API → store callbacks
    await act(async () => {
      await result.current.forceSave();
    });

    // Check that callbacks were executed:
    // 1. onSaveSuccess should have updated the note
    const updatedNote = useNotesStore.getState().getNote(noteId);
    expect(updatedNote?.content).toBe('Updated content'); // From mock API response

    // 2. lastSaved should come from API's updated_at timestamp  
    expect(result.current.lastSaved).toBeInstanceOf(Date);
    expect(result.current.lastSaved?.toISOString()).toBe('2024-01-01T10:00:00.000Z'); // From mock API response
    
    // 3. No errors
    expect(result.current.error).toBeUndefined();
  });

  it('should maintain independent UI state per note', async () => {
    const noteId2 = 2;
    
    const { result: result1 } = renderHook(() => 
      useAutoSave(noteId, { repository: mockRepository })
    );
    
    const { result: result2 } = renderHook(() => 
      useAutoSave(noteId2, { repository: mockRepository })
    );

    // Save first note
    await act(async () => {
      await result1.current.forceSave();
    });

    // Only first note should have timestamp
    expect(result1.current.lastSaved).toBeInstanceOf(Date);
    expect(result2.current.lastSaved).toBeNull();
    
    // UI states are independent per note ID
    expect(result1.current.saveStatus).toBe('idle');
    expect(result2.current.saveStatus).toBe('idle');
  });
});