import { SaveStatus } from "@/lib/stores/notes";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { SaveIndicator } from "./save-indicator";

const meta: Meta<typeof SaveIndicator> = {
  title: "Editor/SaveIndicator",
  component: SaveIndicator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["idle", "saving", "saved", "unsaved", "error"] as SaveStatus[],
      description: "The current save status",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    status: "idle",
  },
};

export const Saving: Story = {
  args: {
    status: "saving",
  },
};

export const Saved: Story = {
  args: {
    status: "saved",
  },
};

export const Unsaved: Story = {
  args: {
    status: "unsaved",
  },
};

export const Error: Story = {
  args: {
    status: "error",
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-4">Save Status Indicators</h2>

        <div className="flex items-center space-x-4 p-4 border rounded-lg">
          <SaveIndicator status="saved" />
          <div>
            <h3 className="text-sm font-medium">Saved / Idle</h3>
            <p className="text-xs text-gray-500">
              Green circle - Content is saved
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 p-4 border rounded-lg">
          <SaveIndicator status="unsaved" />
          <div>
            <h3 className="text-sm font-medium">Unsaved Changes</h3>
            <p className="text-xs text-gray-500">
              Yellow circle - Content has unsaved changes
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 p-4 border rounded-lg">
          <SaveIndicator status="saving" />
          <div>
            <h3 className="text-sm font-medium">Saving</h3>
            <p className="text-xs text-gray-500">
              Purple pulsing circle - Content is being saved
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 p-4 border rounded-lg">
          <SaveIndicator status="error" />
          <div>
            <h3 className="text-sm font-medium">Error</h3>
            <p className="text-xs text-gray-500">
              Red shaking circle - Error occurred while saving
            </p>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-blue-50">
          <h3 className="text-sm font-medium mb-2">Interactive Example</h3>
          <div className="flex items-center space-x-3">
            <span className="text-sm">Default status:</span>
            <SaveIndicator status="idle" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Use the controls above to see different states
          </p>
        </div>
      </div>
    </div>
  ),
};
