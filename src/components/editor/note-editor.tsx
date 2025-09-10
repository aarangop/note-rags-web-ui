"use client";

import React from "react";
import { MilkdownEditor } from "./milkdown-editor";
import { NoteHeader } from "./note-header";
import type { Note } from "@/lib/stores/notes-store.types";
import { SaveStatus } from "@/lib/types/save-status.types";

interface NoteEditorProps {
  note: Note;
  saveStatus: SaveStatus;
  onContentChanged: (newContent: string) => void;
  onNoteSave: () => void;
  onTitleChanged: (newTitle: string) => void;
  onDelete: () => void;
}

export const NoteEditor = React.memo(function NoteEditor({
  note,
  saveStatus,
  onContentChanged,
  onNoteSave,
  onTitleChanged,
  onDelete,
}: NoteEditorProps) {
  return (
    <div className={`flex h-full flex-col`}>
      {/* Note Header */}
      <NoteHeader
        note={note}
        onTitleChanged={onTitleChanged}
        onNoteSave={onNoteSave}
        onNoteDelete={onDelete}
        saveStatus={saveStatus}
      />

      {/* Main Editor Area with Paper Design */}
      <div className="flex-1 px-6 py-2 overflow-hidden">
        <div className="h-full bg-note-editor-surface rounded-lg shadow-sm border border-border overflow-hidden">
          <MilkdownEditor
            initialContent={note.content}
            placeholder="Start writing your note..."
            onContentChange={onContentChanged}
          />
        </div>
      </div>
    </div>
  );
});
