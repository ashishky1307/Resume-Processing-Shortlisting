'use client'

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../src/lib/auth-context';
import { useRouter } from 'next/navigation';

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();
  
  // Typing animation state
  const [typedText, setTypedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  
  const phrases = React.useMemo(
    () => [
      "Find the perfect candidates with AI...",
      "Analyze resumes intelligently...",
      "Chat with your recruitment assistant...",
      "Transform your hiring process..."
    ],
    []
  );
  
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  
  // Typing animation effect
  useEffect(() => {
    if (!isTyping) return;
    
    const currentPhrase = phrases[currentPhraseIndex];
    
    if (currentIndex < currentPhrase.length) {
      const timer = setTimeout(() => {
        setTypedText(prev => prev + currentPhrase[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Pause before starting to delete
      const timer = setTimeout(() => {
        setIsTyping(false);
        // Start deleting after a pause
        setTimeout(() => {
          setTypedText('');
          setCurrentIndex(0);
          setCurrentPhraseIndex(prev => (prev + 1) % phrases.length);
          setIsTyping(true);
        }, 1500);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentPhraseIndex, isTyping, phrases]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-github-canvas-default dark:bg-github-dark-canvas-default">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 border-4 border-github-border-muted dark:border-github-dark-border-muted border-t-github-accent-emphasis dark:border-t-github-dark-accent-emphasis rounded-full animate-spin"></div>
          <p className="mt-4 text-github-fg-muted dark:text-github-dark-fg-muted">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }  return (
    <div className="min-h-screen bg-github-canvas-default dark:bg-github-dark-canvas-default">
      {/* GitHub-style header */}
      <div className="border-b border-github-border-default dark:border-github-dark-border-default bg-github-canvas-default dark:bg-github-dark-canvas-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-github-accent-emphasis to-github-success-emphasis dark:from-github-dark-accent-emphasis dark:to-github-dark-success-emphasis rounded-lg flex items-center justify-center shadow-md">
                <svg className="h-6 w-6 text-github-fg-onEmphasis" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <span className="text-2xl font-bold text-github-fg-default dark:text-github-dark-fg-default">
                  Sen AI
                </span>
                <p className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted -mt-1">
                  Intelligent Recruitment Platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main landscape content */}
      <div className="flex min-h-screen" style={{ minHeight: 'calc(100vh - 73px)' }}>
        {/* Left side - Branding and typing animation */}
        <div className="flex-1 bg-gradient-to-br from-github-accent-emphasis/5 via-github-success-emphasis/5 to-github-attention-emphasis/5 dark:from-github-dark-accent-emphasis/10 dark:via-github-dark-success-emphasis/10 dark:to-github-dark-attention-emphasis/10 flex flex-col justify-center px-8 lg:px-16 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-32 h-32 bg-github-accent-emphasis rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-github-success-emphasis rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-github-attention-emphasis rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative z-10 max-w-2xl">
            {/* Main heading */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 bg-gradient-to-br from-github-accent-emphasis to-github-success-emphasis dark:from-github-dark-accent-emphasis dark:to-github-dark-success-emphasis rounded-2xl flex items-center justify-center shadow-xl mr-4">
                  <svg className="h-8 w-8 text-github-fg-onEmphasis" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-5xl lg:text-6xl font-bold text-github-fg-default dark:text-github-dark-fg-default leading-tight">
                    Sen AI
                  </h1>
                  <p className="text-xl text-github-accent-fg dark:text-github-dark-accent-fg font-medium">
                    Intelligent Recruitment Platform
                  </p>
                </div>
              </div>
              
              {/* Typing animation */}
              <div className="mb-8">
                <p className="text-2xl lg:text-3xl font-semibold text-github-fg-default dark:text-github-dark-fg-default mb-4">
                  {typedText}
                  <span className="animate-pulse">|</span>
                </p>
                <p className="text-lg text-github-fg-muted dark:text-github-dark-fg-muted leading-relaxed max-w-xl">
                  Revolutionary AI-powered recruitment platform that transforms how you discover, evaluate, and hire top talent through intelligent resume processing and conversational candidate matching.
                </p>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center space-x-3 p-4 bg-github-success-subtle/50 dark:bg-github-dark-success-subtle/50 rounded-lg backdrop-blur-sm">
                <div className="h-10 w-10 bg-github-success-emphasis/20 dark:bg-github-dark-success-emphasis/20 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-github-success-fg dark:text-github-dark-success-fg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-github-fg-default dark:text-github-dark-fg-default">AI Resume Analysis</p>
                  <p className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted">Smart extraction & matching</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-github-accent-subtle/50 dark:bg-github-dark-accent-subtle/50 rounded-lg backdrop-blur-sm">
                <div className="h-10 w-10 bg-github-accent-emphasis/20 dark:bg-github-dark-accent-emphasis/20 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-github-accent-fg dark:text-github-dark-accent-fg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-github-fg-default dark:text-github-dark-fg-default">AI Assistant</p>
                  <p className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted">Conversational candidate search</p>
                </div>
              </div>
            </div>

            {/* Tech stack badges */}
            <div className="flex flex-wrap gap-2">
              {['Next.js', 'Python', 'Groq AI', 'MySQL', 'AWS S3', 'Tailwind'].map((tech) => (
                <span key={tech} className="px-3 py-1 bg-github-neutral-subtle dark:bg-github-dark-neutral-subtle border border-github-border-muted dark:border-github-dark-border-muted rounded-full text-sm font-medium text-github-fg-muted dark:text-github-dark-fg-muted">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex-1 max-w-md bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle border-l border-github-border-default dark:border-github-dark-border-default flex flex-col justify-center px-8 lg:px-12">
          <div className="w-full max-w-sm mx-auto">
            {/* Login header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-github-fg-default dark:text-github-dark-fg-default mb-2">
                Welcome Back
              </h2>
              <p className="text-github-fg-muted dark:text-github-dark-fg-muted">
                Sign in to access your recruitment dashboard
              </p>
            </div>

            {/* Login form */}
            <div className="space-y-6">
              <button
                onClick={login}
                className="w-full flex justify-center items-center px-6 py-4 bg-github-btn-primary-bg dark:bg-github-dark-btn-primary-bg hover:bg-github-btn-primary-hoverBg dark:hover:bg-github-dark-btn-primary-hoverBg text-github-btn-primary-text dark:text-github-dark-btn-primary-text font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-github-accent-emphasis dark:focus:ring-github-dark-accent-emphasis focus:ring-offset-2 focus:ring-offset-github-canvas-subtle dark:focus:ring-offset-github-dark-canvas-subtle transform hover:scale-105"
              >
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              
              {/* Features preview */}
              <div className="mt-8 p-6 bg-github-canvas-default dark:bg-github-dark-canvas-default border border-github-border-default dark:border-github-dark-border-default rounded-lg">                <h4 className="font-semibold text-github-fg-default dark:text-github-dark-fg-default mb-4 text-center">
                  What you&apos;ll get access to:
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-github-success-emphasis dark:bg-github-dark-success-emphasis rounded-full"></div>
                    <span className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted">Upload and analyze resumes instantly</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-github-accent-emphasis dark:bg-github-dark-accent-emphasis rounded-full"></div>
                    <span className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted">Chat with AI to find perfect candidates</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-github-attention-emphasis dark:bg-github-dark-attention-emphasis rounded-full"></div>
                    <span className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted">Smart matching and recommendations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-github-done-emphasis dark:bg-github-dark-done-emphasis rounded-full"></div>
                    <span className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted">Streamlined recruitment pipeline</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-github-fg-muted dark:text-github-dark-fg-muted">
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-github-accent-fg dark:text-github-dark-accent-fg hover:underline">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="#" className="text-github-accent-fg dark:text-github-dark-accent-fg hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
