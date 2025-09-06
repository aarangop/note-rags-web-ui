import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/nextjs";
// TODO: Update stories for new hook-based architecture
// import NoteProvider from "../providers/note-provider";
import { NoteEditor } from "./note-editor";

const meta: Meta<typeof NoteEditor> = {
  title: "Editor/NoteEditor",
  component: NoteEditor,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    noteId: {
      control: "number",
      description: "The ID of the note",
    },
    onDelete: {
      action: "deleted",
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
    noteId: 1,
    onDelete: action("note-deleted"),
  },
};

// TODO: Restore more complex stories after implementing proper mocks for the new hook architecture