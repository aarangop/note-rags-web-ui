import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MilkdownEditor } from "./milkdown-editor";

describe("MilkdownEditor", () => {
  describe("Component rendering", () => {
    it("should render the milkdown editor wrapper", () => {
      const { getByTestId } = render(<MilkdownEditor />);
      expect(getByTestId("milkdown-editor")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const customClass = "custom-editor-class";
      const { getByTestId } = render(
        <MilkdownEditor className={customClass} />
      );
      const editorWrapper = getByTestId("milkdown-editor");
      expect(editorWrapper).toHaveClass(customClass);
    });

    it("should display placeholder text", async () => {
      const placeholder = "Type your content here...";
      render(<MilkdownEditor placeholder={placeholder} />);

      // Wait for the editor to initialize and show the placeholder
      await waitFor(() => {
        const placeholderElement = document.querySelector("[data-placeholder]");
        expect(placeholderElement).toHaveAttribute(
          "data-placeholder",
          placeholder
        );
      });
    });
  });

  describe("Content changes", () => {
    it("should call onContentChange when user types", async () => {
      const user = userEvent.setup();
      const onContentChange = vi.fn();

      render(<MilkdownEditor onContentChange={onContentChange} />);

      // Wait for the editor to be ready and find the main ProseMirror editor
      const editorElement = await waitFor(() => {
        const element = document.querySelector(
          '.ProseMirror.editor[contenteditable="true"]'
        );
        if (!element) throw new Error("ProseMirror editor not found");
        return element as HTMLElement;
      });

      // Type some content
      await user.type(editorElement, "Hello world");

      // Assert that the callback was called
      await waitFor(() => {
        expect(onContentChange).toHaveBeenCalled();
      });
    });

    it("should call onContentChange with the correct markdown content", async () => {
      const user = userEvent.setup();
      const onContentChange = vi.fn();

      render(<MilkdownEditor onContentChange={onContentChange} />);

      // Find the main ProseMirror editor
      const editorElement = await waitFor(() => {
        const element = document.querySelector(
          '.ProseMirror.editor[contenteditable="true"]'
        );
        if (!element) throw new Error("ProseMirror editor not found");
        return element as HTMLElement;
      });

      await user.type(editorElement, "# Hello world");

      // Check that onContentChange was called with markdown content
      await waitFor(() => {
        expect(onContentChange).toHaveBeenCalledWith(
          expect.stringContaining("Hello world")
        );
      });
    });
  });
});
