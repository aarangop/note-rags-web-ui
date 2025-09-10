import { fn } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { NoteEditor } from "./note-editor";
import type { Note } from "@/lib/stores/notes-store.types";
import type { SaveStatus } from "@/lib/types/save-status.types";

// Mock note data
const mockNote: Note = {
  id: 1,
  title: "Sample Note",
  content: "This is a sample note content for Storybook.",
  file_path: "/path/to/note.md",
  document_type: "note",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T14:45:00Z",
  metadata: {},
  user_id: "user-123-456-789",
};

const meta: Meta<typeof NoteEditor> = {
  title: "Editor/NoteEditor",
  component: NoteEditor,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    note: {
      description: "The note data",
    },
    saveStatus: {
      control: "select",
      options: ["idle", "saving", "saved", "error", "unsaved", "unknown"],
      description: "The current save status",
    },
    onContentChanged: {
      description: "Callback when content changes",
    },
    onNoteSave: {
      description: "Callback when note should be saved",
    },
    onTitleChanged: {
      description: "Callback when title changes",
    },
    onDelete: {
      description: "Callback when note is deleted",
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    note: mockNote,
    saveStatus: "idle",
    onContentChanged: fn(),
    onNoteSave: fn(),
    onTitleChanged: fn(),
    onDelete: fn(),
  },
};

export const Saving: Story = {
  args: {
    note: mockNote,
    saveStatus: "saving",
    onContentChanged: fn(),
    onNoteSave: fn(),
    onTitleChanged: fn(),
    onDelete: fn(),
  },
};

export const Saved: Story = {
  args: {
    note: mockNote,
    saveStatus: "saved",
    onContentChanged: fn(),
    onNoteSave: fn(),
    onTitleChanged: fn(),
    onDelete: fn(),
  },
};

export const Error: Story = {
  args: {
    note: mockNote,
    saveStatus: "error",
    onContentChanged: fn(),
    onNoteSave: fn(),
    onTitleChanged: fn(),
    onDelete: fn(),
  },
};

export const Unsaved: Story = {
  args: {
    note: mockNote,
    saveStatus: "unsaved",
    onContentChanged: fn(),
    onNoteSave: fn(),
    onTitleChanged: fn(),
    onDelete: fn(),
  },
};

export const LongContent: Story = {
  args: {
    note: {
      ...mockNote,
      id: 2,
      title: "Long Note with Lots of Content",
      content: `# This is a long note

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Section 1

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### Subsection

- Item 1
- Item 2
- Item 3

## Section 2

More content here to demonstrate how the editor handles longer texts and various markdown elements.

\`\`\`javascript
function example() {
  console.log("Code blocks work too!");
}
\`\`\`

And some more text to fill out the content area.`,
    },
    saveStatus: "idle",
    onContentChanged: fn(),
    onNoteSave: fn(),
    onTitleChanged: fn(),
    onDelete: fn(),
  },
};
