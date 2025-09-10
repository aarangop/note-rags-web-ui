import { fn } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { NoteHeader } from "./note-header";
import { SaveStatus } from "@/lib/types/save-status.types";

const meta: Meta<typeof NoteHeader> = {
  title: "Editor/NoteHeader",
  component: NoteHeader,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    note: {
      control: "object",
      description: "The note object with id, title, and content",
    },
    onTitleChanged: {
      description: "Callback when title is updated",
    },
    onNoteSave: {
      description: "Callback when note is saved",
    },
    onNoteDelete: {
      description: "Callback when note is deleted",
    },
    saveStatus: {
      control: "select",
      options: ["idle", "saving", "saved", "error", "unsaved", "unknown"],
      description: "Current save status",
    },
    error: {
      control: "text",
      description: "Error message if any",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    note: {
      id: 1,
      title: "Sample Note Title",
      content: "This is the content of the note...",
    },
    onTitleChanged: fn(),
    onNoteSave: fn(),
    onNoteDelete: fn(),
    saveStatus: "saved" as SaveStatus,
    error: undefined,
  },
};

export const Saving: Story = {
  args: {
    note: {
      id: 2,
      title: "Saving Note",
      content: "This note is currently being saved...",
    },
    onTitleChanged: fn(),
    onNoteSave: fn(),
    onNoteDelete: fn(),
    saveStatus: "saving" as SaveStatus,
    error: undefined,
  },
};

export const Unsaved: Story = {
  args: {
    note: {
      id: 3,
      title: "Note with Unsaved Changes",
      content: "This note has unsaved changes...",
    },
    onTitleChanged: fn(),
    onNoteSave: fn(),
    onNoteDelete: fn(),
    saveStatus: "unsaved" as SaveStatus,
    error: undefined,
  },
};

export const WithError: Story = {
  args: {
    note: {
      id: 4,
      title: "Note with Error",
      content: "This note had an error while saving...",
    },
    onTitleChanged: fn(),
    onNoteSave: fn(),
    onNoteDelete: fn(),
    saveStatus: "error" as SaveStatus,
    error: "Failed to save note to server",
  },
};

export const EmptyNote: Story = {
  args: {
    note: null,
    onTitleChanged: fn(),
    onNoteSave: fn(),
    onNoteDelete: fn(),
    saveStatus: "idle" as SaveStatus,
    error: undefined,
  },
};

export const LongTitle: Story = {
  args: {
    note: {
      id: 5,
      title:
        "This is a very long title that should truncate properly in the header when it exceeds the available space",
      content: "This note has a very long title...",
    },
    onTitleChanged: fn(),
    onNoteSave: fn(),
    onNoteDelete: fn(),
    saveStatus: "idle" as SaveStatus,
    error: undefined,
  },
};
