"use client";

import { NoteCard } from "@/components/notes/note-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreateNoteWithDefaults, useNotes } from "@/lib/hooks/use-notes";
import { useNotesUIStore } from "@/lib/stores/notes-store";
import {
  CalendarIcon,
  FileTextIcon,
  FunnelIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function NotesPage() {
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useNotesUIStore();

  // Use React Query for server data
  const { data: notesData, isLoading, error } = useNotes(1, 100); // Load more notes for client-side filtering
  const createNoteMutation = useCreateNoteWithDefaults();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const notes = useMemo(() => notesData?.items || [], [notesData?.items]);

  // Filter notes based on search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  // Paginate filtered notes
  const paginatedNotes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNotes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNotes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: notes.length,
      thisWeek: notes.filter(
        (note) => note.created_at && new Date(note.created_at) > oneWeekAgo
      ).length,
      thisMonth: notes.filter(
        (note) => note.created_at && new Date(note.created_at) > oneMonthAgo
      ).length,
      lastUpdated: notes.length > 0 ? notes[0].updated_at : undefined,
    };
  }, [notes]);

  const handleCreateNote = async () => {
    try {
      const newNote = await createNoteMutation.mutateAsync({
        title: "Untitled Note",
        content: "",
      });
      router.push(`/notes/${newNote.id}`);
    } catch (error) {
      console.error("Failed to create note:", error);
      alert(
        "Failed to create new note. Please make sure the API server is running on localhost:8003"
      );
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : "Failed to load notes"}
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Note-Rags</h1>
            <p className="mt-2 text-gray-600">
              Manage and explore your knowledge base
            </p>
          </div>
          <Button
            onClick={handleCreateNote}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Note</span>
          </Button>
        </div>
      </div>

      {isLoading && notes.length === 0 ? (
        // Loading State
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your notes...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <FileTextIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Notes
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <CalendarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      This Week
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.thisWeek}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <CalendarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      This Month
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.thisMonth}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                    <FileTextIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Last Updated
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {stats.lastUpdated
                        ? new Date(stats.lastUpdated).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Filter</span>
              </Button>
              <span className="text-sm text-gray-600">
                Showing {paginatedNotes.length} of {filteredNotes.length} notes
              </span>
            </div>
          </div>

          {/* Notes Grid */}
          {filteredNotes.length === 0 ? (
            <div className="py-12 text-center">
              <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No notes found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery
                  ? "Try adjusting your search query."
                  : "Get started by creating your first note."}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateNote} className="mt-4">
                  <PlusIcon className="mr-2 h-5 w-5" />
                  Create your first note
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center">
              <nav className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    if (
                      page === currentPage ||
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}
