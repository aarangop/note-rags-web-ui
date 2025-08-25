"use client";

import { useNoteContext } from "@/lib/contexts/note-context";
import { MilkdownEditor } from "./milkdown-editor";
import { NoteHeader } from "./note-header";

interface NoteEditorProps {
  className?: string;
}

export function NoteEditor({ className = "" }: NoteEditorProps) {
  const { note, updateContent, placeholder, isLoading, error } =
    useNoteContext();

  if (isLoading) {
    return (
      <div
        className={`flex h-full items-center justify-center bg-gray-50 ${className}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading note...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex h-full items-center justify-center bg-gray-50 ${className}`}
      >
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : "Failed to load note"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div
        className={`flex h-full items-center justify-center bg-gray-50 ${className}`}
      >
        <div className="text-center">
          <p className="text-gray-600">Note not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col bg-gray-50 ${className}`}>
      {/* Note Header */}
      <NoteHeader />

      {/* Main Editor Area with Paper Design */}
      <div className="flex-1 px-6 py-2 overflow-hidden">
        <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <MilkdownEditor
            content={note.content}
            placeholder={placeholder}
            onContentChange={updateContent}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
