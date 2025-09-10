import { useCallback, useRef } from "react";
import { INotesRepository } from "../api/interfaces/notes-repository.interface";
import { NotesRepository } from "../api/repositories/notes-repository";
import useApiClient from "./use-api-client";

export default function useNotesRepository(): INotesRepository {
  const { notesClient } = useApiClient();
  return new NotesRepository(notesClient);
}
