"use client";

import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { SaveIndicator } from "./save-indicator";
import { NoteActionsDropdown } from "./note-actions-dropdown";
import { SaveStatus } from "@/lib/types/save-status.types";

export interface NoteHeaderProps {
  note: { id: number; title: string; content: string } | null;
  onTitleChanged: (title: string) => void;
  onNoteSave: () => void;
  onNoteDelete: () => void;
  saveStatus: SaveStatus;
  error?: string;
  className?: string;
}

export function NoteHeader({
  note,
  onTitleChanged,
  onNoteSave,
  onNoteDelete,
  saveStatus,
  className = "",
}: NoteHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableTitle, setEditableTitle] = useState(note?.title || "");

  useEffect(() => {
    if (note?.title) {
      setEditableTitle(note.title);
    }
  }, [note?.title]);

  const handleTitleSubmit = () => {
    setIsEditing(false);
    if (note && editableTitle.trim() !== note.title) {
      onTitleChanged(editableTitle.trim() || "Untitled Note");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSubmit();
    } else if (e.key === "Escape") {
      setEditableTitle(note?.title || "");
      setIsEditing(false);
    }
  };

  return (
    <header className={`px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              className="text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0 font-heading"
              autoFocus
            />
          ) : (
            <h1
              className="text-xl font-semibold text-foreground cursor-pointer hover:text-muted-foreground truncate font-heading"
              onClick={() => setIsEditing(true)}
              title="Click to edit title"
            >
              {note?.title || "Untitled Note"}
            </h1>
          )}
        </div>

        <div className="flex items-center space-x-4 ml-4">
          <SaveIndicator status={saveStatus} />
          <NoteActionsDropdown
            onNoteSave={onNoteSave}
            onNoteDelete={onNoteDelete}
            saveStatus={saveStatus}
          />
        </div>
      </div>
    </header>
  );
}
