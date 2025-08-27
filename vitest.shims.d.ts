/// <reference types="@vitest/browser/providers/playwright" />

// Make React available globally in tests
declare global {
  const React: typeof import("react");
}
