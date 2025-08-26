import type { INotesRepository } from "@/lib/api/interfaces/notes-repository.interface";
import { createMockNotesRepository } from "@/test-utils";
import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepositoryProvider, useRepository } from "./repository-provider";

// Test component to access the repository context
function TestComponent() {
  const { notesRepository } = useRepository();

  return (
    <div>
      <span data-testid="notes-repo-type">
        {notesRepository.constructor.name}
      </span>
      <button
        data-testid="test-notes-action"
        onClick={() => notesRepository.getNotes()}
      >
        Get Notes
      </button>
    </div>
  );
}

// Test component that should fail when used outside provider
function TestComponentOutsideProvider() {
  const { notesRepository } = useRepository();
  return <div>{notesRepository.constructor.name}</div>;
}

describe("RepositoryProvider", () => {
  describe("Production mode (no repositories prop)", () => {
    it("should provide NotesRepository instance by default", () => {
      const { getByTestId } = render(
        <RepositoryProvider>
          <TestComponent />
        </RepositoryProvider>
      );

      expect(getByTestId("notes-repo-type")).toHaveTextContent(
        "NotesRepository"
      );
    });

    it("should create repository instances that can be called", () => {
      const { getByTestId } = render(
        <RepositoryProvider>
          <TestComponent />
        </RepositoryProvider>
      );

      const button = getByTestId("test-notes-action");

      // Should not throw when calling repository method
      expect(() => button.click()).not.toThrow();
    });
  });

  describe("Test mode (with repositories prop)", () => {
    let mockNotesRepository: INotesRepository;

    beforeEach(() => {
      mockNotesRepository = createMockNotesRepository();
    });

    it("should use provided test repositories", () => {
      const { getByTestId } = render(
        <RepositoryProvider
          repositories={{ notesRepository: mockNotesRepository }}
        >
          <TestComponent />
        </RepositoryProvider>
      );

      // Should show mock repository name instead of real one
      expect(getByTestId("notes-repo-type")).toHaveTextContent("Object");
    });

    it("should allow repository methods to be called and mocked", () => {
      const { getByTestId } = render(
        <RepositoryProvider
          repositories={{ notesRepository: mockNotesRepository }}
        >
          <TestComponent />
        </RepositoryProvider>
      );

      const button = getByTestId("test-notes-action");
      button.click();

      expect(mockNotesRepository.getNotes).toHaveBeenCalledOnce();
    });

    it("should pass parameters correctly to repository methods", () => {
      function TestComponentWithParams() {
        const { notesRepository } = useRepository();

        return (
          <button
            data-testid="test-notes-with-params"
            onClick={() => notesRepository.getNotes(2, 10)}
          >
            Get Notes Page 2
          </button>
        );
      }

      const { getByTestId } = render(
        <RepositoryProvider
          repositories={{ notesRepository: mockNotesRepository }}
        >
          <TestComponentWithParams />
        </RepositoryProvider>
      );

      const button = getByTestId("test-notes-with-params");
      button.click();

      expect(mockNotesRepository.getNotes).toHaveBeenCalledWith(2, 10);
    });
  });

  describe("Repository context behavior", () => {
    it("should provide the same repository instance to multiple children", () => {
      let firstRepoInstance: INotesRepository;
      let secondRepoInstance: INotesRepository;

      function FirstChild() {
        const { notesRepository } = useRepository();
        firstRepoInstance = notesRepository;
        return <div data-testid="first-child">First</div>;
      }

      function SecondChild() {
        const { notesRepository } = useRepository();
        secondRepoInstance = notesRepository;
        return <div data-testid="second-child">Second</div>;
      }

      render(
        <RepositoryProvider>
          <FirstChild />
          <SecondChild />
        </RepositoryProvider>
      );

      expect(firstRepoInstance!).toBe(secondRepoInstance!);
    });

    it("should memoize repository instances to prevent recreating on re-renders", () => {
      let renderCount = 0;
      let repositoryInstances: INotesRepository[] = [];

      function TestChild() {
        const { notesRepository } = useRepository();
        repositoryInstances.push(notesRepository);
        renderCount++;
        return <div>Render count: {renderCount}</div>;
      }

      const { rerender } = render(
        <RepositoryProvider>
          <TestChild />
        </RepositoryProvider>
      );

      // Force a re-render
      rerender(
        <RepositoryProvider>
          <TestChild />
        </RepositoryProvider>
      );

      expect(renderCount).toBe(2);
      expect(repositoryInstances[0]).toBe(repositoryInstances[1]);
    });
  });

  describe("Error handling", () => {
    it("should throw error when useRepository is used outside RepositoryProvider", () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow("useRepository must be used within a RepositoryProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("Provider composition", () => {
    it("should work when nested within other providers", () => {
      function OuterProvider({ children }: { children: React.ReactNode }) {
        return <div data-testid="outer-provider">{children}</div>;
      }

      const { getByTestId } = render(
        <OuterProvider>
          <RepositoryProvider>
            <TestComponent />
          </RepositoryProvider>
        </OuterProvider>
      );

      expect(getByTestId("outer-provider")).toBeInTheDocument();
      expect(getByTestId("notes-repo-type")).toHaveTextContent(
        "NotesRepository"
      );
    });

    it("should allow multiple RepositoryProvider instances with different configurations", () => {
      const mockRepo1 = createMockNotesRepository();
      const mockRepo2 = createMockNotesRepository();

      function FirstProviderChild() {
        const { notesRepository } = useRepository();
        return (
          <button
            data-testid="first-provider-button"
            onClick={() => notesRepository.getNotes()}
          >
            First Provider
          </button>
        );
      }

      function SecondProviderChild() {
        const { notesRepository } = useRepository();
        return (
          <button
            data-testid="second-provider-button"
            onClick={() => notesRepository.getNotes()}
          >
            Second Provider
          </button>
        );
      }

      const { getByTestId } = render(
        <div>
          <RepositoryProvider repositories={{ notesRepository: mockRepo1 }}>
            <FirstProviderChild />
          </RepositoryProvider>
          <RepositoryProvider repositories={{ notesRepository: mockRepo2 }}>
            <SecondProviderChild />
          </RepositoryProvider>
        </div>
      );

      getByTestId("first-provider-button").click();
      getByTestId("second-provider-button").click();

      expect(mockRepo1.getNotes).toHaveBeenCalledOnce();
      expect(mockRepo2.getNotes).toHaveBeenCalledOnce();
    });
  });
});
