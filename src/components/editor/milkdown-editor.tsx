"use client";

import { cn } from "@/lib/utils";
import { Crepe } from "@milkdown/crepe";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { useTheme } from "next-themes";
import React from "react";

interface MilkdownEditorProps {
  content?: string;
  placeholder?: string;
  onContentChange?: (content: string) => void;
  className?: string;
}

const CrepeEditor: React.FC<Omit<MilkdownEditorProps, "className">> = ({
  content = "",
  placeholder = "Start writing...",
  onContentChange = () => {},
}) => {
  const { theme } = useTheme();

  useEditor(
    (root) => {
      const crepe = new Crepe({
        root,
        defaultValue: content || "",
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
          onContentChange(markdown);
        });
      });

      return crepe;
    },
    [content, placeholder, theme]
  );

  return <Milkdown />;
};

export const MilkdownEditor: React.FC<MilkdownEditorProps> = ({
  className = "h-full",
  ...props
}) => {
  return (
    <div
      className={cn([
        "crepe",
        className,
        "overflow-y-auto bg-note-editor-background",
      ])}
      data-testid="milkdown-editor"
    >
      <div className="p-6 min-h-full">
        <MilkdownProvider>
          <CrepeEditor {...props} />
        </MilkdownProvider>
      </div>
    </div>
  );
};
