import { create } from 'zustand';
import type { Note, SaveStatus } from '../types/notes';
import { notesAPI } from '../api/notes';

interface NotesState {
  // Notes list state
  notes: Note[];
  currentPage: number;
  totalPages: number;
  totalNotes: number;
  isLoading: boolean;
  error: string | null;
  
  // Current note state
  currentNote: Note | null;
  saveStatus: SaveStatus;
  
  // Search state
  searchQuery: string;
  
  // Actions
  loadNotes: (page?: number, size?: number) => Promise<void>;
  loadNote: (id: number) => Promise<void>;
  createNote: (title: string, content: string) => Promise<Note>;
  updateNote: (id: number, updates: { title?: string; content?: string }) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  clearError: () => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  // Initial state
  notes: [],
  currentPage: 1,
  totalPages: 0,
  totalNotes: 0,
  isLoading: false,
  error: null,
  currentNote: null,
  saveStatus: 'idle',
  searchQuery: '',

  // Actions
  loadNotes: async (page = 1, size = 12) => {
    set({ isLoading: true, error: null });
    try {
      const response = await notesAPI.getNotes(page, size);
      set({
        notes: response.items || [],
        currentPage: response.page,
        totalPages: response.pages,
        totalNotes: response.total,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load notes',
        isLoading: false,
      });
    }
  },

  loadNote: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const note = await notesAPI.getNoteById(id);
      set({ currentNote: note, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load note',
        isLoading: false,
      });
    }
  },

  createNote: async (title: string, content: string) => {
    set({ isLoading: true, error: null });
    try {
      const newNote = await notesAPI.createNote({
        title,
        content,
        file_path: `/notes/${title.toLowerCase().replace(/\s+/g, '-')}.md`,
        document_type: 'note',
        metadata: {},
      });
      
      // Add to notes list
      const { notes } = get();
      set({ 
        notes: [newNote, ...notes],
        currentNote: newNote,
        isLoading: false,
        totalNotes: get().totalNotes + 1,
      });
      
      return newNote;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create note',
        isLoading: false,
      });
      throw error;
    }
  },

  updateNote: async (id: number, updates: { title?: string; content?: string }) => {
    set({ saveStatus: 'saving' });
    try {
      const updatedNote = await notesAPI.updateNote(id, updates);
      
      // Update in notes list
      const { notes } = get();
      const updatedNotes = notes.map(note => 
        note.id === id ? updatedNote : note
      );
      
      set({ 
        notes: updatedNotes,
        currentNote: updatedNote,
        saveStatus: 'saved',
      });
      
      // Reset save status after a delay
      setTimeout(() => {
        set({ saveStatus: 'idle' });
      }, 2000);
    } catch (error) {
      set({ 
        saveStatus: 'error',
        error: error instanceof Error ? error.message : 'Failed to update note',
      });
    }
  },

  deleteNote: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await notesAPI.deleteNote(id);
      
      // Remove from notes list
      const { notes } = get();
      const filteredNotes = notes.filter(note => note.id !== id);
      
      set({ 
        notes: filteredNotes,
        currentNote: null,
        isLoading: false,
        totalNotes: get().totalNotes - 1,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete note',
        isLoading: false,
      });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSaveStatus: (status: SaveStatus) => {
    set({ saveStatus: status });
  },

  clearError: () => {
    set({ error: null });
  },
}));