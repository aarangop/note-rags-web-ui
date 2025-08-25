'use client';

import { useSession } from "next-auth/react";
import type { AuthUser } from "../types/auth";

export function useAuth() {
  const { data: session, status } = useSession();

  const user: AuthUser | null = session?.user ? {
    id: ('id' in session.user ? session.user.id as string : null) || session.user.email || '',
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  } : null;

  return {
    user,
    session,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isUnauthenticated: status === "unauthenticated",
    accessToken: session?.accessToken,
    idToken: session?.idToken,
  };
}