import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NoteHeader, NoteHeaderProps } from "./note-header";
import { SaveStatus } from "@/lib/types/save-status.types";

describe("NoteHeader", () => {
  const mockNote = {
    id: 1,
    title: "Test Note Title",
    content: "Test content",
  };

  const mockProps: NoteHeaderProps = {
    note: mockNote,
    onTitleChanged: vi.fn(),
    onNoteSave: vi.fn(),
    onNoteDelete: vi.fn(),
    saveStatus: "idle" as SaveStatus,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic rendering", () => {
    it("should render the note header with title", () => {
      render(<NoteHeader {...mockProps} />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Test Note Title"
      );
      expect(screen.getByRole("button")).toBeInTheDocument(); // dropdown trigger
    });

    it("should display 'Untitled Note' when note title is empty", () => {
      const noteWithEmptyTitle = { ...mockNote, title: "" };
      render(<NoteHeader {...mockProps} note={noteWithEmptyTitle} />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Untitled Note"
      );
    });

    it("should display 'Untitled Note' when note is null", () => {
      render(<NoteHeader {...mockProps} note={null} />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Untitled Note"
      );
    });

    it("should apply custom className", () => {
      const { container } = render(
        <NoteHeader {...mockProps} className="custom-class" />
      );

      expect(container.querySelector("header")).toHaveClass("custom-class");
    });
  });

  describe("Title editing functionality", () => {
    it("should enable edit mode when title is clicked", async () => {
      const user = userEvent.setup();
      render(<NoteHeader {...mockProps} />);

      const heading = screen.getByRole("heading", { level: 1 });
      await user.click(heading);

      expect(screen.getByDisplayValue("Test Note Title")).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { level: 1 })
      ).not.toBeInTheDocument();
    });

    it("should focus input when entering edit mode", async () => {
      const user = userEvent.setup();
      render(<NoteHeader {...mockProps} />);

      const heading = screen.getByRole("heading", { level: 1 });
      await user.click(heading);

      const input = screen.getByDisplayValue("Test Note Title");
      expect(input).toHaveFocus();
    });

    it("should call onTitleChanged when title is modified and submitted", async () => {
      const user = userEvent.setup();
      render(<NoteHeader {...mockProps} />);

      // Enter edit mode
      const heading = screen.getByRole("heading", { level: 1 });
      await user.click(heading);

      // Modify title
      const input = screen.getByDisplayValue("Test Note Title");
      await user.clear(input);
      await user.type(input, "New Title");
      
      // Press Enter to submit
      await user.keyboard("{Enter}");

      expect(mockProps.onTitleChanged).toHaveBeenCalledWith("New Title");
    });

    it("should call onTitleChanged when title input loses focus", async () => {
      const user = userEvent.setup();
      render(<NoteHeader {...mockProps} />);

      // Enter edit mode
      const heading = screen.getByRole("heading", { level: 1 });
      await user.click(heading);

      // Modify title
      const input = screen.getByDisplayValue("Test Note Title");
      await user.clear(input);
      await user.type(input, "New Title via Blur");
      
      // Click outside to blur
      await user.click(document.body);

      expect(mockProps.onTitleChanged).toHaveBeenCalledWith("New Title via Blur");
    });

    it("should not call onTitleChanged if title hasn't changed", async () => {
      const user = userEvent.setup();
      render(<NoteHeader {...mockProps} />);

      // Enter edit mode
      const heading = screen.getByRole("heading", { level: 1 });
      await user.click(heading);

      // Blur without changing
      await user.tab();

      expect(mockProps.onTitleChanged).not.toHaveBeenCalled();
    });

    it("should default to 'Untitled Note' if title is empty after editing", async () => {
      const user = userEvent.setup();
      render(<NoteHeader {...mockProps} />);

      // Enter edit mode
      const heading = screen.getByRole("heading", { level: 1 });
      await user.click(heading);

      // Clear title
      const input = screen.getByDisplayValue("Test Note Title");
      await user.clear(input);

      // Blur with empty title
      await user.tab();

      expect(mockProps.onTitleChanged).toHaveBeenCalledWith("Untitled Note");
    });

    it("should trim whitespace from title", async () => {
      const user = userEvent.setup();
      render(<NoteHeader {...mockProps} />);

      // Enter edit mode
      const heading = screen.getByRole("heading", { level: 1 });
      await user.click(heading);

      // Add whitespace
      const input = screen.getByDisplayValue("Test Note Title");
      await user.clear(input);
      await user.type(input, "  Trimmed Title  ");

      // Submit
      await user.keyboard("{Enter}");

      expect(mockProps.onTitleChanged).toHaveBeenCalledWith("Trimmed Title");
    });

    it("should cancel changes on Escape key", async () => {
      const user = userEvent.setup();
      render(<NoteHeader {...mockProps} />);

      // Enter edit mode
      const heading = screen.getByRole("heading", { level: 1 });
      await user.click(heading);

      // Modify title
      const input = screen.getByDisplayValue("Test Note Title");
      await user.clear(input);
      await user.type(input, "Changed Title");

      // Press Escape
      await user.keyboard("{Escape}");

      expect(mockProps.onTitleChanged).not.toHaveBeenCalled();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Test Note Title"
      );
    });

    it("should restore original title on Escape", async () => {
      const user = userEvent.setup();
      render(<NoteHeader {...mockProps} />);

      // Enter edit mode
      const heading = screen.getByRole("heading", { level: 1 });
      await user.click(heading);

      // Modify title
      const input = screen.getByDisplayValue("Test Note Title");
      await user.clear(input);
      await user.type(input, "Changed Title");

      // Press Escape
      await user.keyboard("{Escape}");

      // Re-enter edit mode to check the value was restored
      await user.click(screen.getByRole("heading", { level: 1 }));
      expect(screen.getByDisplayValue("Test Note Title")).toBeInTheDocument();
    });
  });

  describe("Component integration", () => {
    it("should pass correct props to child components", () => {
      render(<NoteHeader {...mockProps} saveStatus="saving" />);

      // SaveIndicator should be present (we don't need to mock it)
      // NoteActionsDropdown should be present with a button
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should update editable title when note title prop changes", async () => {
      const { rerender } = render(<NoteHeader {...mockProps} />);

      // Enter edit mode
      const user = userEvent.setup();
      await user.click(screen.getByRole("heading", { level: 1 }));

      expect(screen.getByDisplayValue("Test Note Title")).toBeInTheDocument();

      // Update props with new title
      const updatedNote = { ...mockNote, title: "Updated Title" };
      rerender(<NoteHeader {...mockProps} note={updatedNote} />);

      // Should see updated title in edit mode
      await waitFor(() => {
        expect(screen.getByDisplayValue("Updated Title")).toBeInTheDocument();
      });
    });

    it("should handle note changing from null to valid note", () => {
      const { rerender } = render(<NoteHeader {...mockProps} note={null} />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Untitled Note"
      );

      // Update to valid note
      rerender(<NoteHeader {...mockProps} note={mockNote} />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Test Note Title"
      );
    });

    it("should handle note changing from valid to null", () => {
      const { rerender } = render(<NoteHeader {...mockProps} note={mockNote} />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Test Note Title"
      );

      // Update to null
      rerender(<NoteHeader {...mockProps} note={null} />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Untitled Note"
      );
    });
  });
});