import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./mocks/server";

// Make React globally available in tests
global.React = React;

// Global test setup
// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: vi.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
}));

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  // Start MSW server
  server.listen({ onUnhandledRequest: "error" });

  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render is deprecated")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning:") || args[0].includes("ReactQueryDevtools"))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  console.log = (...args: unknown[]) => {
    // Filter out API client debug logs in tests unless explicitly needed
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Setting auth token") ||
        args[0].includes("About to make request") ||
        args[0].includes("Setting Authorization header"))
    ) {
      return;
    }
    originalLog.call(console, ...args);
  };
});

afterEach(() => {
  // Reset handlers after each test to ensure clean state
  server.resetHandlers();
});

afterAll(() => {
  // Clean up MSW server
  server.close();

  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});

// Global test configuration
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
