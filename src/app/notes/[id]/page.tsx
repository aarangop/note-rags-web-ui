"use client";

import { NoteEditor } from "@/components/editor/note-editor";
import NoteProvider from "@/components/providers/note-provider";
import { useRouter } from "next/navigation";
import { use } from "react";

interface NotePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function NotePage({ params }: NotePageProps) {
  const router = useRouter();
  const { id } = use(params);
  const noteId = parseInt(id);

  const handleDelete = () => {
    router.push("/notes");
  };

  return (
    <div className="h-[calc(100vh-6rem)] max-w-4xl mx-auto px-4 flex flex-col">
      <div className="flex-1 pt-4 min-h-0">
        <NoteProvider
          noteId={noteId}
          placeholder="Start writing..."
          onDelete={handleDelete}
        >
          <NoteEditor />
        </NoteProvider>
      </div>
    </div>
  );
}
