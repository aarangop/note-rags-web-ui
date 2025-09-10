"use client";

import { Crepe } from "@milkdown/crepe";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import React, { useCallback, useRef, useEffect } from "react";

interface MilkdownEditorProps {
  initialContent?: string;
  placeholder?: string;
  onContentChange?: (content: string) => void;
}

const CrepeEditor = React.memo(function CrepeEditor({
  initialContent = "",
  placeholder = "Start writing...",
  onContentChange = () => {},
}: MilkdownEditorProps) {
  const initializedRef = useRef(false);
  const lastContentRef = useRef(initialContent);

  const editor = useEditor(
    (root) => {
      const crepe = new Crepe({
        root,
        defaultValue: initialContent || "",
        features: {
          [Crepe.Feature.Placeholder]: true,
        },
        featureConfigs: {
          [Crepe.Feature.Placeholder]: {
            text: placeholder,
          },
        },
      });

      crepe.on((listener) => {
        listener.markdownUpdated((_, markdown) => {
          lastContentRef.current = markdown;
          onContentChange(markdown);
        });
      });

      initializedRef.current = true;
      return crepe;
    },
    [placeholder] // Remove initialContent from dependencies to prevent re-initialization
  );

  // Update content programmatically when initialContent changes (but editor is already initialized)
  useEffect(() => {
    if (
      initializedRef.current &&
      editor &&
      initialContent !== lastContentRef.current
    ) {
      // For now, we'll let the content be managed by the store
      // This prevents re-initialization while keeping the editor stable
      lastContentRef.current = initialContent;
    }
  }, [initialContent, editor]);

  return <Milkdown />;
});

export const MilkdownEditor = React.memo(function MilkdownEditor({ 
  ...props 
}: MilkdownEditorProps) {
  return (
    <div
      className="overflow-y-auto bg-note-editor-background h-full"
      data-testid="milkdown-editor"
    >
      <div className="p-6 min-h-full">
        <MilkdownProvider>
          <CrepeEditor {...props} />
        </MilkdownProvider>
      </div>
    </div>
  );
});
