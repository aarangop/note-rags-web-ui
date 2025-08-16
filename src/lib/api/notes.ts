import { API_CONFIG } from './config';
import type { Note, NoteCreate, NoteUpdate, NotesPage } from '../types/notes';

class NotesAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.notes.baseUrl;
  }

  async getNotes(page: number = 1, size: number = 12): Promise<NotesPage> {
    const response = await fetch(`${this.baseUrl}/notes/?page=${page}&size=${size}`);
    if (!response.ok) {
      throw new Error('Failed to fetch notes');
    }
    return response.json();
  }

  async getNoteById(id: number): Promise<Note> {
    const response = await fetch(`${this.baseUrl}/notes/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch note');
    }
    return response.json();
  }

  async createNote(note: NoteCreate): Promise<Note> {
    const response = await fetch(`${this.baseUrl}/notes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    });
    if (!response.ok) {
      throw new Error('Failed to create note');
    }
    return response.json();
  }

  async updateNote(id: number, update: NoteUpdate): Promise<Note> {
    const response = await fetch(`${this.baseUrl}/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });
    if (!response.ok) {
      throw new Error('Failed to update note');
    }
    return response.json();
  }

  async deleteNote(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/notes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete note');
    }
  }
}

export const notesAPI = new NotesAPI();