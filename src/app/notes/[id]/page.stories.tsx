import type { Meta, StoryObj } from "@storybook/nextjs";
import { http, HttpResponse, passthrough } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotePage from "./page";
import { components } from "@/lib/api/notes/types";
import { useRepositoryStore } from "@/lib/stores/repository-store";
import { NotesRepository } from "@/lib/api/repositories/notes-repository";
import { createApiClient } from "@/lib/api/client";
import { API_CONFIG } from "@/lib/api/config";

type Note = components["schemas"]["Note"];

// Mock note data
const mockNote: Note = {
  id: 1,
  title: "Sample Note for Storybook",
  content: "This is sample content for the Storybook story. You can edit this content to see how the editor behaves with different amounts of text.",
  file_path: "/sample/note.md",
  document_type: "note",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T14:45:00Z",
  metadata: {},
  user_id: "user-123",
};

const longContentNote: Note = {
  ...mockNote,
  id: 2,
  title: "Long Note with Rich Content",
  content: `# Welcome to the Rich Text Editor

This is a demonstration of a longer note with various formatting options.

## Features

The editor supports:
- **Bold text** and *italic text*
- Lists and nested items
- Code blocks and inline \`code\`
- Headers and subheaders

### Code Example

\`\`\`javascript
function greetUser(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome to the note editor!\`;
}
\`\`\`

### Lists and Organization

1. First item in ordered list
2. Second item with details
   - Nested unordered item
   - Another nested item
3. Final ordered item

> This is a blockquote to show how different content types render in the editor.

The editor maintains formatting while providing a clean editing experience.`,
};

// Store for mock notes (simulates backend state)
const mockNotes = new Map<number, Note>([
  [1, mockNote],
  [2, longContentNote],
]);

const meta: Meta<typeof NotePage> = {
  title: "Pages/NotePage",
  component: NotePage,
  decorators: [
    (Story) => {
      // Create a fresh QueryClient for each story
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false, // Don't retry failed queries in Storybook
            refetchOnWindowFocus: false,
          },
        },
      });

      // Initialize repository store with real repository
      // MSW will intercept the actual API calls
      const apiClient = createApiClient({
        baseUrl: API_CONFIG.notes.baseUrl,
      });
      const repository = new NotesRepository(apiClient);
      useRepositoryStore.getState().setNotesRepository(repository);

      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
    msw: {
      handlers: [
        // GET /notes/:id - Fetch a specific note
        http.get("http://localhost:8003/notes/:id", ({ params }) => {
          console.log("MSW intercepted GET request for note:", params.id);
          const noteId = parseInt(params.id as string);
          const note = mockNotes.get(noteId);

          if (!note) {
            return HttpResponse.json(
              { detail: "Note not found" },
              { status: 404 }
            );
          }

          return HttpResponse.json(note);
        }),

        // PUT /notes/:id - Update a note
        http.put("http://localhost:8003/notes/:id", async ({ params, request }) => {
          console.log("MSW intercepted PUT request for note:", params.id);
          const noteId = parseInt(params.id as string);
          const updates = (await request.json()) as Partial<Note>;
          const existingNote = mockNotes.get(noteId);

          if (!existingNote) {
            return HttpResponse.json(
              { detail: "Note not found" },
              { status: 404 }
            );
          }

          const updatedNote = {
            ...existingNote,
            ...updates,
            updated_at: new Date().toISOString(),
          };

          mockNotes.set(noteId, updatedNote);
          return HttpResponse.json(updatedNote);
        }),

        // DELETE /notes/:id - Delete a note
        http.delete("http://localhost:8003/notes/:id", ({ params }) => {
          console.log("MSW intercepted DELETE request for note:", params.id);
          const noteId = parseInt(params.id as string);
          const deleted = mockNotes.delete(noteId);

          if (!deleted) {
            return HttpResponse.json(
              { detail: "Note not found" },
              { status: 404 }
            );
          }

          return HttpResponse.json({ message: "Note deleted successfully" });
        }),

        // Catch-all handler to let unhandled requests pass through
        http.all("*", ({ request }) => {
          // Only log non-static assets to reduce noise
          if (!request.url.includes('/static/') && !request.url.includes('.js') && !request.url.includes('.css')) {
            console.log("MSW passing through unhandled request:", request.url);
          }
          return passthrough();
        }),
      ],
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    params: Promise.resolve({ id: "1" }),
  },
};

export const LongContent: Story = {
  args: {
    params: Promise.resolve({ id: "2" }),
  },
};

export const NotFound: Story = {
  args: {
    params: Promise.resolve({ id: "999" }),
  },
  parameters: {
    msw: {
      handlers: [
        http.get("*/notes/999", () => {
          return HttpResponse.json(
            { detail: "Note not found" },
            { status: 404 }
          );
        }),
      ],
    },
  },
};

export const ServerError: Story = {
  args: {
    params: Promise.resolve({ id: "1" }),
  },
  parameters: {
    msw: {
      handlers: [
        http.get("*/notes/1", () => {
          return HttpResponse.json(
            { detail: "Internal server error" },
            { status: 500 }
          );
        }),
      ],
    },
  },
};

export const SlowLoading: Story = {
  args: {
    params: Promise.resolve({ id: "1" }),
  },
  parameters: {
    msw: {
      handlers: [
        http.get("*/notes/1", async () => {
          // Simulate slow loading
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return HttpResponse.json(mockNote);
        }),
      ],
    },
  },
};
