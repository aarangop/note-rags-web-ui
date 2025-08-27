import { afterEach, beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";
import AutoSaveService from "./auto-save-service";
import { AutoSaveCallbacks, AutoSaveConfig, SaveStatus } from "./auto-save-service.types";

interface MockAutoSaveCallbacks {
  getCurrentContent: MockedFunction<() => string>;
  saveToAPI: MockedFunction<(content: string) => Promise<any>>;
  onSaveSuccess: MockedFunction<(savedNote: any) => void>;
  onSaveError: MockedFunction<(error: Error) => void>;
  onStatusChange: MockedFunction<(status: SaveStatus) => void>;
}

describe("AutoSaveService", () => {
  let service: AutoSaveService;
  let mockCallbacks: MockAutoSaveCallbacks;
  let config: AutoSaveConfig;

  beforeEach(() => {
    vi.useFakeTimers();

    mockCallbacks = {
      getCurrentContent: vi.fn().mockReturnValue("test content"),
      saveToAPI: vi.fn().mockResolvedValue({
        id: 1,
        title: "Test", 
        content: "test content",
        updatedAt: new Date(),
      }),
      onSaveSuccess: vi.fn(),
      onSaveError: vi.fn(),
      onStatusChange: vi.fn(),
    };

    config = {
      debounceMs: 2000,
      retryAttempts: 3,
      retryDelayMs: 1000,
    };

    service = new AutoSaveService(1, mockCallbacks as AutoSaveCallbacks, config);
  });

  afterEach(() => {
    service?.destroy();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with idle status", () => {
      expect(service.status).toBe("idle");
      expect(service.lastSaved).toBeNull();
    });

    it("should call onStatusChange with initial idle status", () => {
      expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith("idle");
    });
  });

  describe("queueSave", () => {
    it("should debounce multiple rapid saves", async () => {
      // Queue multiple saves rapidly
      service.queueSave();
      service.queueSave();
      service.queueSave();

      // Should not save immediately
      expect(mockCallbacks.saveToAPI).not.toHaveBeenCalled();
      expect(service.status).toBe("idle");

      // Fast-forward past debounce time
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      // Should save only once
      expect(mockCallbacks.saveToAPI).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.saveToAPI).toHaveBeenCalledWith("test content");
    });

    it("should update status during save cycle", async () => {
      service.queueSave();
      vi.advanceTimersByTime(2000);

      // Should be saving
      expect(service.status).toBe("saving");
      expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith("saving");

      await vi.runAllTimersAsync();

      // Should transition to saved, then idle
      expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith("saved");
      expect(mockCallbacks.onStatusChange).toHaveBeenCalledWith("idle");
    });

    it("should not save if content is unchanged since last save", async () => {
      // First save
      service.queueSave();
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      vi.clearAllMocks();

      // Second save with same content
      service.queueSave();
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      expect(mockCallbacks.saveToAPI).not.toHaveBeenCalled();
    });

    it("should save if content changed since last save", async () => {
      // First save
      service.queueSave();
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      // Change content
      mockCallbacks.getCurrentContent.mockReturnValue("new content");

      // Second save with new content
      service.queueSave();
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      expect(mockCallbacks.saveToAPI).toHaveBeenCalledWith("new content");
    });

    it("should queue new save if content changes during save", async () => {
      let saveResolver: (value: any) => void = () => {};
      const savePromise = new Promise((resolve) => {
        saveResolver = resolve;
      });
      mockCallbacks.saveToAPI.mockReturnValue(savePromise);

      // Start first save
      service.queueSave();
      vi.advanceTimersByTime(2000);

      // Change content while save is in progress
      mockCallbacks.getCurrentContent.mockReturnValue("changed content");
      service.queueSave();

      // Complete first save
      saveResolver({
        id: 1,
        title: "Test",
        content: "test content",
        updatedAt: new Date(),
      });
      await vi.runAllTimersAsync();

      // Should queue another save with new content
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      expect(mockCallbacks.saveToAPI).toHaveBeenCalledTimes(2);
      expect(mockCallbacks.saveToAPI).toHaveBeenLastCalledWith(
        "changed content"
      );
    });
  });

  describe("forceSave", () => {
    it("should save immediately without debounce", async () => {
      const promise = service.forceSave();

      expect(service.status).toBe("saving");
      expect(mockCallbacks.saveToAPI).toHaveBeenCalledWith("test content");

      await promise;
      
      // Advance timers to allow status transition to idle
      vi.advanceTimersByTime(200);

      expect(service.status).toBe("idle");
      expect(mockCallbacks.onSaveSuccess).toHaveBeenCalled();
    });

    it("should cancel pending debounced save", async () => {
      service.queueSave();

      // Force save before debounce completes
      await service.forceSave();

      // Advance past original debounce time
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      // Should only have saved once (the force save)
      expect(mockCallbacks.saveToAPI).toHaveBeenCalledTimes(1);
    });

    it("should reject if save fails", async () => {
      const error = new Error("Save failed");
      mockCallbacks.saveToAPI.mockRejectedValue(error);

      // Need to advance timers for retry logic
      const savePromise = service.forceSave();
      await vi.runAllTimersAsync();
      
      await expect(savePromise).rejects.toThrow("Save failed");
      
      expect(service.status).toBe("error");
      expect(mockCallbacks.onSaveError).toHaveBeenCalledWith(error);
    });
  });

  describe("error handling", () => {
    it("should retry failed saves", async () => {
      mockCallbacks.saveToAPI
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValue({
          id: 1,
          title: "Test",
          content: "test content",
          updatedAt: new Date(),
        });

      service.queueSave();
      vi.advanceTimersByTime(2000);

      // Wait for retries
      await vi.advanceTimersByTimeAsync(5000);

      expect(mockCallbacks.saveToAPI).toHaveBeenCalledTimes(3);
      expect(service.status).toBe("idle");
      expect(mockCallbacks.onSaveSuccess).toHaveBeenCalled();
    });

    it("should fail after max retry attempts", async () => {
      const error = new Error("Persistent error");
      mockCallbacks.saveToAPI.mockRejectedValue(error);

      service.queueSave();
      vi.advanceTimersByTime(2000);

      // Wait for all retries
      await vi.advanceTimersByTimeAsync(10000);

      expect(mockCallbacks.saveToAPI).toHaveBeenCalledTimes(4); // 1 + 3 retries
      expect(service.status).toBe("error");
      expect(mockCallbacks.onSaveError).toHaveBeenCalledWith(error);
    });

    it("should use exponential backoff for retries", async () => {
      mockCallbacks.saveToAPI.mockRejectedValue(new Error("Network error"));

      service.queueSave();
      
      // Initial save starts after debounce
      vi.advanceTimersByTime(2000);
      
      // Wait for all retries to complete with exponential backoff
      await vi.advanceTimersByTimeAsync(15000); // Total time for all retries
      
      expect(mockCallbacks.saveToAPI).toHaveBeenCalledTimes(4); // 1 + 3 retries
      expect(service.status).toBe("error");
      expect(mockCallbacks.onSaveError).toHaveBeenCalled();
    });
  });

  describe("status management", () => {
    it("should update lastSaved on successful save", async () => {
      const beforeSave = new Date();

      service.queueSave();
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      expect(service.lastSaved).toBeInstanceOf(Date);
      expect(service.lastSaved!.getTime()).toBeGreaterThanOrEqual(
        beforeSave.getTime()
      );
    });

    it("should transition through status states correctly", async () => {
      const statusCalls: string[] = [];
      // Clear the initial idle call from constructor
      vi.clearAllMocks();
      mockCallbacks.onStatusChange.mockImplementation((status) => {
        statusCalls.push(status);
      });

      service.queueSave();
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();
      vi.advanceTimersByTime(200); // Allow saved -> idle transition

      expect(statusCalls).toEqual(["saving", "saved", "idle"]);
    });

    it("should maintain error status until next save attempt", async () => {
      mockCallbacks.saveToAPI.mockRejectedValue(new Error("Save failed"));

      service.queueSave();
      vi.advanceTimersByTime(2000);
      await vi.advanceTimersByTimeAsync(10000); // Wait for all retries

      expect(service.status).toBe("error");

      // Status should remain error until next save
      vi.advanceTimersByTime(5000);
      expect(service.status).toBe("error");

      // New save should reset status
      mockCallbacks.saveToAPI.mockResolvedValue({
        id: 1,
        title: "Test",
        content: "test content",
        updatedAt: new Date(),
      });
      service.queueSave();
      expect(service.status).toBe("idle"); // Reset on new save attempt
    });
  });

  describe("cleanup", () => {
    it("should cancel pending saves on destroy", () => {
      service.queueSave();
      service.destroy();

      vi.advanceTimersByTime(2000);
      expect(mockCallbacks.saveToAPI).not.toHaveBeenCalled();
    });

    it("should clear all timers on destroy", () => {
      service.queueSave();

      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      service.destroy();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should not accept new saves after destroy", () => {
      service.destroy();
      service.queueSave();

      vi.advanceTimersByTime(2000);
      expect(mockCallbacks.saveToAPI).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle getCurrentContent throwing error", async () => {
      mockCallbacks.getCurrentContent.mockImplementation(() => {
        throw new Error("Content access error");
      });

      service.queueSave();
      vi.advanceTimersByTime(2000);

      expect(service.status).toBe("error");
      expect(mockCallbacks.onSaveError).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should handle concurrent forceSave calls", async () => {
      const promise1 = service.forceSave();
      const promise2 = service.forceSave();

      await Promise.all([promise1, promise2]);

      // Should only save once for concurrent calls
      expect(mockCallbacks.saveToAPI).toHaveBeenCalledTimes(1);
    });

    it("should handle empty content", async () => {
      mockCallbacks.getCurrentContent.mockReturnValue("");

      service.queueSave();
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      expect(mockCallbacks.saveToAPI).toHaveBeenCalledWith("");
    });
  });
});
