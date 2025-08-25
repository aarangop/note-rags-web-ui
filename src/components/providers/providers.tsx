"use client";

import { QueryProvider } from "@/components/providers/query-provider";
import { RepositoryProvider } from "@/components/providers/repository-provider";
import { SessionProvider } from "next-auth/react";
import React from "react";
import AuthProvider from "./auth-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <RepositoryProvider>
          <AuthProvider>{children}</AuthProvider>
        </RepositoryProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
