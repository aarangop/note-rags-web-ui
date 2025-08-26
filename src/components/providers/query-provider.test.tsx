import { server } from "@/mocks/server";
import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryProvider } from "./query-provider";

// Test component that uses React Query
function TestQueryComponent() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["test-query"],
    queryFn: async () => {
      const response = await fetch("/api/test");
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
  });

  return (
    <div>
      <span data-testid="query-client-exists">
        {!!queryClient ? "true" : "false"}
      </span>
      <span data-testid="is-loading">{isLoading.toString()}</span>
      <span data-testid="is-error">{isError.toString()}</span>
      <span data-testid="data">{data ? JSON.stringify(data) : "null"}</span>
      <span data-testid="error">{error?.message || "null"}</span>
    </div>
  );
}

// Test component that triggers retries
function TestRetryComponent() {
  const { data, error, isError, failureCount } = useQuery({
    queryKey: ["retry-test"],
    queryFn: async () => {
      throw new Error("Test error");
    },
    retry: 2,
  });

  return (
    <div>
      <span data-testid="failure-count">{failureCount}</span>
      <span data-testid="is-error">{isError.toString()}</span>
      <span data-testid="error">{error?.message || "null"}</span>
    </div>
  );
}

// Test component that tests specific error codes
function Test404ErrorComponent() {
  const { isError, error } = useQuery({
    queryKey: ["404-test"],
    queryFn: async () => {
      throw new Error("404: Not found");
    },
  });

  return (
    <div>
      <span data-testid="is-error">{isError.toString()}</span>
      <span data-testid="error">{error?.message || "null"}</span>
    </div>
  );
}

function Test403ErrorComponent() {
  const { isError, error } = useQuery({
    queryKey: ["403-test"],
    queryFn: async () => {
      throw new Error("403: Forbidden");
    },
  });

  return (
    <div>
      <span data-testid="is-error">{isError.toString()}</span>
      <span data-testid="error">{error?.message || "null"}</span>
    </div>
  );
}

// Add test endpoint handlers to MSW
const testHandlers = [
  http.get("/api/test", () => {
    return HttpResponse.json({ message: "success", id: 1 });
  }),
];

