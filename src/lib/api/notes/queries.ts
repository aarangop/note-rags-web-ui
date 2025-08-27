import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type {
  INotesRepository,
  Note,
  NoteCreate,
  NoteUpdate,
  NotesPage,
} from "../interfaces/notes-repository.interface";

// Query Keys
export const notesKeys = {
  all: ["notes"] as const,
  lists: () => [...notesKeys.all, "list"] as const,
  list: (page: number, size: number) =>
    [...notesKeys.lists(), { page, size }] as const,
  details: () => [...notesKeys.all, "detail"] as const,
  detail: (id: number) => [...notesKeys.details(), id] as const,
};

// Queries
export const useNotes = (
  repository: INotesRepository,
  page: number = 1,
  size: number = 12,
  options?: Omit<UseQueryOptions<NotesPage>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: notesKeys.list(page, size),
    queryFn: () => repository.getNotes(page, size),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useNote = (
  repository: INotesRepository,
  id: number,
  options?: Omit<UseQueryOptions<Note>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: notesKeys.detail(id),
    queryFn: () => repository.getNoteById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Mutations
export const useCreateNote = (
  repository: INotesRepository,
  options?: UseMutationOptions<Note, Error, NoteCreate>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: NoteCreate) => repository.createNote(note),
    onSuccess: (newNote) => {
      // Invalidate and refetch notes lists
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });

      // Add the new note to the cache
      queryClient.setQueryData(notesKeys.detail(newNote.id), newNote);

      options?.onSuccess?.(newNote, {} as NoteCreate, undefined);
    },
    ...options,
  });
};

export const useUpdateNote = (
  repository: INotesRepository,
  options?: UseMutationOptions<
    Note,
    Error,
    { id: number; update: NoteUpdate },
    { previousNote: Note | undefined }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<
    Note,
    Error,
    { id: number; update: NoteUpdate },
    { previousNote: Note | undefined }
  >({
    mutationFn: ({ id, update }: { id: number; update: NoteUpdate }) =>
      repository.updateNote(id, update),
    onMutate: async ({ id, update }) => {
      // Cancel any outgoing refetches for this note
      await queryClient.cancelQueries({ queryKey: notesKeys.detail(id) });

      // Snapshot the previous value
      const previousNote = queryClient.getQueryData<Note>(notesKeys.detail(id));

      // Optimistically update the note
      if (previousNote) {
        const optimisticNote: Note = {
          ...previousNote,
          title: update.title ?? previousNote.title,
          content: update.content ?? previousNote.content,
          metadata: update.metadata ?? previousNote.metadata,
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData(notesKeys.detail(id), optimisticNote);
      }

      return { previousNote };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNote) {
        queryClient.setQueryData(
          notesKeys.detail(variables.id),
          context.previousNote
        );
      }
      options?.onError?.(err, variables, context);
    },
    onSuccess: (updatedNote, variables) => {
      // Update the note in cache
      queryClient.setQueryData(notesKeys.detail(variables.id), updatedNote);

      // Update notes in lists
      queryClient.setQueriesData<NotesPage>(
        { queryKey: notesKeys.lists() },
        (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((note) =>
              note.id === variables.id ? updatedNote : note
            ),
          };
        }
      );

      options?.onSuccess?.(updatedNote, variables, { previousNote: undefined });
    },
    onSettled: (data, error, variables) => {
      // Always refetch after settling to ensure consistency
      queryClient.invalidateQueries({
        queryKey: notesKeys.detail(variables.id),
      });
      options?.onSettled?.(data, error, variables, { previousNote: undefined });
    },
    ...options,
  });
};

export const useDeleteNote = (
  repository: INotesRepository,
  options?: UseMutationOptions<void, Error, number>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => repository.deleteNote(id),
    onSuccess: (_, id) => {
      // Remove note from detail cache
      queryClient.removeQueries({ queryKey: notesKeys.detail(id) });

      // Update notes lists by removing the deleted note
      queryClient.setQueriesData<NotesPage>(
        { queryKey: notesKeys.lists() },
        (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.filter((note) => note.id !== id),
            total: old.total - 1,
          };
        }
      );

      // Invalidate lists to refetch and get accurate pagination
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });

      options?.onSuccess?.(undefined, id, undefined);
    },
    ...options,
  });
};
