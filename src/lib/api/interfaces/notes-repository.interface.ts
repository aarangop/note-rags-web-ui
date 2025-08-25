import type { components } from "../notes/types";
import { IBaseRepository } from "./base-repository.interface";

export type Note = components["schemas"]["Note"];
export type NoteCreate = components["schemas"]["NoteCreate"];
export type NoteUpdate = components["schemas"]["NoteUpdate"];
export type NotesPage = components["schemas"]["NotesPage"];

export interface INotesRepository extends IBaseRepository {
  getNotes(page?: number, size?: number): Promise<NotesPage>;
  getNoteById(id: number): Promise<Note>;
  createNote(note: NoteCreate): Promise<Note>;
  updateNote(id: number, update: NoteUpdate): Promise<Note>;
  deleteNote(id: number): Promise<void>;
}
