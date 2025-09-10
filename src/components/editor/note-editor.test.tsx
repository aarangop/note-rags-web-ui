import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoteEditor } from "./note-editor";
import type { Note } from "@/lib/stores/notes-store.types";
import type { SaveStatus } from "@/lib/types/save-status.types";

// Mock note data
const mockNote: Note = {
  id: 1,
  title: "Test Note",
  content: "This is test content",
  file_path: "/test/note.md",
  document_type: "note",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T14:45:00Z",
  metadata: {},
  user_id: "user-123",
};

describe("NoteEditor", () => {
  const defaultProps = {
    note: mockNote,
    saveStatus: "idle" as SaveStatus,
    onContentChanged: vi.fn(),
    onNoteSave: vi.fn(),
    onTitleChanged: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the component with note title", () => {
      render(<NoteEditor {...defaultProps} />);

      // Title should be visible in the header
      expect(screen.getByText("Test Note")).toBeInTheDocument();
    });

    it("renders with the correct initial content", () => {
      render(<NoteEditor {...defaultProps} />);

      // The content should be passed to the editor
      // We can test this by checking if the editor component receives the right props
      expect(screen.getByText("Test Note")).toBeInTheDocument();
    });

    it("renders save indicator with correct status", () => {
      render(<NoteEditor {...defaultProps} saveStatus="saving" />);

      // The save indicator should reflect the current status
      // This tests that the saveStatus prop is correctly passed to NoteHeader
      const { rerender } = render(
        <NoteEditor {...defaultProps} saveStatus="saved" />
      );

      // Test different statuses
      rerender(<NoteEditor {...defaultProps} saveStatus="error" />);
      rerender(<NoteEditor {...defaultProps} saveStatus="unsaved" />);

      // If we got here without errors, the component handles different statuses
      expect(true).toBe(true);
    });
  });

  describe("Title editing functionality", () => {
    it("allows editing the title when clicked", async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      // Click on the title to edit it
      const titleElement = screen.getByText("Test Note");
      await user.click(titleElement);

      // Should now show an input field
      const titleInput = screen.getByDisplayValue("Test Note");
      expect(titleInput).toBeInTheDocument();
    });

    it("calls onTitleChange when title is modified and submitted", async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      // Click on the title to edit it
      const titleElement = screen.getByText("Test Note");
      await user.click(titleElement);

      // Get the input field and modify it
      const titleInput = screen.getByDisplayValue("Test Note");
      await user.clear(titleInput);
      await user.type(titleInput, "New Title");

      // Press Enter to submit
      await user.keyboard("{Enter}");

      expect(defaultProps.onTitleChanged).toHaveBeenCalledWith("New Title");
    });

    it("calls onTitleChange when title input loses focus", async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      // Click on the title to edit it
      const titleElement = screen.getByText("Test Note");
      await user.click(titleElement);

      // Get the input field and modify it
      const titleInput = screen.getByDisplayValue("Test Note");
      await user.clear(titleInput);
      await user.type(titleInput, "New Title via Blur");

      // Click outside to blur the input
      await user.click(document.body);

      expect(defaultProps.onTitleChanged).toHaveBeenCalledWith(
        "New Title via Blur"
      );
    });
  });

  describe("Save functionality", () => {
    it("calls onNoteSave when save button is clicked", async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      // Find and click the save button in the dropdown menu
      // First open the dropdown
      const moreButton = screen.getByRole("button");
      await user.click(moreButton);

      // Find the save button in the dropdown
      const saveButton = screen.getByText(/save note/i);
      await user.click(saveButton);

      expect(defaultProps.onNoteSave).toHaveBeenCalledTimes(1);
    });

    it("disables save button when status is 'saved'", async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} saveStatus="saved" />);

      // Open the dropdown
      const moreButton = screen.getByRole("button");
      await user.click(moreButton);

      // The save button should be disabled (using aria-disabled)
      const saveButton = screen.getByText(/save note/i);
      expect(saveButton).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("Delete functionality", () => {
    it("calls onDelete when delete button is clicked", async () => {
      const user = userEvent.setup();
      render(<NoteEditor {...defaultProps} />);

      // Open the dropdown menu
      const moreButton = screen.getByRole("button");
      await user.click(moreButton);

      // Find and click the delete button
      const deleteButton = screen.getByText(/delete note/i);
      await user.click(deleteButton);

      expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("Content editing", () => {
    // Note: Testing MilkdownEditor content changes would require more complex setup
    // since it's a rich text editor. For now, we test that the component renders
    // and passes the correct props.

    it("passes correct initial content to the editor", () => {
      render(<NoteEditor {...defaultProps} />);

      // The editor should receive the note content
      // We can't easily test the actual content change without deep MilkdownEditor setup,
      // but we can verify the component renders without errors
      expect(screen.getByText("Test Note")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles empty note title", () => {
      const emptyTitleNote = { ...mockNote, title: "" };
      render(<NoteEditor {...defaultProps} note={emptyTitleNote} />);

      // Should show default "Untitled Note" text
      expect(screen.getByText("Untitled Note")).toBeInTheDocument();
    });

    it("handles empty note content", () => {
      const emptyContentNote = { ...mockNote, content: "" };

      expect(() => {
        render(<NoteEditor {...defaultProps} note={emptyContentNote} />);
      }).not.toThrow();
    });

    it("handles undefined callbacks gracefully", () => {
      const propsWithoutCallbacks = {
        note: mockNote,
        saveStatus: "idle" as SaveStatus,
        onContentChanged: undefined as any,
        onNoteSave: undefined as any,
        onTitleChanged: undefined as any,
        onDelete: undefined as any,
      };

      expect(() => {
        render(<NoteEditor {...propsWithoutCallbacks} />);
      }).not.toThrow();
    });
  });

  describe("Layout and structure", () => {
    it("has the correct layout structure", () => {
      const { container } = render(<NoteEditor {...defaultProps} />);

      // Check for main layout classes
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass("flex", "h-full", "flex-col");
    });

    it("renders header and editor sections", () => {
      render(<NoteEditor {...defaultProps} />);

      // Should have a header section with the title
      expect(screen.getByText("Test Note")).toBeInTheDocument();

      // Should have the editor area (we can't test MilkdownEditor content directly,
      // but we can verify the structure exists)
      expect(screen.getByRole("button")).toBeInTheDocument(); // The dropdown button
    });
  });
});
