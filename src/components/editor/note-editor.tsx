"use client";

import { useNoteEditor } from "@/lib/hooks/use-note-editor";
import { MilkdownEditor } from "./milkdown-editor";
import { NoteHeader } from "./note-header";
import type { Note } from "@/lib/stores/notes-store.types";

interface NoteEditorProps {
  noteId: number;
  initialNote: Note;
  onDelete?: () => void;
}

export function NoteEditor({ noteId, initialNote, onDelete }: NoteEditorProps) {
  const {
    note,
    updateContent,
    updateTitle,
    deleteNote,
    forceSave,
    saveStatus,
  } = useNoteEditor(noteId, initialNote);

  const handleDelete = async () => {
    await deleteNote();
    onDelete?.();
  };

  return (
    <div className={`flex h-full flex-col`}>
      {/* Note Header */}
      <NoteHeader
        note={note}
        updateTitle={updateTitle}
        forceSave={forceSave}
        deleteNote={deleteNote}
        saveStatus={saveStatus}
        onDelete={handleDelete}
      />

      {/* Main Editor Area with Paper Design */}
      <div className="flex-1 px-6 py-2 overflow-hidden">
        <div className="h-full bg-note-editor-surface rounded-lg shadow-sm border border-border overflow-hidden">
          <MilkdownEditor
            content={initialNote.content}
            placeholder="Start writing your note..."
            onContentChange={updateContent}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
