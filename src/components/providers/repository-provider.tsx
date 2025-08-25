"use client";

import React, { createContext, useContext, useMemo } from "react";
import { createApiClient } from "../../lib/api/client";
import { API_CONFIG } from "../../lib/api/config";
import type { INotesRepository } from "../../lib/api/interfaces/notes-repository.interface";
import { NotesRepository } from "../../lib/api/repositories/notes-repository";

interface RepositoryContext {
  notesRepository: INotesRepository;
  // genaiRepository: IGenAIRepository; // Future addition
}

const RepositoryContext = createContext<RepositoryContext | undefined>(
  undefined
);

interface RepositoryProviderProps {
  children: React.ReactNode;
  // Allow overriding for testing
  repositories?: Partial<RepositoryContext>;
}

export const RepositoryProvider: React.FC<RepositoryProviderProps> = ({
  children,
  repositories,
}) => {
  const value = useMemo(() => {
    if (repositories) {
      // Use provided repositories (for testing)
      return repositories as RepositoryContext;
    }

    // Create production repositories
    const notesClient = createApiClient({
      baseUrl: API_CONFIG.notes.baseUrl,
    });

    const notesRepository = new NotesRepository(notesClient);

    // const genaiClient = createApiClient({
    //   baseUrl: API_CONFIG.genai.baseUrl,
    // });
    // const genaiRepository = new GenAIRepository(genaiClient);

    return {
      notesRepository,
      // genaiRepository,
    };
  }, [repositories]);

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
};

export const useRepository = (): RepositoryContext => {
  const context = useContext(RepositoryContext);

  if (context === undefined) {
    throw new Error("useRepository must be used within a RepositoryProvider");
  }

  return context;
};
