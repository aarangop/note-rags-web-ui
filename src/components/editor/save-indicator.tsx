"use client";

import { SaveStatus } from "@/lib/types/save-status.types";
import { cn } from "@/lib/utils";

interface SaveIndicatorProps {
  status: SaveStatus;
  error?: string;
  className?: string;
}

export function SaveIndicator({
  className,
  status,
  error,
}: SaveIndicatorProps) {
  const getIndicatorInfo = () => {
    if (status === "saving") {
      return {
        className: "bg-blue-500 animate-pulse",
        title: "Saving...",
        text: "Saving...",
      };
    }

    if (status === "error") {
      return {
        className: "bg-red-500",
        title: error || "Error saving",
        text: "Error",
      };
    }

    if (status === "unsaved") {
      return {
        className: "bg-yellow-500",
        title: "You have unsaved changes (Ctrl+S to save)",
        text: "Unsaved",
      };
    }

    if (status === "saved") {
      return {
        className: "bg-green-500",
        title: "All changes saved",
        text: "Saved",
      };
    }

    // Default to "idle" state (could be used for hiding indicator after delay)
    return {
      className: "bg-gray-400",
      title: "Ready",
      text: "Ready",
    };
  };

  const indicatorInfo = getIndicatorInfo();

  return (
    <div className={cn("flex items-center space-x-2 text-xs", className)}>
      <div
        className={cn(
          "w-2 h-2 rounded-full transition-all duration-200",
          indicatorInfo.className
        )}
        title={indicatorInfo.title}
      />
      <span className="text-muted-foreground" title={indicatorInfo.title}>
        {indicatorInfo.text}
      </span>
    </div>
  );
}
