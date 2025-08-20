"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { LogOut, PlusIcon, User } from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import Link from "next/link";

interface HeaderProps {
  onCreateNote?: () => void;
}

export function Header({ onCreateNote }: HeaderProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <header className="border-b bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href="/notes" className="text-xl font-bold text-gray-900">
            Note-Rags
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateNote}
              className="flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">New Note</span>
            </Button>
          )}

          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
          ) : isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700 hidden sm:inline">
                  {user?.name || user?.email}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => signIn("cognito")}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
