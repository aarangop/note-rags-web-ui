import type {
  NoteCreate,
  NoteUpdate,
} from "../api/interfaces/notes-repository.interface";
import {
  useCreateNote as useCreateNoteMutation,
  useDeleteNote as useDeleteNoteMutation,
  useNote as useNoteQuery,
  useNotes as useNotesQuery,
  useUpdateNote as useUpdateNoteMutation,
} from "../api/notes/queries";
import { useRepository } from "../providers/repository-provider";

// Custom hooks that automatically inject the repository
export const useNotes = (page: number = 1, size: number = 12) => {
  const { notesRepository } = useRepository();
  return useNotesQuery(notesRepository, page, size);
};

export const useNote = (id: number) => {
  const { notesRepository } = useRepository();
  return useNoteQuery(notesRepository, id);
};

export const useCreateNote = () => {
  const { notesRepository } = useRepository();
  return useCreateNoteMutation(notesRepository);
};

export const useUpdateNote = () => {
  const { notesRepository } = useRepository();
  return useUpdateNoteMutation(notesRepository);
};

export const useDeleteNote = () => {
  const { notesRepository } = useRepository();
  return useDeleteNoteMutation(notesRepository);
};

// Convenience hook for creating a new note with common defaults
export const useCreateNoteWithDefaults = () => {
  const createNote = useCreateNote();

  return {
    ...createNote,
    mutateAsync: async (data: { title: string; content: string }) => {
      const noteCreate: NoteCreate = {
        title: data.title,
        content: data.content,
        file_path: `/notes/${data.title.toLowerCase().replace(/\s+/g, "-")}.md`,
        document_type: "note",
        metadata: {},
      };

      return createNote.mutateAsync(noteCreate);
    },
  };
};

// Convenience hook for updating note content (common operation)
export const useUpdateNoteContent = () => {
  const updateNote = useUpdateNote();

  return {
    ...updateNote,
    mutateAsync: async (data: {
      id: number;
      title?: string;
      content?: string;
    }) => {
      const update: NoteUpdate = {};
      if (data.title !== undefined) update.title = data.title;
      if (data.content !== undefined) update.content = data.content;

      return updateNote.mutateAsync({ id: data.id, update });
    },
  };
};
