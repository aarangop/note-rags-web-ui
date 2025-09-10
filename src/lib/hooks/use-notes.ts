import type {
  INotesRepository,
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
import useNotesRepository from "./use-notes-repository";

// Custom hooks that automatically inject the repository
export const useNotes = (page: number = 1, size: number = 12) => {
  const notesRepository = useNotesRepository();
  return useNotesQuery(notesRepository, page, size);
};

export const useNote = (id: number) => {
  const notesRepository = useNotesRepository();
  return useNoteQuery(notesRepository, id);
};

export const useCreateNote = () => {
  const notesRepository = useNotesRepository();
  return useCreateNoteMutation(notesRepository);
};

export const useUpdateNote = () => {
  const notesRepository = useNotesRepository();
  return useUpdateNoteMutation(notesRepository);
};

export const useDeleteNote = () => {
  const notesRepository = useNotesRepository();
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
