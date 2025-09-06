"use client";

import { NoteEditor } from "@/components/editor/note-editor";
import { components } from "@/lib/api/notes/types";
import { useNoteSync } from "@/lib/hooks/use-note-sync";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

interface NotePageProps {
  params: Promise<{
    id: string;
  }>;
}
type Note = components["schemas"]["Note"];
export default function NotePage({ params }: NotePageProps) {
  const router = useRouter();
  const { id } = use(params);
  const noteId = parseInt(id);

  const [initialNote, setInitialNote] = useState<Note | null>(null);

  const { note, isLoading, error } = useNoteSync(noteId);

  useEffect(() => {
    if (!initialNote && note) {
      setInitialNote(note);
    }
  }, [note]);

  const handleDelete = () => {
    router.push("/notes");
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-6rem)] max-w-4xl mx-auto px-4 flex flex-col">
        <div className="flex-1 pt-4 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading note...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-6rem)] max-w-4xl mx-auto px-4 flex flex-col">
        <div className="flex-1 pt-4 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">
              {error instanceof Error ? error.message : "Failed to load note"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!note || !initialNote) {
    return (
      <div className="h-[calc(100vh-6rem)] max-w-4xl mx-auto px-4 flex flex-col">
        <div className="flex-1 pt-4 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Note not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] max-w-4xl mx-auto px-4 flex flex-col">
      <div className="flex-1 pt-4 min-h-0">
        <NoteEditor
          noteId={noteId}
          initialNote={initialNote}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
