"use client";

import { Crepe } from "@milkdown/crepe";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";

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
  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: content || placeholder,
      features: {},
    });

    crepe.on((listener) => {
      listener.markdownUpdated((_, markdown) => {
        onContentChange(markdown);
      });
    });

    return crepe;
  });

  return <Milkdown />;
};

export const MilkdownEditor: React.FC<MilkdownEditorProps> = ({
  className = "h-full",
  ...props
}) => {
  return (
    <div className={`${className} overflow-y-auto`}>
      <div className="p-6 min-h-full">
        <MilkdownProvider>
          <CrepeEditor {...props} />
        </MilkdownProvider>
      </div>
    </div>
  );
};
