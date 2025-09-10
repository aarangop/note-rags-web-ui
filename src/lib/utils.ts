import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays} days ago`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export function getContentPreview(content: string, maxLength: number = 120): string {
  if (!content) return '';
  
  // Remove HTML tags
  const withoutHtml = content.replace(/<[^>]*>/g, '');
  
  // Remove markdown formatting characters
  const withoutMarkdown = withoutHtml.replace(/[#*`_~\[\]]/g, '');
  
  // Clean up whitespace and newlines
  const cleaned = withoutMarkdown.replace(/\s+/g, ' ').trim();
  
  // Apply length limit
  if (cleaned.length <= maxLength) return cleaned;
  
  // Find last complete word within limit
  const truncated = cleaned.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  const finalText = lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) : truncated;
  
  return finalText + '...';
}
