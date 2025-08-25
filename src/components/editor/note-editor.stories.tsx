import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/nextjs";
import NoteProvider from "../providers/note-provider";
import { NoteEditor } from "./note-editor";

const sampleMarkdown = `# Welcome to Your Beautiful Note Editor

👋 **Welcome** to this elegant note-taking experience! Notice how the heading uses the **Inter** font for clarity and style.

## Typography Showcase

This body text uses the **Charter** font, specifically designed for exceptional readability. Charter was created by Matthew Carter for optimal reading in both print and digital environments.

### Why These Fonts Matter

- **Inter** (headers): Modern, clean sans-serif perfect for titles and UI
- **Charter** (body): Elegant serif designed for comfortable long-form reading
- **Optimized spacing**: Proper line height and margins for reading flow

### Sample Content Types

**Lists and organization:**
- [x] Choose elegant, readable fonts
- [x] Apply proper typography hierarchy
- [ ] Enjoy writing beautiful notes

**Code and technical content:**
\`\`\`javascript
// Code uses the original monospace font
function createBeautifulNotes() {
  return "Stylish yet readable!";
}
\`\`\`

> "Good typography is invisible. Great typography is *felt*."
> 
> — A wise designer

**Try editing this content** and notice how comfortable it is to read and write with proper typography!`;

const meta: Meta<typeof NoteEditor> = {
  title: "Editor/NoteEditor",
  component: NoteEditor,
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
        initialTitle="Typography Showcase"
        initialContent={sampleMarkdown}
        placeholder="Start writing your wonderful notes..."
        onDelete={action("note-deleted")}
        onSave={action("note-saved")}
      >
        <div className="h-screen">
          <Story />
        </div>
      </NoteProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyNote: Story = {
  decorators: [
    (Story) => (
      <NoteProvider
        initialTitle="Untitled Note"
        initialContent=""
        placeholder="Start writing your wonderful notes..."
        onDelete={action("note-deleted")}
        onSave={action("note-saved")}
      >
        <div className="h-screen">
          <Story />
        </div>
      </NoteProvider>
    ),
  ],
};

export const PaperUIShowcase: Story = {
  decorators: [
    (Story) => (
      <NoteProvider
        initialTitle="Paper UI Design"
        initialContent={`# Paper-like Design

This editor has a **paper-like appearance** with:

- Subtle drop shadow
- Rounded corners
- Clean white background
- Gray surrounding area

## Scrolling Behavior

Only the editor content scrolls, not the entire page. This creates a focused writing experience.

### Long Content Test

${Array(20)
  .fill("This is a line of text to demonstrate scrolling behavior.")
  .join("\n\n")}`}
        onDelete={action("note-deleted")}
        onSave={action("note-saved")}
      >
        <div className="h-screen">
          <Story />
        </div>
      </NoteProvider>
    ),
  ],
};

export const LongContent: Story = {
  decorators: [
    (Story) => (
      <NoteProvider
        initialTitle="Long Content Note"
        initialContent={`# Long Content Test

${Array(50)
  .fill(
    "This is a line of text to demonstrate scrolling behavior in the context-based editor."
  )
  .join("\n\n")}

## End of Content

This demonstrates the paper-like UI with proper scrolling.`}
        onDelete={action("note-deleted")}
        onSave={action("note-saved")}
      >
        <div className="h-screen">
          <Story />
        </div>
      </NoteProvider>
    ),
  ],
};
