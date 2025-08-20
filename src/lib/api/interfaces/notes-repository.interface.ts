import type { components } from '../notes/types';

export type Note = components['schemas']['Note'];
export type NoteCreate = components['schemas']['NoteCreate'];
export type NoteUpdate = components['schemas']['NoteUpdate'];
export type NotesPage = components['schemas']['NotesPage'];

export interface INotesRepository {
  getNotes(page?: number, size?: number): Promise<NotesPage>;
  getNoteById(id: number): Promise<Note>;
  createNote(note: NoteCreate): Promise<Note>;
  updateNote(id: number, update: NoteUpdate): Promise<Note>;
  deleteNote(id: number): Promise<void>;
}