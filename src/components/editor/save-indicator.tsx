'use client';

import { cn } from '@/lib/utils';
import type { SaveStatus } from '@/lib/types/notes';
import { CheckIcon, CloudIcon, AlertCircleIcon } from 'lucide-react';

interface SaveIndicatorProps {
  status: SaveStatus;
  className?: string;
}

export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  const getIndicatorContent = () => {
    switch (status) {
      case 'saving':
        return {
          icon: <CloudIcon className="h-4 w-4 animate-pulse" />,
          text: 'Saving...',
          className: 'text-blue-600',
        };
      case 'saved':
        return {
          icon: <CheckIcon className="h-4 w-4" />,
          text: 'Saved',
          className: 'text-green-600',
        };
      case 'error':
        return {
          icon: <AlertCircleIcon className="h-4 w-4" />,
          text: 'Error saving',
          className: 'text-red-600',
        };
      default:
        return null;
    }
  };

  const indicatorContent = getIndicatorContent();

  if (!indicatorContent) {
    return null;
  }

  return (
    <div className={cn(
      'flex items-center space-x-2 text-sm font-medium',
      indicatorContent.className,
      className
    )}>
      {indicatorContent.icon}
      <span>{indicatorContent.text}</span>
    </div>
  );
}