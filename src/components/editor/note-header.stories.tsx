import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { NoteProvider } from "../providers/note-provider";
import { NoteHeader } from "./note-header";

const meta: Meta<typeof NoteHeader> = {
  title: "Editor/NoteHeader",
  component: NoteHeader,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
  decorators: [
    (Story) => (
      <NoteProvider
        initialTitle="My Awesome Note"
        initialContent="# Sample Content\n\nThis is a sample note."
        onDelete={action("note-deleted")}
        onSave={action("note-saved")}
      >
        <Story />
      </NoteProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <NoteHeader />
          <div className="p-6 text-gray-600">
            <p>👆 Try clicking on the title to edit it</p>
            <p>Click the hamburger menu to see save/delete options</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const LongTitle: Story = {
  decorators: [
    (Story) => (
      <NoteProvider
        initialTitle="This is a very long note title that should truncate properly when it exceeds the available space in the header area"
        initialContent="# Long Title Note\n\nThis note has a very long title."
        onDelete={action("note-deleted")}
        onSave={action("note-saved")}
      >
        <Story />
      </NoteProvider>
    ),
  ],
  render: () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <NoteHeader />
          <div className="p-6 text-gray-600">
            <p>This demonstrates how long titles are handled with truncation</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const InteractiveDemo: Story = {
  decorators: [
    (Story) => (
      <NoteProvider
        initialTitle="Click me to edit!"
        initialContent="# Interactive Demo\n\nTry editing the title and using the menu."
        onDelete={action("note-deleted")}
        onSave={action("note-saved")}
      >
        <Story />
      </NoteProvider>
    ),
  ],
  render: () => (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <NoteHeader />
          <div className="p-6 text-gray-600">
            <p>👆 Try clicking on the title to edit it</p>
            <p>Click the hamburger menu to see save/delete options</p>
            <p>Status indicator shows current save state from context</p>
          </div>
        </div>
      </div>
    </div>
  ),
};
