"use client";
import { useSession } from "next-auth/react";
import React, { createContext, ReactNode, useContext, useEffect } from "react";
import { useRepository } from "./repository-provider";

interface IAuthContext {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { notesRepository } = useRepository();

  // Auto-sync token with API client when session changes
  useEffect(() => {
    if (session?.accessToken) {
      notesRepository.setAuthToken(session.accessToken);
    } else {
      notesRepository.removeAuthToken();
    }
  }, [session, notesRepository]);

  const value = {
    token: session?.accessToken || null,
    isAuthenticated: !!session?.accessToken,
    isLoading: status == "loading",
  } as IAuthContext;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth hook must be used within an AuthProvider");
  }
  return context;
}
