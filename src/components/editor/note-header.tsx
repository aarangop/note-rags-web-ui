"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MoreHorizontalIcon, SaveIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { SaveIndicator } from "./save-indicator";
import { SaveStatus } from "@/lib/services/auto-save-service.types";

interface NoteHeaderProps {
  note: any;
  updateTitle: (title: string) => Promise<any>;
  forceSave: () => Promise<void>;
  deleteNote: () => Promise<void>;
  saveStatus: SaveStatus;
  className?: string;
  onDelete?: () => void;
}

export function NoteHeader({ 
  note, 
  updateTitle, 
  forceSave, 
  deleteNote, 
  saveStatus,
  className = "", 
  onDelete 
}: NoteHeaderProps) {
  
  const handleDelete = async () => {
    await deleteNote();
    onDelete?.();
  };
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
      updateTitle(editableTitle.trim() || "Untitled Note");
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={forceSave}>
                <SaveIcon className="h-4 w-4 mr-2" />
                Save Note
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
