import type { INotesRepository } from "@/lib/api/interfaces/notes-repository.interface";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, RenderOptions } from "@testing-library/react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import React, { ReactElement } from "react";
import { vi } from "vitest";

// Test utilities for mocking providers and common testing patterns
// Updated for store-based architecture (no longer uses RepositoryProvider)

interface TestProviderOptions {
  queryClient?: QueryClient;
  session?: Session | null;
}

// Create a test wrapper with all necessary providers
function TestProviders({
  children,
  options = {},
}: {
  children: React.ReactNode;
  options?: TestProviderOptions;
}) {
  const {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
          gcTime: Infinity,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    session = null,
  } = options;

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}

// Custom render function that includes all providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & {
    providerOptions?: TestProviderOptions;
  }
) {
  const { providerOptions, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <TestProviders options={providerOptions}>{children}</TestProviders>
    ),
    ...renderOptions,
  });
}

// Mock repository factory
export function createMockNotesRepository() {
  return {
    getNotes: vi.fn(),
    getNoteById: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    setAuthToken: vi.fn(),
    removeAuthToken: vi.fn(),
  } as const;
}

// Mock session factory
export function createMockSession(overrides?: Partial<Session>): Session {
  return {
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
    },
    accessToken: "test-access-token",
    expires: "2024-12-31",
    ...overrides,
  } as Session;
}

// Helper to create QueryClient for tests
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { customRender as render, TestProviders };
