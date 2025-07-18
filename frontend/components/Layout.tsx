'use client'

import { Toaster } from 'react-hot-toast'
import UserProfile from './UserProfile'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-github-canvas-subtle dark:bg-github-dark-canvas-default">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8 border-b border-github-border-default dark:border-github-dark-border-default pb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-github-fg-default dark:text-github-dark-fg-default text-center">
                Resume Processing System
              </h1>
              <p className="text-github-fg-muted dark:text-github-dark-fg-muted text-center mt-2">
                Upload and process resumes with AI-powered parsing and candidate management
              </p>
            </div>
            <div className="ml-4">
              <UserProfile />
            </div>
          </div>
        </header>
        {children}
      </div>
      <Toaster 
        toastOptions={{
          style: {
            background: 'var(--github-canvas-default)',
            color: 'var(--github-fg-default)',
            border: '1px solid var(--github-border-default)',
          },
          success: {
            iconTheme: {
              primary: 'var(--github-success-emphasis)',
              secondary: 'var(--github-canvas-default)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--github-danger-emphasis)',
              secondary: 'var(--github-canvas-default)',
            },
          },
        }}
      />
    </div>
  )
}
