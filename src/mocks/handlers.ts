import { http, HttpResponse } from "msw";
import type {
  Note,
  NoteCreate,
  NoteUpdate,
  NotesPage,
} from "@/lib/api/interfaces/notes-repository.interface";

const MOCK_USER_ID = "test-user-123";
const API_BASE = "http://localhost:8003";

const mockNotes: Note[] = [
  {
    id: 1,
    title: "Test Note 1",
    content:
      "This is the content of test note 1. It has some basic markdown content.",
    file_path: "/notes/test-note-1.md",
    document_type: "note" as const,
    user_id: MOCK_USER_ID,
    metadata: { tags: ["test", "example"] },
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:00:00Z",
  },
  {
    id: 2,
    title: "Test Note 2",
    content: "This is another test note with different content.",
    file_path: "/notes/test-note-2.md",
    document_type: "note" as const,
    user_id: MOCK_USER_ID,
    metadata: { tags: ["test"] },
    created_at: "2024-01-02T10:00:00Z",
    updated_at: "2024-01-02T10:00:00Z",
  },
];

const mockUser: UserResponse = {
  id: MOCK_USER_ID,
  cognito_user_id: "cognito-test-user-123",
  email: "test@example.com",
  username: "testuser",
  full_name: "Test User",
  is_active: true,
  is_verified: true,
  is_profile_complete: true,
  created_at: "2024-01-01T09:00:00Z",
  updated_at: "2024-01-01T09:00:00Z",
  last_login_at: "2024-01-01T10:00:00Z",
};

let noteIdCounter = mockNotes.length + 1;

export const handlers = [
  // Health check
  http.get(`${API_BASE}/health/`, () => {
    return HttpResponse.json({ status: "ok" });
  }),

  // Get notes (paginated)
  http.get(`${API_BASE}/notes/`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const size = parseInt(url.searchParams.get("size") || "20");

    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const paginatedNotes = mockNotes.slice(startIndex, endIndex);

    const response: NotesPage = {
      items: paginatedNotes,
      page,
      size,
      total: mockNotes.length,
      pages: Math.ceil(mockNotes.length / size),
    };

    return HttpResponse.json(response);
  }),

  // Get note by ID
  http.get(`${API_BASE}/notes/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    const note = mockNotes.find((n) => n.id === id);

    if (!note) {
      return HttpResponse.json({ detail: "Note not found" }, { status: 404 });
    }

    return HttpResponse.json(note);
  }),

  // Create note
  http.post(`${API_BASE}/notes/`, async ({ request }) => {
    const noteCreate = (await request.json()) as NoteCreate;

    const newNote: Note = {
      id: noteIdCounter++,
      ...noteCreate,
      user_id: MOCK_USER_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockNotes.push(newNote);
    return HttpResponse.json(newNote);
  }),

  // Update note
  http.put(`${API_BASE}/notes/:id`, async ({ params, request }) => {
    const id = parseInt(params.id as string);
    const noteUpdate = (await request.json()) as NoteUpdate;
    const noteIndex = mockNotes.findIndex((n) => n.id === id);

    if (noteIndex === -1) {
      return HttpResponse.json({ detail: "Note not found" }, { status: 404 });
    }

    const existingNote = mockNotes[noteIndex];
    const updatedNote: Note = {
      ...existingNote,
      ...noteUpdate,
      updated_at: new Date().toISOString(),
    };

    mockNotes[noteIndex] = updatedNote;
    return HttpResponse.json(updatedNote);
  }),

  // Delete note
  http.delete(`${API_BASE}/notes/:id`, ({ params }) => {
    const id = parseInt(params.id as string);
    const noteIndex = mockNotes.findIndex((n) => n.id === id);

    if (noteIndex === -1) {
      return HttpResponse.json({ detail: "Note not found" }, { status: 404 });
    }

    mockNotes.splice(noteIndex, 1);
    return HttpResponse.json({});
  }),

  // User endpoints
  http.get(`${API_BASE}/user/me`, () => {
    return HttpResponse.json(mockUser);
  }),

  http.get(`${API_BASE}/user/profile`, () => {
    return HttpResponse.json(mockUser);
  }),

  http.put(`${API_BASE}/user/profile`, async ({ request }) => {
    const profileUpdate = await request.json();
    const updatedUser = {
      ...mockUser,
      ...profileUpdate,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(updatedUser);
  }),

  http.post(`${API_BASE}/user/register`, async ({ request }) => {
    const registrationData = await request.json();
    const newUser = {
      ...mockUser,
      ...registrationData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(newUser);
  }),
];

// Helper functions for tests to manipulate mock data
export const mockHelpers = {
  resetNotes: () => {
    mockNotes.splice(0, mockNotes.length);
    mockNotes.push(
      {
        id: 1,
        title: "Test Note 1",
        content:
          "This is the content of test note 1. It has some basic markdown content.",
        file_path: "/notes/test-note-1.md",
        document_type: "note" as const,
        user_id: MOCK_USER_ID,
        metadata: { tags: ["test", "example"] },
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z",
      },
      {
        id: 2,
        title: "Test Note 2",
        content: "This is another test note with different content.",
        file_path: "/notes/test-note-2.md",
        document_type: "note" as const,
        user_id: MOCK_USER_ID,
        metadata: { tags: ["test"] },
        created_at: "2024-01-02T10:00:00Z",
        updated_at: "2024-01-02T10:00:00Z",
      }
    );
    noteIdCounter = 3;
  },

  addNote: (
    note: Omit<Note, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    const newNote: Note = {
      id: noteIdCounter++,
      ...note,
      user_id: MOCK_USER_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockNotes.push(newNote);
    return newNote;
  },

  getNotes: () => [...mockNotes],

  clearNotes: () => {
    mockNotes.splice(0, mockNotes.length);
    noteIdCounter = 1;
  },

  getMockUser: () => ({ ...mockUser }),
};
