'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn, formatDate, getContentPreview } from '@/lib/utils';
import type { Note } from '@/lib/api/interfaces/notes-repository.interface';
import { FileTextIcon } from 'lucide-react';
import Link from 'next/link';

interface NoteCardProps {
  note: Note;
  className?: string;
}

export function NoteCard({ note, className }: NoteCardProps) {
  return (
    <Link href={`/notes/${note.id}`} className="block">
      <Card className={cn(
        'transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer',
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-foreground line-clamp-1 flex-1 mr-2">
              {note.title}
            </h3>
            <time className="text-sm text-gray-500 whitespace-nowrap">
              {formatDate(note.updated_at)}
            </time>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
            {getContentPreview(note.content)}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                <FileTextIcon className="w-3 h-3 mr-1" />
                Note
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}