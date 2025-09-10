import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SaveIndicator } from "./save-indicator";
import type { SaveStatus } from "./save-indicator";

// Mock the cn utility function
vi.mock("@/lib/utils", () => ({
  cn: vi.fn((...args) => args.filter(Boolean).join(" ")),
}));

describe("SaveIndicator", () => {
  describe("Status text rendering", () => {
    it("should render saving status with correct text", () => {
      render(<SaveIndicator status="saving" />);
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("should render saved status with correct text", () => {
      render(<SaveIndicator status="saved" />);
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });

    it("should render error status with correct text", () => {
      render(<SaveIndicator status="error" />);
      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("should render unsaved status with correct text", () => {
      render(<SaveIndicator status="unsaved" />);
      expect(screen.getByText("Unsaved")).toBeInTheDocument();
    });

    it("should render idle status with correct text", () => {
      render(<SaveIndicator status="idle" />);
      expect(screen.getByText("Ready")).toBeInTheDocument();
    });

    it("should render unknown status with default text", () => {
      render(<SaveIndicator status="unknown" />);
      expect(screen.getByText("Ready")).toBeInTheDocument();
    });
  });

  describe("Error message handling", () => {
    it("should display custom error message when provided", () => {
      const customError = "Network connection failed";
      render(<SaveIndicator status="error" error={customError} />);
      
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getAllByTitle(customError)).toHaveLength(2);
    });

    it("should display default error message when no custom error provided", () => {
      render(<SaveIndicator status="error" />);
      
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getAllByTitle("Error saving")).toHaveLength(2);
    });

    it("should display default error message when empty error provided", () => {
      render(<SaveIndicator status="error" error="" />);
      
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getAllByTitle("Error saving")).toHaveLength(2);
    });
  });

  describe("Custom styling", () => {
    it("should apply custom className to the container", () => {
      const customClass = "custom-indicator-class";
      const { container } = render(
        <SaveIndicator status="saved" className={customClass} />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass(customClass);
    });
  });

  describe("Accessibility and tooltips", () => {
    it("should have title attributes on both indicator and text", () => {
      render(<SaveIndicator status="unsaved" />);
      
      const expectedTitle = "You have unsaved changes (Ctrl+S to save)";
      
      // Both the indicator dot and text should have the same title
      const elementsWithTitle = screen.getAllByTitle(expectedTitle);
      expect(elementsWithTitle).toHaveLength(2);
    });

    it("should provide meaningful titles for screen readers", () => {
      const statuses: Array<[SaveStatus, string]> = [
        ["saving", "Saving..."],
        ["saved", "All changes saved"],
        ["error", "Error saving"],
        ["unsaved", "You have unsaved changes (Ctrl+S to save)"],
        ["idle", "Ready"],
        ["unknown", "Ready"],
      ];

      statuses.forEach(([status, expectedTitle]) => {
        const { unmount } = render(<SaveIndicator status={status} />);
        
        expect(screen.getAllByTitle(expectedTitle)).toHaveLength(2);
        
        unmount();
      });
    });

  });

  describe("Component structure", () => {
    it("should render both indicator and text elements", () => {
      render(<SaveIndicator status="saved" />);
      
      // Should have both text and indicator elements
      expect(screen.getByText("Saved")).toBeInTheDocument();
      expect(screen.getAllByTitle("All changes saved")).toHaveLength(2);
    });

    it("should maintain consistent structure across different statuses", () => {
      const statuses: SaveStatus[] = ["saving", "saved", "error", "unsaved", "idle", "unknown"];
      const expectedTexts = ["Saving...", "Saved", "Error", "Unsaved", "Ready", "Ready"];
      
      statuses.forEach((status, index) => {
        const { unmount } = render(<SaveIndicator status={status} />);
        
        expect(screen.getByText(expectedTexts[index])).toBeInTheDocument();
        
        unmount();
      });
    });
  });
});