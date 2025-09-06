"use client";

import { QueryProvider } from "@/components/providers/query-provider";
import { RepositoryProvider } from "@/components/providers/repository-provider";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import React from "react";
import AuthProvider from "./auth-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        <QueryProvider>
          <RepositoryProvider>
            <AuthProvider>{children}</AuthProvider>
          </RepositoryProvider>
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
