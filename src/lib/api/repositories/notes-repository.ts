import type {
  INotesRepository,
  Note,
  NoteCreate,
  NoteUpdate,
  NotesPage,
} from "../interfaces/notes-repository.interface";
import { BaseRepository } from "./base-repository";

export class NotesRepository
  extends BaseRepository
  implements INotesRepository
{
  async getNotes(page: number = 1, size: number = 12): Promise<NotesPage> {
    const response = this.client.fetch.GET("/notes/", {
      params: {
        query: { page, size },
      },
    });

    return this.handleResponse(response);
  }

  async getNoteById(id: number): Promise<Note> {
    const response = this.client.fetch.GET("/notes/{id}", {
      params: {
        path: { id },
      },
    });

    return this.handleResponse(response);
  }

  async createNote(note: NoteCreate): Promise<Note> {
    const response = this.client.fetch.POST("/notes/", {
      body: note,
    });

    return this.handleResponse(response);
  }

  async updateNote(id: number, update: NoteUpdate): Promise<Note> {
    const response = this.client.fetch.PUT("/notes/{id}", {
      params: {
        path: { id },
      },
      body: update,
    });

    return this.handleResponse(response);
  }

  async deleteNote(id: number): Promise<void> {
    const response = this.client.fetch.DELETE("/notes/{id}", {
      params: {
        path: { id },
      },
    });

    await this.handleResponse(response);
  }
}
