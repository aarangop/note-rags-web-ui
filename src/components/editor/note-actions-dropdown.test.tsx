import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NoteActionsDropdown } from "./note-actions-dropdown";
import { SaveStatus } from "@/lib/types/save-status.types";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  MoreHorizontalIcon: () => <div data-testid="more-horizontal-icon">More</div>,
  SaveIcon: () => <div data-testid="save-icon">Save</div>,
  TrashIcon: () => <div data-testid="trash-icon">Trash</div>,
}));

describe("NoteActionsDropdown", () => {
  const mockProps = {
    onNoteSave: vi.fn(),
    onNoteDelete: vi.fn(),
    saveStatus: "idle" as SaveStatus,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render dropdown trigger button", () => {
      render(<NoteActionsDropdown {...mockProps} />);
      
      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByTestId("more-horizontal-icon")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<NoteActionsDropdown {...mockProps} className="custom-class" />);
      
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("Dropdown content", () => {
    it("should show save and delete options when opened", async () => {
      const user = userEvent.setup();
      render(<NoteActionsDropdown {...mockProps} />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByText("Save Note (Ctrl+S)")).toBeInTheDocument();
      expect(screen.getByText("Delete Note")).toBeInTheDocument();
      expect(screen.getByTestId("save-icon")).toBeInTheDocument();
      expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
    });

    it("should show correct save text when save is disabled", async () => {
      const user = userEvent.setup();
      render(<NoteActionsDropdown {...mockProps} saveStatus="saved" />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByText("Save Note")).toBeInTheDocument();
      expect(screen.queryByText("Save Note (Ctrl+S)")).not.toBeInTheDocument();
    });

    it("should show save shortcut when save is enabled", async () => {
      const user = userEvent.setup();
      render(<NoteActionsDropdown {...mockProps} saveStatus="unsaved" />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByText("Save Note (Ctrl+S)")).toBeInTheDocument();
      expect(screen.queryByText("Save Note")).not.toBeInTheDocument();
    });
  });

  describe("Save functionality", () => {
    it("should call onNoteSave when save option is clicked", async () => {
      const user = userEvent.setup();
      render(<NoteActionsDropdown {...mockProps} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Save Note (Ctrl+S)"));

      expect(mockProps.onNoteSave).toHaveBeenCalledTimes(1);
    });

    it("should disable save option when saveStatus is 'saved'", async () => {
      const user = userEvent.setup();
      render(<NoteActionsDropdown {...mockProps} saveStatus="saved" />);

      await user.click(screen.getByRole("button"));

      const saveOption = screen.getByText("Save Note");
      expect(saveOption).toHaveAttribute("data-disabled");
    });

    it("should enable save option for other saveStatus values", async () => {
      const user = userEvent.setup();
      const statuses: SaveStatus[] = ["idle", "saving", "error", "unsaved"];

      for (const status of statuses) {
        const { unmount } = render(
          <NoteActionsDropdown {...mockProps} saveStatus={status} />
        );

        await user.click(screen.getByRole("button"));

        const saveOption = screen.getByText(/Save Note/);
        expect(saveOption).not.toHaveAttribute("data-disabled");

        unmount();
      }
    });
  });

  describe("Delete functionality", () => {
    it("should call onNoteDelete when delete option is clicked", async () => {
      const user = userEvent.setup();
      render(<NoteActionsDropdown {...mockProps} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Delete Note"));

      expect(mockProps.onNoteDelete).toHaveBeenCalledTimes(1);
    });

    it("should show delete option with destructive styling", async () => {
      const user = userEvent.setup();
      render(<NoteActionsDropdown {...mockProps} />);

      await user.click(screen.getByRole("button"));

      const deleteOption = screen.getByText("Delete Note");
      expect(deleteOption).toHaveClass("text-destructive");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", async () => {
      const user = userEvent.setup();
      render(<NoteActionsDropdown {...mockProps} />);

      const trigger = screen.getByRole("button");
      expect(trigger).toBeInTheDocument();

      await user.click(trigger);

      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined callbacks gracefully", () => {
      const propsWithoutCallbacks = {
        onNoteSave: undefined as any,
        onNoteDelete: undefined as any,
        saveStatus: "idle" as SaveStatus,
      };

      expect(() => {
        render(<NoteActionsDropdown {...propsWithoutCallbacks} />);
      }).not.toThrow();
    });

    it("should handle all saveStatus values correctly", async () => {
      const user = userEvent.setup();
      const statuses: SaveStatus[] = ["idle", "saving", "saved", "error", "unsaved"];

      for (const status of statuses) {
        const { unmount } = render(
          <NoteActionsDropdown {...mockProps} saveStatus={status} />
        );

        await user.click(screen.getByRole("button"));
        
        // Should always show both options
        expect(screen.getByText(/Save Note/)).toBeInTheDocument();
        expect(screen.getByText("Delete Note")).toBeInTheDocument();

        unmount();
      }
    });
  });
});