'use client'

import React, { useState } from 'react';
import { useAuth } from '../src/lib/auth-context';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <div className="flex items-center space-x-3">
          <img
            className="h-8 w-8 rounded-full object-cover"
            src={user.profilePicture || '/placeholder-avatar.png'}
            alt={user.name}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`;
            }}
          />          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-github-fg-onEmphasis">{user.name}</p>
            <p className="text-xs text-github-fg-muted">{user.email}</p>
          </div>
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isMenuOpen && (        <div className="absolute right-0 mt-2 w-48 bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle rounded-md shadow-lg py-1 z-50 border border-github-border-default dark:border-github-dark-border-default">
          <div className="px-4 py-2 border-b border-github-border-muted">
            <p className="text-sm font-medium text-github-fg-onEmphasis">{user.name}</p>
            <p className="text-xs text-github-fg-muted">{user.email}</p>
          </div>
          
          <button
            onClick={() => setIsMenuOpen(false)}
            className="block w-full text-left px-4 py-2 text-sm text-github-fg-onEmphasis hover:bg-github-neutral-muted"
          >
            Profile Settings
          </button>
          
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-github-fg-onEmphasis hover:bg-github-neutral-muted"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
