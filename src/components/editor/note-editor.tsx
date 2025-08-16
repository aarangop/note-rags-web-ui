'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { MilkdownEditor } from './milkdown-editor';
import { NoteHeader } from './note-header';
import type { SaveStatus } from '@/lib/types/notes';

interface NoteEditorProps {
  title: string;
  content: string;
  debounceTimeout?: number;
  onTitleChange?: (newTitle: string) => void;
  onContentChange?: (newContent: string) => void;
  onDebouncedContentChange?: (newContent: string) => void;
  onDelete?: () => void;
  status?: SaveStatus;
  placeholder?: string;
  className?: string;
}

export function NoteEditor({
  title,
  content,
  debounceTimeout = 1000,
  onTitleChange = () => {},
  onContentChange = () => {},
  onDebouncedContentChange = () => {},
  onDelete,
  status = 'idle',
  placeholder = 'Start writing your wonderful notes...',
  className = '',
}: NoteEditorProps) {
  const [localContent, setLocalContent] = useState(content);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update local content when prop changes
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      onDebouncedContentChange(localContent);
    }, debounceTimeout);
  }, [localContent, debounceTimeout, onDebouncedContentChange]);

  const handleContentChange = useCallback((newContent: string) => {
    setLocalContent(newContent);
    onContentChange(newContent);
  }, [onContentChange]);

  // Trigger auto-save when content changes
  useEffect(() => {
    if (localContent !== content) {
      debouncedSave();
    }
  }, [localContent, content, debouncedSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`flex h-full flex-col bg-white ${className}`}>
      {/* Note Header */}
      <NoteHeader
        title={title}
        onTitleChange={onTitleChange}
        status={status}
        onDelete={onDelete}
      />

      {/* Main Editor Area */}
      <div className="flex-1 overflow-hidden">
        <MilkdownEditor
          content={localContent}
          placeholder={placeholder}
          onContentChange={handleContentChange}
          className="h-full"
        />
      </div>
    </div>
  );
}