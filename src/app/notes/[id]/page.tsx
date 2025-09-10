"use client";

import { NoteEditor } from "@/components/editor/note-editor";
import { Saving } from "@/components/editor/note-editor.stories";
import { components } from "@/lib/api/notes/types";
import useNoteEditor from "@/lib/hooks/use-note-editor";
import { useDeleteNote, useNote } from "@/lib/hooks/use-notes";
import useSaveNote from "@/lib/hooks/use-save-note";
import { useNotesStore } from "@/lib/stores";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

interface NotePageProps {
  params: Promise<{
    id: string;
  }>;
}

type Note = components["schemas"]["Note"];
export default function NotePage({ params }: NotePageProps) {
  // Router to redirect user on note deletion
  const router = useRouter();
  // Extract note id from url params
  const { id } = use(params);
  const noteId = parseInt(id);
  // Callback for when the note has been deleted
  const onNoteDeleted = () => {
    router.push("../notes");
  };

  // Consume methods from the useNoteEditor hook
  const {
    note,
    isLoading,
    error,
    saveStatus,
    handleContentChange,
    handleDelete,
    handleNoteSave,
    handleTitleChanged,
  } = useNoteEditor({ noteId, onNoteDeleted });

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

  if (!note) {
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
          saveStatus={saveStatus}
          note={note}
          onDelete={handleDelete}
          onContentChanged={handleContentChange}
          onNoteSave={handleNoteSave}
          onTitleChanged={handleTitleChanged}
        />
      </div>
    </div>
  );
}
