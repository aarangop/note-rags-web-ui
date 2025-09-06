import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/nextjs";
// TODO: Update stories for new hook-based architecture
// import { NoteProvider } from "../providers/note-provider";
import { NoteHeader } from "./note-header";

const meta: Meta<typeof NoteHeader> = {
  title: "Editor/NoteHeader",
  component: NoteHeader,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    noteId: {
      control: "number",
      description: "The ID of the note",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
    onDelete: {
      action: "deleted",
      description: "Callback when note is deleted",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    noteId: 1,
    onDelete: action("note-deleted"),
  },
  render: (args) => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <NoteHeader {...args} />
          <div className="p-6 text-gray-600">
            <p>👆 Try clicking on the title to edit it</p>
            <p>Click the hamburger menu to see save/delete options</p>
            <p>Note: Story may not work fully without proper data mocking</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

// TODO: Restore more complex stories after implementing proper mocks for the new hook architecture
