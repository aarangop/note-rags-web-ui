"use client";

import { SaveStatus } from "@/lib/stores/notes";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface SaveIndicatorProps {
  status: SaveStatus;
  className?: string;
  idleTimeout?: number;
}

export function SaveIndicator({
  className,
  status,
  idleTimeout = 5000,
}: SaveIndicatorProps) {
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const localStatus = useRef(status);
  const getCircleStyles = () => {
    switch (status) {
      case "saving":
        return {
          className: "bg-purple-500 animate-pulse",
          title: "Saving...",
        };
      case "saved":
        return {
          className: "bg-green-500",
          title: "Saved",
        };
      case "error":
        return {
          className: "bg-red-500 animate-shake",
          title: "Error saving",
        };
      case "unsaved":
        return {
          className: "bg-yellow-500",
          title: "Unsaved changes",
        };
      case "idle":
        return {
          className: "bg-transparent",
          title: "Saved",
        };
      default:
        return null;
    }
  };

  useEffect(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    if (status !== "saved") return;

    idleTimeoutRef.current = setTimeout(() => {
      // Note: This assignment won't trigger a re-render and is likely a bug
      // Consider using state setter instead of direct assignment
      localStatus.current = "idle";
    }, idleTimeout);
  }, [status, idleTimeout]);

  const circleStyles = getCircleStyles();

  if (!circleStyles) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-2 h-2 rounded-full transition-all duration-200",
        circleStyles.className,
        className
      )}
      title={circleStyles.title}
    />
  );
}
