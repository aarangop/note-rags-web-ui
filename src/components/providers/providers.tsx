"use client";

import { QueryProvider } from "@/lib/providers/query-provider";
import { RepositoryProvider } from "@/lib/providers/repository-provider";
import { SessionProvider } from "next-auth/react";
import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <RepositoryProvider>{children}</RepositoryProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
