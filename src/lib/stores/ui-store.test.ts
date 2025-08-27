import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useUIStore } from './ui-store';
import { SaveStatus } from '../services/auto-save-service.types';

describe('UIStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useUIStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useUIStore());
      
      expect(result.current.saveStatus).toBeInstanceOf(Map);
      expect(result.current.saveStatus.size).toBe(0);
      expect(result.current.errors).toBeInstanceOf(Map);
      expect(result.current.errors.size).toBe(0);
      expect(result.current.lastSaved).toBeInstanceOf(Map);
      expect(result.current.lastSaved.size).toBe(0);
    });
  });

  describe('Actions', () => {
    describe('setSaveStatus', () => {
      it('should set save status for a note', () => {
        const { result } = renderHook(() => useUIStore());
        const noteId = 1;
        const status: SaveStatus = 'saving';

        act(() => {
          result.current.setSaveStatus(noteId, status);
        });

        expect(result.current.saveStatus.get(noteId)).toBe(status);
      });

      it('should update existing save status', () => {
        const { result } = renderHook(() => useUIStore());
        const noteId = 1;

        act(() => {
          result.current.setSaveStatus(noteId, 'saving');
          result.current.setSaveStatus(noteId, 'saved');
        });

        expect(result.current.saveStatus.get(noteId)).toBe('saved');
      });

      it('should handle multiple notes with different statuses', () => {
        const { result } = renderHook(() => useUIStore());

        act(() => {
          result.current.setSaveStatus(1, 'saving');
          result.current.setSaveStatus(2, 'saved');
          result.current.setSaveStatus(3, 'error');
        });

        expect(result.current.saveStatus.get(1)).toBe('saving');
        expect(result.current.saveStatus.get(2)).toBe('saved');
        expect(result.current.saveStatus.get(3)).toBe('error');
        expect(result.current.saveStatus.size).toBe(3);
      });
    });

    describe('setError', () => {
      it('should set error message for a note', () => {
        const { result } = renderHook(() => useUIStore());
        const noteId = 1;
        const errorMessage = 'Failed to save note';

        act(() => {
          result.current.setError(noteId, errorMessage);
        });

        expect(result.current.errors.get(noteId)).toBe(errorMessage);
      });

      it('should update existing error message', () => {
        const { result } = renderHook(() => useUIStore());
        const noteId = 1;

        act(() => {
          result.current.setError(noteId, 'First error');
          result.current.setError(noteId, 'Second error');
        });

        expect(result.current.errors.get(noteId)).toBe('Second error');
      });
    });

    describe('clearError', () => {
      it('should remove error for a note', () => {
        const { result } = renderHook(() => useUIStore());
        const noteId = 1;

        act(() => {
          result.current.setError(noteId, 'Some error');
          result.current.clearError(noteId);
        });

        expect(result.current.errors.get(noteId)).toBeUndefined();
        expect(result.current.errors.size).toBe(0);
      });

      it('should do nothing if no error exists', () => {
        const { result } = renderHook(() => useUIStore());

        act(() => {
          result.current.clearError(999);
        });

        expect(result.current.errors.size).toBe(0);
      });

      it('should only clear specific note error', () => {
        const { result } = renderHook(() => useUIStore());

        act(() => {
          result.current.setError(1, 'Error 1');
          result.current.setError(2, 'Error 2');
          result.current.clearError(1);
        });

        expect(result.current.errors.get(1)).toBeUndefined();
        expect(result.current.errors.get(2)).toBe('Error 2');
        expect(result.current.errors.size).toBe(1);
      });
    });

    describe('setLastSaved', () => {
      it('should set last saved timestamp for a note', () => {
        const { result } = renderHook(() => useUIStore());
        const noteId = 1;
        const timestamp = new Date('2024-01-01T10:00:00Z');

        act(() => {
          result.current.setLastSaved(noteId, timestamp);
        });

        expect(result.current.lastSaved.get(noteId)).toBe(timestamp);
      });

      it('should update existing timestamp', () => {
        const { result } = renderHook(() => useUIStore());
        const noteId = 1;
        const firstTime = new Date('2024-01-01T10:00:00Z');
        const secondTime = new Date('2024-01-01T11:00:00Z');

        act(() => {
          result.current.setLastSaved(noteId, firstTime);
          result.current.setLastSaved(noteId, secondTime);
        });

        expect(result.current.lastSaved.get(noteId)).toBe(secondTime);
      });
    });

    describe('reset', () => {
      it('should reset all state to initial values', () => {
        const { result } = renderHook(() => useUIStore());
        const timestamp = new Date();

        act(() => {
          result.current.setSaveStatus(1, 'saving');
          result.current.setError(2, 'Some error');
          result.current.setLastSaved(3, timestamp);
          result.current.reset();
        });

        expect(result.current.saveStatus.size).toBe(0);
        expect(result.current.errors.size).toBe(0);
        expect(result.current.lastSaved.size).toBe(0);
      });
    });
  });

  describe('Selectors', () => {
    describe('getSaveStatus', () => {
      it('should return save status for existing note', () => {
        const { result } = renderHook(() => useUIStore());
        const noteId = 1;
        const status: SaveStatus = 'saved';

        act(() => {
          result.current.setSaveStatus(noteId, status);
        });

        expect(result.current.getSaveStatus(noteId)).toBe(status);
      });

      it('should return "idle" for non-existent note', () => {
        const { result } = renderHook(() => useUIStore());

        expect(result.current.getSaveStatus(999)).toBe('idle');
      });
    });

    describe('getError', () => {
      it('should return error message for existing note', () => {
        const { result } = renderHook(() => useUIStore());
        const noteId = 1;
        const error = 'Network error';

        act(() => {
          result.current.setError(noteId, error);
        });

        expect(result.current.getError(noteId)).toBe(error);
      });

      it('should return undefined for note with no error', () => {
        const { result } = renderHook(() => useUIStore());

        expect(result.current.getError(999)).toBeUndefined();
      });
    });

    describe('getLastSaved', () => {
      it('should return timestamp for existing note', () => {
        const { result } = renderHook(() => useUIStore());
        const noteId = 1;
        const timestamp = new Date('2024-01-01T10:00:00Z');

        act(() => {
          result.current.setLastSaved(noteId, timestamp);
        });

        expect(result.current.getLastSaved(noteId)).toBe(timestamp);
      });

      it('should return undefined for note with no timestamp', () => {
        const { result } = renderHook(() => useUIStore());

        expect(result.current.getLastSaved(999)).toBeUndefined();
      });
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle save lifecycle correctly', () => {
      const { result } = renderHook(() => useUIStore());
      const noteId = 1;
      const timestamp = new Date();

      // Start saving
      act(() => {
        result.current.setSaveStatus(noteId, 'saving');
        result.current.clearError(noteId);
      });

      expect(result.current.getSaveStatus(noteId)).toBe('saving');
      expect(result.current.getError(noteId)).toBeUndefined();

      // Save successful
      act(() => {
        result.current.setSaveStatus(noteId, 'saved');
        result.current.setLastSaved(noteId, timestamp);
      });

      expect(result.current.getSaveStatus(noteId)).toBe('saved');
      expect(result.current.getLastSaved(noteId)).toBe(timestamp);
    });

    it('should handle save error correctly', () => {
      const { result } = renderHook(() => useUIStore());
      const noteId = 1;
      const errorMessage = 'Save failed';

      // Save fails
      act(() => {
        result.current.setSaveStatus(noteId, 'error');
        result.current.setError(noteId, errorMessage);
      });

      expect(result.current.getSaveStatus(noteId)).toBe('error');
      expect(result.current.getError(noteId)).toBe(errorMessage);

      // Retry clears error
      act(() => {
        result.current.setSaveStatus(noteId, 'saving');
        result.current.clearError(noteId);
      });

      expect(result.current.getSaveStatus(noteId)).toBe('saving');
      expect(result.current.getError(noteId)).toBeUndefined();
    });

    it('should handle multiple notes independently', () => {
      const { result } = renderHook(() => useUIStore());
      const timestamp1 = new Date('2024-01-01T10:00:00Z');

      act(() => {
        // Note 1: successful save
        result.current.setSaveStatus(1, 'saved');
        result.current.setLastSaved(1, timestamp1);

        // Note 2: error state
        result.current.setSaveStatus(2, 'error');
        result.current.setError(2, 'Network error');

        // Note 3: saving state
        result.current.setSaveStatus(3, 'saving');
      });

      expect(result.current.getSaveStatus(1)).toBe('saved');
      expect(result.current.getLastSaved(1)).toBe(timestamp1);
      expect(result.current.getError(1)).toBeUndefined();

      expect(result.current.getSaveStatus(2)).toBe('error');
      expect(result.current.getError(2)).toBe('Network error');
      expect(result.current.getLastSaved(2)).toBeUndefined();

      expect(result.current.getSaveStatus(3)).toBe('saving');
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of notes efficiently', () => {
      const { result } = renderHook(() => useUIStore());

      // Set status for 1000 notes
      act(() => {
        for (let i = 1; i <= 1000; i++) {
          result.current.setSaveStatus(i, i % 2 === 0 ? 'saved' : 'idle');
        }
      });

      // Map operations should be O(1)
      const start = performance.now();
      result.current.getSaveStatus(500);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(1); // Should be very fast
      expect(result.current.saveStatus.size).toBe(1000);
    });
  });
});