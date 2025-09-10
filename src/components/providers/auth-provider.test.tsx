import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSession } from "next-auth/react";
import AuthProvider, { useAuth } from "./auth-provider";
import { createMockSession } from "@/test-utils";
import type { Session } from "next-auth";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

const mockUseSession = vi.mocked(useSession);

// Test component to access the auth context
function TestAuthComponent() {
  const { token, isAuthenticated, isLoading } = useAuth();

  return (
    <div>
      <span data-testid="token">{token || "null"}</span>
      <span data-testid="is-authenticated">{isAuthenticated.toString()}</span>
      <span data-testid="is-loading">{isLoading.toString()}</span>
    </div>
  );
}

// Test component that should fail when used outside provider
function TestComponentOutsideProvider() {
  const { isAuthenticated } = useAuth();
  return <div>{isAuthenticated.toString()}</div>;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication states", () => {
    it("should provide unauthenticated state when no session", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: vi.fn(),
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      expect(getByTestId("token")).toHaveTextContent("null");
      expect(getByTestId("is-authenticated")).toHaveTextContent("false");
      expect(getByTestId("is-loading")).toHaveTextContent("false");
    });

    it("should provide authenticated state when session exists", () => {
      const mockSession = createMockSession();
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: "authenticated",
        update: vi.fn(),
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      expect(getByTestId("token")).toHaveTextContent(mockSession.accessToken || "");
      expect(getByTestId("is-authenticated")).toHaveTextContent("true");
      expect(getByTestId("is-loading")).toHaveTextContent("false");
    });

    it("should provide loading state when session is loading", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "loading",
        update: vi.fn(),
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      expect(getByTestId("token")).toHaveTextContent("null");
      expect(getByTestId("is-authenticated")).toHaveTextContent("false");
      expect(getByTestId("is-loading")).toHaveTextContent("true");
    });
  });

  describe("Context behavior", () => {
    it("should provide the same auth context to multiple children", () => {
      const mockSession = createMockSession();
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: "authenticated",
        update: vi.fn(),
      });

      let firstAuthContext: ReturnType<typeof useAuth>;
      let secondAuthContext: ReturnType<typeof useAuth>;

      function FirstChild() {
        firstAuthContext = useAuth();
        return <div data-testid="first-child">First</div>;
      }

      function SecondChild() {
        secondAuthContext = useAuth();
        return <div data-testid="second-child">Second</div>;
      }

      render(
        <AuthProvider>
          <FirstChild />
          <SecondChild />
        </AuthProvider>
      );

      expect(firstAuthContext!.token).toBe(secondAuthContext!.token);
      expect(firstAuthContext!.isAuthenticated).toBe(
        secondAuthContext!.isAuthenticated
      );
      expect(firstAuthContext!.isLoading).toBe(secondAuthContext!.isLoading);
    });
  });

  describe("Error handling", () => {
    it("should throw error when useAuth is used outside AuthProvider", () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow("useAuth hook must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("Session edge cases", () => {
    it("should handle session without accessToken", () => {
      const sessionWithoutToken = {
        user: { id: "test", email: "test@example.com" },
        expires: "2024-12-31",
      } as Session;

      mockUseSession.mockReturnValue({
        data: sessionWithoutToken,
        status: "authenticated",
        update: vi.fn(),
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      expect(getByTestId("token")).toHaveTextContent("null");
      expect(getByTestId("is-authenticated")).toHaveTextContent("false");
    });

    it("should handle session with empty string token", () => {
      const sessionWithEmptyToken = createMockSession({ accessToken: "" });

      mockUseSession.mockReturnValue({
        data: sessionWithEmptyToken,
        status: "authenticated",
        update: vi.fn(),
      });

      const { getByTestId } = render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      expect(getByTestId("token")).toHaveTextContent("null");
      expect(getByTestId("is-authenticated")).toHaveTextContent("false");
    });
  });

  describe("Provider composition", () => {
    it("should work when nested within other providers", () => {
      const mockSession = createMockSession();
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: "authenticated",
        update: vi.fn(),
      });

      function OuterProvider({ children }: { children: React.ReactNode }) {
        return <div data-testid="outer-provider">{children}</div>;
      }

      const { getByTestId } = render(
        <OuterProvider>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </OuterProvider>
      );

      expect(getByTestId("outer-provider")).toBeInTheDocument();
      expect(getByTestId("is-authenticated")).toHaveTextContent("true");
    });
  });
});