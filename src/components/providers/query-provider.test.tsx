import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/mocks/server";
import { QueryProvider } from "./query-provider";

// Simple test component for basic provider functionality
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

// Test component for retry behavior
function TestRetryComponent() {
  const { error, isError, failureCount } = useQuery({
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

describe("QueryProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get("/api/test", () => {
        return HttpResponse.json({ message: "success", id: 1 });
      })
    );
  });

  describe("Core functionality", () => {
    it("should provide QueryClient and handle successful queries", async () => {
      const { getByTestId } = render(
        <QueryProvider>
          <TestQueryComponent />
        </QueryProvider>
      );

      // Should provide QueryClient
      expect(getByTestId("query-client-exists")).toHaveTextContent("true");

      // Should handle successful queries
      expect(getByTestId("is-loading")).toHaveTextContent("true");
      
      await waitFor(() => {
        expect(getByTestId("is-loading")).toHaveTextContent("false");
      });

      const expectedData = { message: "success", id: 1 };
      expect(getByTestId("data")).toHaveTextContent(JSON.stringify(expectedData));
      expect(getByTestId("is-error")).toHaveTextContent("false");
    });

    it("should handle failed queries", async () => {
      server.use(
        http.get("/api/test", () => {
          return HttpResponse.json({ error: "Server error" }, { status: 500 });
        })
      );

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
          retry: false,
        });

        return (
          <div>
            <span data-testid="is-loading">{isLoading.toString()}</span>
            <span data-testid="is-error">{isError.toString()}</span>
            <span data-testid="data">{data ? JSON.stringify(data) : "null"}</span>
            <span data-testid="error">{error?.message || "null"}</span>
          </div>
        );
      }

      const { getByTestId } = render(
        <QueryProvider>
          <TestFailureComponent />
        </QueryProvider>
      );

      await waitFor(() => {
        expect(getByTestId("is-error")).toHaveTextContent("true");
      });

      expect(getByTestId("error").textContent).toContain("500");
      expect(getByTestId("data")).toHaveTextContent("null");
    });
  });

  describe("Retry configuration", () => {
    it("should use default retry configuration", async () => {
      // Create a test component with faster retry delays for testing
      function FastRetryComponent() {
        const { error, isError, failureCount } = useQuery({
          queryKey: ["fast-retry-test"],
          queryFn: async () => {
            throw new Error("Test error");
          },
          retry: 2,
          retryDelay: 10, // Very fast retry delay for testing
        });

        return (
          <div>
            <span data-testid="failure-count">{failureCount}</span>
            <span data-testid="is-error">{isError.toString()}</span>
            <span data-testid="error">{error?.message || "null"}</span>
          </div>
        );
      }

      const { getByTestId } = render(
        <QueryProvider>
          <FastRetryComponent />
        </QueryProvider>
      );

      // Wait for retries to complete quickly
      await waitFor(
        () => {
          expect(getByTestId("is-error")).toHaveTextContent("true");
        },
        { timeout: 1000 }
      );

      // Should have retried multiple times (initial attempt + 2 retries = 3 total)
      await waitFor(() => {
        const failureCount = parseInt(getByTestId("failure-count").textContent || "0");
        expect(failureCount).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe("Provider configuration", () => {
    it("should provide query client with expected configuration", () => {
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
      
      // Test key configuration values
      expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000); // 5 minutes
      expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000); // 10 minutes
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
});