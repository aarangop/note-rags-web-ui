"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, SaveIcon, TrashIcon } from "lucide-react";
import { SaveStatus } from "@/lib/types/save-status.types";

export interface NoteActionsDropdownProps {
  onNoteSave: () => void;
  onNoteDelete: () => void;
  saveStatus: SaveStatus;
  className?: string;
}

export function NoteActionsDropdown({
  onNoteSave,
  onNoteDelete,
  saveStatus,
  className = "",
}: NoteActionsDropdownProps) {
  const isSaveDisabled = saveStatus === "saved";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          <MoreHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={onNoteSave}
          disabled={isSaveDisabled}
        >
          <SaveIcon className="h-4 w-4 mr-2" />
          {isSaveDisabled ? "Save Note" : "Save Note (Ctrl+S)"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onNoteDelete}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Delete Note
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}