// Store hooks
export { useNotesStore } from './notes-store';
export { useUIStore } from './ui-store';

// Types
export type { NotesStore, UIStore, Note } from './notes-store.types';

// Re-export SaveStatus for convenience
export type { SaveStatus } from '../services/auto-save-service.types';