"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCreateNoteWithDefaults } from "@/lib/hooks/use-notes";
import { useRouter } from "next/navigation";
import { Header } from "./header";

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export function AppLayout({ children, showSidebar = false }: AppLayoutProps) {
  const router = useRouter();
  const createNoteMutation = useCreateNoteWithDefaults();
  const { isLoading, isAuthenticated } = useAuth();

  const handleCreateNote = async () => {
    try {
      const newNote = await createNoteMutation.mutateAsync({
        title: "Untitled Note",
        content: "",
      });
      router.push(`/notes/${newNote.id}`);
    } catch (error) {
      console.error("Failed to create note:", error);
      // Show user-friendly error message
      alert("Failed to create new note. Please make sure the API server is running on localhost:8003");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onCreateNote={handleCreateNote} />
      <main className="w-full">{children}</main>
    </div>
  );
}
