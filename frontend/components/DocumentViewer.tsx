'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface DocumentViewerProps {
  url: string
  fileType?: string
  filename: string
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, fileType }) => {
  const [currentViewer, setCurrentViewer] = useState<'office' | 'google' | 'direct'>('office')
  const [viewerError, setViewerError] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const type = fileType?.toLowerCase()

  const getViewerUrl = (viewer: 'office' | 'google' | 'direct') => {
    switch (viewer) {
      case 'office':
        return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
      case 'google':
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
      case 'direct':
        return url
      default:
        return url
    }
  }

  const handleViewerLoad = () => {
    setIsLoading(false)
    setViewerError(false)
  }

  const handleViewerError = () => {
    setIsLoading(false)
    setViewerError(true)
    
    // Auto-fallback logic
    if (currentViewer === 'office') {
      console.log('Office viewer failed, trying Google Docs viewer...')
      setCurrentViewer('google')
      setIsLoading(true)
      setViewerError(false)
    } else if (currentViewer === 'google') {
      console.log('Google viewer failed, falling back to direct link...')
      setCurrentViewer('direct')
      setIsLoading(true)
      setViewerError(false)
    }
  }

  const renderViewer = () => {
    if (type === 'pdf' || type === 'txt') {
      // Direct viewing for PDF and TXT
      return (
        <iframe
          src={url}
          className="absolute inset-0 w-full h-full border-0"
          title="Document Preview"
          onLoad={handleViewerLoad}
          onError={handleViewerError}
        />
      )
    } else if (type === 'doc' || type === 'docx') {
      // Office documents with smart viewer selection
      return (
        <iframe
          key={`${currentViewer}-${url}`} // Force re-render when viewer changes
          src={getViewerUrl(currentViewer)}
          className="absolute inset-0 w-full h-full border-0"
          title="Document Preview"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          onLoad={handleViewerLoad}
          onError={handleViewerError}
        />
      )
    } else {
      // Fallback for other file types
      return (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          <div className="text-center p-8">
            <h3 className="text-lg font-medium text-github-fg-default dark:text-github-dark-fg-default mb-4">
              Preview not available for this file type
            </h3>
            <p className="text-github-fg-muted dark:text-github-dark-fg-muted mb-4">
              File type: {type || 'Unknown'}
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-github-primary"
            >
              Download File
            </a>
          </div>
        </div>
      )
    }
  }

  const renderControls = () => {
    if (type !== 'doc' && type !== 'docx') return null

    return (
      <div className="p-3 bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle border-t border-github-border-default dark:border-github-dark-border-default">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setCurrentViewer('office')
                setIsLoading(true)
                setViewerError(false)
              }}
              className={`px-3 py-1 text-xs rounded border ${                currentViewer === 'office'
                  ? 'bg-github-accent-emphasis text-github-fg-onEmphasis dark:text-github-fg-onEmphasis border-github-accent-emphasis'
                  : 'bg-github-btn-bg hover:bg-github-btn-hover-bg border-github-border-default dark:border-github-dark-border-default text-github-fg-default dark:text-github-dark-fg-default'
              }`}
            >
              Office Viewer
            </button>
            <button
              onClick={() => {
                setCurrentViewer('google')
                setIsLoading(true)
                setViewerError(false)
              }}
              className={`px-3 py-1 text-xs rounded border ${                currentViewer === 'google'
                  ? 'bg-github-accent-emphasis text-github-fg-onEmphasis dark:text-github-fg-onEmphasis border-github-accent-emphasis'
                  : 'bg-github-btn-bg hover:bg-github-btn-hover-bg border-github-border-default dark:border-github-dark-border-default text-github-fg-default dark:text-github-dark-fg-default'
              }`}
            >
              Google Viewer
            </button>
          </div>
          
          <div className="flex gap-2">
            {viewerError && (
              <span className="text-xs text-github-danger-fg dark:text-github-dark-danger-fg">
                Viewer failed to load
              </span>
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-xs bg-github-success-emphasis hover:bg-github-success-emphasis text-github-fg-onEmphasis dark:text-github-fg-onEmphasis rounded"
            >
              Open in New Tab
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full" style={{ height: '80vh' }}>
      <div className="absolute inset-0 w-full h-full flex flex-col">
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-github-canvas-subtle dark:bg-github-dark-canvas-default bg-opacity-75 z-10">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-github-accent-emphasis border-t-transparent rounded-full"
              />
            </div>
          )}
          
          {viewerError && currentViewer === 'direct' && (
            <div className="absolute inset-0 flex items-center justify-center bg-github-canvas-subtle dark:bg-github-dark-canvas-default">
              <div className="text-center p-8">
                <h3 className="text-lg font-medium text-github-fg-default dark:text-github-dark-fg-default mb-4">
                  Unable to preview this document
                </h3>
                <p className="text-github-fg-muted dark:text-github-dark-fg-muted mb-4">
                  The document viewer is not compatible with this file.
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-github-primary"
                >
                  Download and Open Locally
                </a>
              </div>
            </div>
          )}
          
          {!viewerError && renderViewer()}
        </div>
        
        {renderControls()}
      </div>
    </div>
  )
}

export default DocumentViewer
