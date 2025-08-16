'use client';

import { useRouter } from 'next/navigation';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { useNotesStore } from '@/lib/stores/notes';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AppLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export function AppLayout({ children, showSidebar = true }: AppLayoutProps) {
  const router = useRouter();
  const createNote = useNotesStore((state) => state.createNote);
  const { isLoading, isAuthenticated } = useAuth();

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote('Untitled Note', '');
      router.push(`/notes/${newNote.id}`);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onCreateNote={handleCreateNote} />
      <div className="flex">
        {showSidebar && isAuthenticated && <Sidebar />}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}