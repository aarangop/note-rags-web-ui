'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NoteEditor } from '@/components/editor/note-editor';
import { useNotesStore } from '@/lib/stores/notes';
import { Button } from '@/components/ui/button';

interface NotePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function NotePage({ params }: NotePageProps) {
  const router = useRouter();
  const {
    currentNote,
    isLoading,
    error,
    saveStatus,
    loadNote,
    updateNote,
    deleteNote,
    clearError,
  } = useNotesStore();

  useEffect(() => {
    params.then(({ id }) => {
      const noteId = parseInt(id);
      if (!isNaN(noteId)) {
        loadNote(noteId);
      }
    });
  }, [params, loadNote]);

  const handleTitleChange = async (newTitle: string) => {
    if (currentNote) {
      await updateNote(currentNote.id, { title: newTitle });
    }
  };

  const handleContentChange = async (newContent: string) => {
    if (currentNote) {
      await updateNote(currentNote.id, { content: newContent });
    }
  };

  const handleDelete = async () => {
    if (currentNote && confirm('Are you sure you want to delete this note?')) {
      await deleteNote(currentNote.id);
      router.push('/notes');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading note...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={clearError}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!currentNote) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Note not found</p>
          <Button onClick={() => router.push('/notes')}>
            Back to Notes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <NoteEditor
        title={currentNote.title}
        content={currentNote.content}
        onTitleChange={handleTitleChange}
        onDebouncedContentChange={handleContentChange}
        onDelete={handleDelete}
        status={saveStatus}
        className="h-full"
      />
    </div>
  );
}