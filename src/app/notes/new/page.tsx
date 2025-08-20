'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateNoteWithDefaults } from '@/lib/hooks/use-notes';

export default function NewNotePage() {
  const router = useRouter();
  const createNoteMutation = useCreateNoteWithDefaults();

  useEffect(() => {
    const createNewNote = async () => {
      try {
        const newNote = await createNoteMutation.mutateAsync({
          title: 'Untitled Note',
          content: ''
        });
        router.replace(`/notes/${newNote.id}`);
      } catch (error) {
        console.error('Failed to create note:', error);
        router.push('/notes');
      }
    };

    createNewNote();
  }, [createNoteMutation, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Creating new note...</p>
      </div>
    </div>
  );
}