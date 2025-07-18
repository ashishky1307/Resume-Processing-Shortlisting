'use client'

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import ResumeProcessor from '@/components/ResumeProcessor';
import ChatBot from '@/components/ChatBot';

const DashboardPage: React.FC = () => {
  return (
    <ProtectedRoute>      <div className="space-y-6">
        <div className="bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle rounded-lg shadow-sm border border-github-border-default dark:border-github-dark-border-default p-6">
          <h2 className="text-xl font-semibold text-github-fg-default dark:text-github-dark-fg-default mb-4">
            Candidate Management Dashboard
          </h2>
          <p className="text-github-fg-muted dark:text-github-dark-fg-muted mb-6">
            Upload resumes, manage candidates, and shortlist applicants for your job openings.
          </p>
        </div>
        
        <ResumeProcessor />
        
        {/* AI Chat Assistant */}
        <ChatBot />
      </div>
    </ProtectedRoute>
  );
};

export default DashboardPage;
