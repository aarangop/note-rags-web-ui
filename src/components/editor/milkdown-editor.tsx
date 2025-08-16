'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/nord.css';

interface MilkdownEditorProps {
  content: string;
  placeholder?: string;
  onContentChange: (newContent: string) => void;
  className?: string;
}

export function MilkdownEditor({
  content,
  placeholder = 'Start writing...',
  onContentChange,
  className = '',
}: MilkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeEditorRef = useRef<Crepe | null>(null);

  const handleContentChange = useCallback((newContent: string) => {
    onContentChange(newContent);
  }, [onContentChange]);

  useEffect(() => {
    if (!editorRef.current) return;

    const initEditor = async () => {
      try {
        // Create Crepe editor
        const crepeEditor = new Crepe({
          root: editorRef.current!,
          defaultValue: content,
          features: {
            [Crepe.Feature.Toolbar]: true,
            [Crepe.Feature.Placeholder]: true,
          },
          featureConfigs: {
            [Crepe.Feature.Placeholder]: {
              text: placeholder,
            },
          },
        });

        // Create the editor
        await crepeEditor.create();

        // Store reference
        crepeEditorRef.current = crepeEditor;

        // Set up event listeners
        crepeEditor.on((listener) => {
          listener.updated(() => {
            const markdown = crepeEditor.getMarkdown();
            handleContentChange(markdown);
          });
        });
      } catch (error) {
        console.error('Failed to initialize Milkdown editor:', error);
      }
    };

    initEditor();

    // Cleanup function
    return () => {
      if (crepeEditorRef.current) {
        crepeEditorRef.current.destroy();
        crepeEditorRef.current = null;
      }
    };
  }, [placeholder, handleContentChange]); // Don't include content in deps to avoid re-initialization

  // Update content when prop changes (but only if editor exists and content is different)
  useEffect(() => {
    if (crepeEditorRef.current && content !== crepeEditorRef.current.getMarkdown()) {
      // For now, we'll recreate the editor with new content
      // This is a simpler approach until we can implement proper content updates
      const editorElement = editorRef.current;
      if (editorElement) {
        crepeEditorRef.current.destroy();
        
        const initEditorWithNewContent = async () => {
          const crepeEditor = new Crepe({
            root: editorElement,
            defaultValue: content,
            features: {
              [Crepe.Feature.Toolbar]: true,
              [Crepe.Feature.Placeholder]: true,
            },
            featureConfigs: {
              [Crepe.Feature.Placeholder]: {
                text: placeholder,
              },
            },
          });

          await crepeEditor.create();
          crepeEditorRef.current = crepeEditor;

          crepeEditor.on((listener) => {
            listener.updated(() => {
              const markdown = crepeEditor.getMarkdown();
              handleContentChange(markdown);
            });
          });
        };

        initEditorWithNewContent();
      }
    }
  }, [content, placeholder, handleContentChange]);

  return (
    <div className={`milkdown-editor ${className}`}>
      <div ref={editorRef} className="h-full w-full" />
      <style jsx>{`
        .milkdown-editor :global(.crepe) {
          height: 100%;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .milkdown-editor :global(.crepe .editor) {
          height: 100%;
          padding: 1rem;
        }
        
        .milkdown-editor :global(.crepe .milkdown) {
          height: 100%;
        }
      `}</style>
    </div>
  );
}