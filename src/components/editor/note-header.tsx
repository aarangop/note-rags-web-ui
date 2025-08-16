'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SaveIndicator } from './save-indicator';
import type { SaveStatus } from '@/lib/types/notes';
import { MoreHorizontalIcon, TrashIcon } from 'lucide-react';

interface NoteHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  status: SaveStatus;
  onDelete?: () => void;
  className?: string;
}

export function NoteHeader({
  title,
  onTitleChange,
  status,
  onDelete,
  className = '',
}: NoteHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableTitle, setEditableTitle] = useState(title);

  useEffect(() => {
    setEditableTitle(title);
  }, [title]);

  const handleTitleSubmit = () => {
    setIsEditing(false);
    if (editableTitle.trim() !== title) {
      onTitleChange(editableTitle.trim() || 'Untitled Note');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditableTitle(title);
      setIsEditing(false);
    }
  };

  return (
    <header className={`border-b border-gray-200 bg-white px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              className="text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0"
              autoFocus
            />
          ) : (
            <h1
              className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-gray-700 truncate"
              onClick={() => setIsEditing(true)}
              title="Click to edit title"
            >
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center space-x-4 ml-4">
          <SaveIndicator status={status} />
          
          {onDelete && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
              
              <Button variant="ghost" size="sm">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}