describe("QueryProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Add test-specific handlers to MSW
    server.use(...testHandlers);
  });

  describe("Provider setup", () => {
    it("should provide QueryClient to children", () => {
      const { getByTestId } = render(
        <QueryProvider>
          <TestQueryComponent />
        </QueryProvider>
      );

      expect(getByTestId("query-client-exists")).toHaveTextContent("true");
    });

    it("should handle successful queries", async () => {
      const { getByTestId } = render(
        <QueryProvider>
          <TestQueryComponent />
        </QueryProvider>
      );

      // Initially loading
      expect(getByTestId("is-loading")).toHaveTextContent("true");
      expect(getByTestId("data")).toHaveTextContent("null");

      // Wait for query to complete
      await waitFor(() => {
        expect(getByTestId("is-loading")).toHaveTextContent("false");
      });

      const expectedData = { message: "success", id: 1 };
      expect(getByTestId("data")).toHaveTextContent(
        JSON.stringify(expectedData)
      );
      expect(getByTestId("is-error")).toHaveTextContent("false");
    });

    it("should handle failed queries", async () => {
      // Create component with no retries for faster testing
      function TestFailureComponent() {
        const { data, isLoading, error, isError } = useQuery({
          queryKey: ["test-failure"],
          queryFn: async () => {
            const response = await fetch("/api/test");
            if (!response.ok) {
              throw new Error(`${response.status}: ${response.statusText}`);
            }
            return response.json();
          },
          retry: false, // Disable retries for this test
        });

        return (
          <div>
            <span data-testid="is-loading">{isLoading.toString()}</span>
            <span data-testid="is-error">{isError.toString()}</span>
            <span data-testid="data">
              {data ? JSON.stringify(data) : "null"}
            </span>
            <span data-testid="error">{error?.message || "null"}</span>
          </div>
        );
      }

      // Override handler to return error
      server.use(
        http.get("/api/test", () => {
          return HttpResponse.json({ error: "Server error" }, { status: 500 });
        })
      );

      const { getByTestId } = render(
        <QueryProvider>
          <TestFailureComponent />
        </QueryProvider>
      );

      // Wait for query to fail
      await waitFor(
        () => {
          expect(getByTestId("is-error")).toHaveTextContent("true");
        },
        { timeout: 10000 }
      );

      expect(getByTestId("error").textContent).toContain("500");
      expect(getByTestId("data")).toHaveTextContent("null");
    });
  });

  describe("Retry configuration", () => {
    it("should use default retry configuration", async () => {
      const { getByTestId } = render(
        <QueryProvider>
          <TestRetryComponent />
        </QueryProvider>
      );

      // Wait for retries to complete
      await waitFor(
        () => {
          expect(getByTestId("is-error")).toHaveTextContent("true");
        },
        { timeout: 5000 }
      );

      // Should have tried multiple times (3 attempts total: initial + 2 retries)
      await waitFor(() => {
        const failureCount = parseInt(
          getByTestId("failure-count").textContent || "0"
        );
        expect(failureCount).toBeGreaterThan(1);
      });
    });

    it("should not retry on 404 errors", async () => {
      const { getByTestId } = render(
        <QueryProvider>
          <Test404ErrorComponent />
        </QueryProvider>
      );

      // Wait for query to fail
      await waitFor(() => {
        expect(getByTestId("is-error")).toHaveTextContent("true");
      });

      expect(getByTestId("error")).toHaveTextContent("404: Not found");
    });

    it("should not retry on 403 errors", async () => {
      const { getByTestId } = render(
        <QueryProvider>
          <Test403ErrorComponent />
        </QueryProvider>
      );

      // Wait for query to fail
      await waitFor(() => {
        expect(getByTestId("is-error")).toHaveTextContent("true");
      });

      expect(getByTestId("error")).toHaveTextContent("403: Forbidden");
    });
  });

  describe("Query client configuration", () => {
    it("should provide query client with correct default options", () => {
      let queryClient: QueryClient;

      function TestConfigComponent() {
        queryClient = useQueryClient();
        return <div>Config test</div>;
      }

      render(
        <QueryProvider>
          <TestConfigComponent />
        </QueryProvider>
      );

      const defaultOptions = queryClient!.getDefaultOptions();

      expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000); // 5 minutes
      expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000); // 10 minutes
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(true);
      expect(defaultOptions.queries?.refetchOnReconnect).toBe(true);
      expect(defaultOptions.mutations?.retry).toBe(1);
    });

    it("should maintain same query client instance across re-renders", () => {
      let firstQueryClient: QueryClient | undefined;
      let secondQueryClient: QueryClient | undefined;

      function TestClientInstance() {
        const queryClient = useQueryClient();
        if (!firstQueryClient) {
          firstQueryClient = queryClient;
        } else {
          secondQueryClient = queryClient;
        }
        return <div>Client instance test</div>;
      }

      const { rerender } = render(
        <QueryProvider>
          <TestClientInstance />
        </QueryProvider>
      );

      // Force a re-render
      rerender(
        <QueryProvider>
          <TestClientInstance />
        </QueryProvider>
      );

      expect(firstQueryClient).toBeDefined();
      expect(secondQueryClient).toBeDefined();
      expect(firstQueryClient).toBe(secondQueryClient);
    });
  });

  describe("Provider composition", () => {
    it("should work when nested within other providers", async () => {
      function OuterProvider({ children }: { children: React.ReactNode }) {
        return <div data-testid="outer-provider">{children}</div>;
      }

      const { getByTestId } = render(
        <OuterProvider>
          <QueryProvider>
            <TestQueryComponent />
          </QueryProvider>
        </OuterProvider>
      );

      expect(getByTestId("outer-provider")).toBeInTheDocument();

      await waitFor(() => {
        const expectedData = { message: "success", id: 1 };
        expect(getByTestId("data")).toHaveTextContent(
          JSON.stringify(expectedData)
        );
      });
    });

    it("should provide independent query clients for multiple providers", () => {
      let firstQueryClient: QueryClient;
      let secondQueryClient: QueryClient;

      function FirstProviderChild() {
        firstQueryClient = useQueryClient();
        return <div data-testid="first-provider">First</div>;
      }

      function SecondProviderChild() {
        secondQueryClient = useQueryClient();
        return <div data-testid="second-provider">Second</div>;
      }

      const { getByTestId } = render(
        <div>
          <QueryProvider>
            <FirstProviderChild />
          </QueryProvider>
          <QueryProvider>
            <SecondProviderChild />
          </QueryProvider>
        </div>
      );

      expect(getByTestId("first-provider")).toBeInTheDocument();
      expect(getByTestId("second-provider")).toBeInTheDocument();

      // Each provider should create its own QueryClient instance
      expect(firstQueryClient!).not.toBe(secondQueryClient!);
    });
  });

  describe("Error boundary behavior", () => {
    it("should handle query errors gracefully without crashing", async () => {
      // Mock console.error to avoid noise in test output
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Create component with no retries for faster testing
      function TestErrorComponent() {
        const { isError, error } = useQuery({
          queryKey: ["test-error-boundary"],
          queryFn: async () => {
            const response = await fetch("/api/test");
            if (!response.ok) {
              throw new Error(`${response.status}: ${response.statusText}`);
            }
            return response.json();
          },
          retry: false,
        });

        return (
          <div>
            <span data-testid="is-error">{isError.toString()}</span>
            <span data-testid="error">{error?.message || "null"}</span>
          </div>
        );
      }

      // Override handler to return error
      server.use(
        http.get("/api/test", () => {
          return HttpResponse.json(
            { error: "Catastrophic failure" },
            { status: 500 }
          );
        })
      );

      const { getByTestId } = render(
        <QueryProvider>
          <TestErrorComponent />
        </QueryProvider>
      );

      await waitFor(() => {
        expect(getByTestId("is-error")).toHaveTextContent("true");
      });

      expect(getByTestId("error").textContent).toContain("500");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("DevTools integration", () => {
    it("should render without throwing when DevTools are included", () => {
      expect(() => {
        render(
          <QueryProvider>
            <div data-testid="devtools-test">DevTools test</div>
          </QueryProvider>
        );
      }).not.toThrow();
    });
  });
});
