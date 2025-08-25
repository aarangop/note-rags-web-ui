import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MilkdownEditor } from "./milkdown-editor";

const meta: Meta<typeof MilkdownEditor> = {
  title: "Editor/MilkdownEditor",
  component: MilkdownEditor,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
