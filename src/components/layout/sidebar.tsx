'use client';

import { cn } from '@/lib/utils';
import { FileTextIcon, FolderIcon, SearchIcon, SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'All Notes', href: '/notes', icon: FileTextIcon },
  { name: 'Search', href: '/notes/search', icon: SearchIcon },
  { name: 'Folders', href: '/notes/folders', icon: FolderIcon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className={cn('w-64 border-r bg-gray-50/50 p-4', className)}>
      <div className="space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}