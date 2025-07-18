'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  FolderIcon, 
  DocumentIcon, 
  XMarkIcon, 
  StarIcon,
  BriefcaseIcon,
  ChartBarIcon,
  TrophyIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resumeApi, type ShortlistingResult } from '@/src/lib/api'

interface FileWithPreview extends File {
  preview?: string
}

const MotionDiv = motion.div

export default function CandidateShortlisting() {
  const [jobDescription, setJobDescription] = useState('')
  const [file, setFile] = useState<FileWithPreview | null>(null)
  const [minScore, setMinScore] = useState(70)
  const [limit, setLimit] = useState<number | undefined>(10)
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text')
  const [result, setResult] = useState<ShortlistingResult | null>(null)
  const [showAllCandidates, setShowAllCandidates] = useState(false)
  const [resumeModal, setResumeModal] = useState<{
    isOpen: boolean
    url: string
    filename: string
    fileType?: string
  }>({
    isOpen: false,
    url: '',
    filename: '',
    fileType: undefined,
  })

  const queryClient = useQueryClient()  // Fetch all candidates for unified view
  const { data: candidatesResponse, isLoading: candidatesLoading } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => resumeApi.getCandidates({ page: 1, limit: 1000 }),
    enabled: showAllCandidates
  })

  const allCandidates = candidatesResponse?.candidates || []

  // Status update mutation
  const updateStatus = useMutation({
    mutationFn: ({ candidateId, status }: { candidateId: number, status: string }) => 
      resumeApi.updateCandidateStatus(candidateId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate status updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update candidate status')
    }
  })
  
  // View resume handler
  const handleViewResume = async (candidateId: number) => {
    try {
      const data = await resumeApi.viewResume(candidateId)
      setResumeModal({
        isOpen: true,
        url: data.resume_url,
        filename: data.filename,
        fileType: data.file_type
      })
    } catch (error) {
      console.error('Error viewing resume:', error)
      toast.error('Failed to load resume')
    }
  }

  const shortlistByText = useMutation({
    mutationFn: async () => {
      if (!jobDescription.trim()) {
        throw new Error('Please enter a job description')
      }
      return resumeApi.shortlistByDescription(jobDescription, minScore, limit)
    },
    onSuccess: (data) => {
      setResult(data)
      toast.success(`Found ${data.shortlisted_candidates.length} matching candidates!`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to shortlist candidates')
    }
  })

  const shortlistByFile = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error('Please upload a job description file')
      }
      return resumeApi.shortlistByFile(file, minScore, limit)
    },
    onSuccess: (data) => {
      setResult(data)
      toast.success(`Found ${data.shortlisted_candidates.length} matching candidates!`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to shortlist candidates')
    }
  })

  const onDrop = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size should not exceed 10MB')
      return
    }
    setFile(selectedFile)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  })

  const handleShortlist = () => {
    if (inputMethod === 'text') {
      shortlistByText.mutate()
    } else {
      shortlistByFile.mutate()
    }
  }

  const clearAll = () => {
    setJobDescription('')
    setFile(null)
    setResult(null)
  }
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-github-success-fg dark:text-github-dark-success-fg bg-github-success-subtle dark:bg-github-dark-success-subtle'
    if (score >= 80) return 'text-github-accent-fg dark:text-github-dark-accent-fg bg-github-accent-subtle dark:bg-github-dark-accent-subtle'
    if (score >= 70) return 'text-github-attention-fg dark:text-github-dark-attention-fg bg-github-attention-subtle dark:bg-github-dark-attention-subtle'
    return 'text-github-danger-fg dark:text-github-dark-danger-fg bg-github-danger-subtle dark:bg-github-dark-danger-subtle'
  }
  
  const getScoreIcon = (score: number) => {
    if (score >= 90) return <TrophyIcon className="w-5 h-5" />
    if (score >= 80) return <StarIcon className="w-5 h-5" />
    return <ChartBarIcon className="w-5 h-5" />
  }

  // Function to render content based on file type
  const renderPreviewContent = () => {
    const type = resumeModal.fileType?.toLowerCase()
    
    if (type === 'pdf' || type === 'txt') {
      // PDFs and text files can be displayed in iframe
      return (
        <div className="relative w-full" style={{ height: '80vh' }}>
          <iframe
            src={resumeModal.url}
            className="absolute inset-0 w-full h-full"
            title="Resume Preview"
          />
        </div>
      )
    } else if (type === 'doc' || type === 'docx') {
      // DOC/DOCX files with multiple viewer options
      return (
        <div className="relative w-full" style={{ height: '80vh' }}>
          <div className="absolute inset-0 w-full h-full flex flex-col">
            {/* Primary: Microsoft Office Online Viewer */}
            <div className="flex-1 relative">
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resumeModal.url)}`}
                className="absolute inset-0 w-full h-full border-0"
                title="Resume Preview - Office Online"
                sandbox="allow-scripts allow-same-origin allow-popups"
                onError={(e) => {
                  console.warn('Office Online Viewer failed, trying alternative...')
                  // Fallback to Google Docs Viewer
                  const iframe = e.target as HTMLIFrameElement
                  iframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(resumeModal.url)}&embedded=true`
                }}
              />
            </div>
            
            {/* Alternative viewer buttons */}
            <div className="p-2 bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle border-t border-github-border-default dark:border-github-dark-border-default">
              <div className="flex flex-wrap gap-2 text-xs">                <button
                  onClick={() => {
                    const iframe = document.querySelector('iframe[title="Resume Preview - Office Online"]') as HTMLIFrameElement
                    if (iframe) {
                      iframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(resumeModal.url)}&embedded=true`
                    }
                  }}
                  className="px-2 py-1 bg-github-btn-bg hover:bg-github-btn-hover-bg border border-github-border-default dark:border-github-dark-border-default rounded text-github-fg-default dark:text-github-dark-fg-default"
                >
                  Try Google Viewer
                </button>
                <button
                  onClick={() => {
                    const iframe = document.querySelector('iframe[title="Resume Preview - Office Online"]') as HTMLIFrameElement
                    if (iframe) {
                      iframe.src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resumeModal.url)}`
                    }
                  }}
                  className="px-2 py-1 bg-github-btn-bg hover:bg-github-btn-hover-bg border border-github-border-default dark:border-github-dark-border-default rounded text-github-fg-default dark:text-github-dark-fg-default"
                >
                  Try Office Viewer
                </button>
                <a
                  href={resumeModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-github-accent-emphasis hover:bg-github-accent-emphasis text-github-fg-onEmphasis dark:text-github-fg-onEmphasis rounded"
                >
                  Open Direct Link
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      // Fallback for other file types
      return (
        <div className="relative w-full flex items-center justify-center" style={{ height: '80vh' }}>
          <div className="text-center p-8">            <h3 className="text-lg font-medium text-github-fg-default dark:text-github-dark-fg-default mb-4">
              Preview not available for this file type
            </h3>
            <p className="text-github-fg-muted dark:text-github-dark-fg-muted mb-4">
              File type: {type || 'Unknown'}
            </p>
            <p className="text-github-fg-muted dark:text-github-dark-fg-muted">
              Please use the &quot;Open in New Tab&quot; button below to view the file.
            </p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="space-y-8">
      {/* Improved Main Navigation Tabs */}
      <div className="github-card p-0 overflow-hidden">        <div className="flex border-b border-github-border-default dark:border-github-dark-border-default">
          <button
            onClick={() => setShowAllCandidates(false)}
            className={`flex-1 flex items-center justify-center py-4 px-6 text-sm font-medium transition-colors ${              !showAllCandidates
                ? 'bg-github-canvas-subtle dark:bg-github-dark-canvas-default text-github-accent-fg dark:text-github-dark-accent-fg border-b-2 border-github-accent-fg dark:border-github-dark-accent-fg'
                : 'bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle text-github-fg-muted dark:text-github-dark-fg-muted hover:bg-github-canvas-default dark:hover:bg-github-dark-canvas-default'
            }`}
          >
            <BriefcaseIcon className="w-5 h-5 mr-2" />
            Shortlist by Job Description
          </button>
          <button
            onClick={() => setShowAllCandidates(true)}
            className={`flex-1 flex items-center justify-center py-4 px-6 text-sm font-medium transition-colors ${              showAllCandidates
                ? 'bg-github-canvas-subtle dark:bg-github-dark-canvas-default text-github-accent-fg dark:text-github-dark-accent-fg border-b-2 border-github-accent-fg dark:border-github-dark-accent-fg'
                : 'bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle text-github-fg-muted dark:text-github-dark-fg-muted hover:bg-github-canvas-default dark:hover:bg-github-dark-canvas-default'
            }`}
          >
            <UserGroupIcon className="w-5 h-5 mr-2" />
            Manage All Candidates
          </button>
        </div>
      </div>

      {!showAllCandidates ? (
        /* Improved shortlisting interface */
        <div className="space-y-6">        <div className="github-card">            <h3 className="text-lg font-medium mb-6 text-github-fg-muted dark:text-github-dark-fg-muted border-b border-github-border-default dark:border-github-dark-border-default pb-3">
              Job Description Input
            </h3>

            {/* Improved Input Method Toggle */}
            <div className="bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle p-3 rounded-md mb-6">              <div className="flex rounded-md overflow-hidden border border-github-border-default dark:border-github-dark-border-default">
                <button                  onClick={() => setInputMethod('text')}                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                    inputMethod === 'text'
                      ? 'bg-github-btn-primary-bg text-github-fg-onEmphasis dark:text-github-dark-fg-onEmphasis'
                      : 'bg-github-canvas-default dark:bg-github-dark-canvas-default text-github-fg-default dark:text-github-dark-fg-default hover:bg-github-canvas-subtle dark:hover:bg-github-dark-canvas-subtle'
                  }`}
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Write Description</span>
                </button>
                <button                  onClick={() => setInputMethod('file')}                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                    inputMethod === 'file'
                      ? 'bg-github-btn-primary-bg text-github-fg-onEmphasis dark:text-github-dark-fg-onEmphasis'
                      : 'bg-github-canvas-default dark:bg-github-dark-canvas-default text-github-fg-default dark:text-github-dark-fg-default hover:bg-github-canvas-subtle dark:hover:bg-github-dark-canvas-subtle'
                  }`}
                >
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  <span>Upload Document</span>
                </button>
              </div>
            </div>

            {/* Job Description Input - Text or File */}
            <div className="mb-6">
              {inputMethod === 'text' ? (
                <div className="space-y-3">                  <label htmlFor="jobDescription" className="block text-sm font-medium text-github-fg-muted dark:text-github-dark-fg-muted flex items-center">
                    <DocumentTextIcon className="w-5 h-5 mr-2 text-github-accent-fg dark:text-github-dark-accent-fg" />
                    Job Description Details
                  </label>
                  <textarea
                    id="jobDescription"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Enter the job description, required skills, qualifications, and experience requirements..."
                    className="github-input w-full h-48 text-sm"
                  />
                  <p className="text-xs text-github-fg-muted dark:text-github-dark-fg-muted">
                    Provide a comprehensive job description for better candidate matching. Include key requirements, responsibilities, and qualifications.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">                  <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default flex items-center">
                    <DocumentIcon className="w-5 h-5 mr-2 text-github-accent-fg dark:text-github-dark-accent-fg" />
                    Job Description Document
                  </label>
                  <div 
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                      ${isDragActive 
                        ? 'border-github-accent-fg dark:border-github-dark-accent-fg bg-github-accent-subtle dark:bg-github-dark-accent-subtle' 
                        : 'border-github-border-default dark:border-github-dark-border-default hover:border-github-accent-fg dark:hover:border-github-dark-accent-fg'
                      }`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center space-y-4">
                      {file ? (                        <>
                          <DocumentIcon className="w-12 h-12 text-github-accent-fg dark:text-github-dark-accent-fg" />
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{file.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setFile(null)
                              }}
                              className="p-1 hover:bg-github-canvas-subtle dark:hover:bg-github-dark-canvas-subtle rounded-full"
                            >
                              <XMarkIcon className="w-5 h-5 text-github-fg-muted dark:text-github-dark-fg-muted" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <FolderIcon className="w-12 h-12 text-github-accent-fg dark:text-github-dark-accent-fg" />
                          <p className="text-github-fg-default dark:text-github-dark-fg-default">
                            {isDragActive ? (
                              "Drop your job description document here"
                            ) : (
                              "Drag and drop job description, or click to browse"
                            )}
                          </p>
                          <p className="text-xs text-github-fg-muted dark:text-github-dark-fg-muted">
                            Supports PDF, DOCX, and TXT files up to 10MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>            {/* Shortlisting Parameters */}
            <h4 className="text-sm font-medium text-github-fg-muted dark:text-github-dark-fg-muted mb-3 border-b border-github-border-default dark:border-github-dark-border-default pb-2">
              Shortlisting Parameters
            </h4>            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">              <div>                <label htmlFor="minScore" className="block text-sm font-medium text-github-fg-muted dark:text-github-dark-fg-muted mb-2">
                  Minimum Match Score (0-100)
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    id="minScore"
                    min="0"
                    max="100"
                    step="5"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="flex-1 mr-3 h-2 bg-github-border-default dark:bg-github-dark-border-default rounded-lg appearance-none cursor-pointer"
                  />                  <span className="w-12 py-1 px-2 text-center border border-github-border-default dark:border-github-dark-border-default rounded bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle text-sm text-github-fg-default dark:text-github-dark-fg-default">
                    {minScore}
                  </span>
                </div>
                <p className="mt-1 text-xs text-github-fg-muted dark:text-github-dark-fg-muted">
                  Only show candidates with score at or above this threshold
                </p>
              </div>
              <div>
                <label htmlFor="limit" className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
                  Maximum Results
                </label>
                <input
                  type="number"
                  id="limit"
                  min="1"
                  value={limit || ''}
                  onChange={(e) => setLimit(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="No limit"                  className="github-input"
                />
                <p className="mt-1 text-xs text-github-fg-muted dark:text-github-dark-fg-muted">
                  Leave empty to show all matching candidates
                </p>
              </div>
            </div>            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-github-border-default dark:border-github-dark-border-default">
              <button
                onClick={handleShortlist}
                disabled={
                  (inputMethod === 'text' && !jobDescription.trim()) ||
                  (inputMethod === 'file' && !file) ||
                  shortlistByText.isPending ||
                  shortlistByFile.isPending
                }
                className={`btn-github-primary ${
                  (inputMethod === 'text' && !jobDescription.trim()) ||
                  (inputMethod === 'file' && !file) ||
                  shortlistByText.isPending ||
                  shortlistByFile.isPending
                    ? 'opacity-60 cursor-not-allowed'
                    : ''
                }`}
              >                <BriefcaseIcon className="w-5 h-5 mr-2" />
                {shortlistByText.isPending || shortlistByFile.isPending ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-github-fg-onEmphasis dark:text-github-dark-fg-onEmphasis" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Start Shortlisting'
                )}
              </button>
              
              {result && (
                <button
                  onClick={clearAll}
                  className="btn-github"
                >
                  Clear Results
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <MotionDiv
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6"
              >                {/* Results Summary */}
                <div className="github-card bg-github-accent-subtle dark:bg-github-dark-accent-subtle border-github-accent-muted dark:border-github-dark-accent-muted">
                  <h3 className="text-lg font-medium text-github-accent-fg dark:text-github-dark-accent-fg mb-4">Shortlisting Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">                    <div className="bg-github-canvas-subtle dark:bg-github-dark-canvas-default rounded-lg p-4 shadow-sm">
                      <div className="text-2xl font-bold text-github-accent-fg dark:text-github-dark-accent-fg">{result.total_candidates}</div>
                      <div className="text-sm text-github-accent-fg dark:text-github-dark-accent-fg">Total Candidates</div>
                    </div>                    <div className="bg-github-canvas-subtle dark:bg-github-dark-canvas-default rounded-lg p-4 shadow-sm">
                      <div className="text-2xl font-bold text-github-success-fg dark:text-github-dark-success-fg">{result.shortlisted_candidates.length}</div>
                      <div className="text-sm text-github-success-fg dark:text-github-dark-success-fg">Shortlisted</div>
                    </div>                    <div className="bg-github-canvas-subtle dark:bg-github-dark-canvas-default rounded-lg p-4 shadow-sm">
                      <div className="text-2xl font-bold text-github-attention-fg dark:text-github-dark-attention-fg">{minScore}+</div>
                      <div className="text-sm text-github-attention-fg dark:text-github-dark-attention-fg">Min Score</div>
                    </div>
                  </div>
                </div>

                {/* Shortlisted Candidates */}
                {result.shortlisted_candidates.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-medium text-github-fg-default dark:text-github-fg-default-dark mb-4">Shortlisted Candidates</h3>
                    <div className="space-y-4">                      {result.shortlisted_candidates.map((candidate, index) => (
                        <div key={candidate.candidate_id} className="github-card border border-github-border-default dark:border-github-dark-border-default">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-github-accent-subtle dark:bg-github-dark-accent-subtle rounded-full flex items-center justify-center text-github-accent-fg dark:text-github-dark-accent-fg font-medium">
                                  #{index + 1}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-lg font-medium text-github-fg-default dark:text-github-dark-fg-default">{candidate.candidate_name}</h4>
                                <p className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted">Candidate ID: {candidate.candidate_id}</p>
                              </div>
                            </div>
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getScoreColor(candidate.score)}`}>
                              {getScoreIcon(candidate.score)}
                              <span className="font-medium">{candidate.score}/100</span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h5 className="font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">Assessment</h5>
                            <p className="text-github-fg-muted dark:text-github-dark-fg-muted">{candidate.reasoning}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium text-github-success-fg dark:text-github-dark-success-fg mb-2">Strengths</h5>
                              <ul className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted space-y-1">
                                {candidate.strengths.map((strength, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-github-success-fg dark:text-github-dark-success-fg mr-2">•</span>
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-medium text-github-danger-fg dark:text-github-dark-danger-fg mb-2">Areas for Consideration</h5>
                              <ul className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted space-y-1">
                                {candidate.weaknesses.map((weakness, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-github-danger-fg dark:text-github-dark-danger-fg mr-2">•</span>
                                    {weakness}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>                ) : (
                  <div className="text-center py-8 bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle rounded-lg">
                    <ChartBarIcon className="w-12 h-12 text-github-fg-muted dark:text-github-dark-fg-muted mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">No Candidates Match</h3>
                    <p className="text-github-fg-muted dark:text-github-dark-fg-muted">
                      No candidates scored above {minScore}. Try lowering the minimum score or refining the job description.
                    </p>
                  </div>
                )}

                {/* Scoring Criteria */}
                <div className="github-card bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle">
                  <h4 className="font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">Scoring Criteria</h4>
                  <pre className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted whitespace-pre-wrap p-3 bg-github-canvas-subtle dark:bg-github-dark-canvas-default border border-github-border-default dark:border-github-dark-border-default rounded-md">{result.scoring_criteria}</pre>
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      ) : (        /* Unified candidates view with toggle functionality */
        <div className="space-y-6">          <div className="github-card bg-github-accent-subtle dark:bg-github-dark-accent-subtle border-github-accent-muted dark:border-github-dark-accent-muted">
            <div className="flex items-center space-x-3 mb-4">
              <UserGroupIcon className="w-6 h-6 text-github-accent-fg dark:text-github-dark-accent-fg" />
              <h3 className="text-lg font-medium text-github-accent-fg dark:text-github-dark-accent-fg">All Candidates</h3>
            </div>
            <p className="text-sm text-github-accent-fg dark:text-github-dark-accent-fg">
              Manage all candidates with manual status controls and resume viewing capabilities.
            </p>
          </div>

          {candidatesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-github-accent-fg dark:border-github-dark-accent-fg"></div>
            </div>
          ) : allCandidates && allCandidates.length > 0 ? (
            <div className="space-y-4">
              {allCandidates.map((candidate) => (
                <div key={candidate.candidate_id} className="github-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1">                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle rounded-full flex items-center justify-center text-github-fg-default dark:text-github-dark-fg-default font-medium border border-github-border-default dark:border-github-dark-border-default">
                          {candidate.full_name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-github-fg-default dark:text-github-dark-fg-default">{candidate.full_name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-github-fg-muted dark:text-github-dark-fg-muted">
                          <span>ID: {candidate.candidate_id}</span>
                          {candidate.email && <span>{candidate.email}</span>}
                          {candidate.years_experience && <span>{candidate.years_experience} years exp</span>}
                        </div>                        {candidate.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {candidate.skills.slice(0, 5).map((skill, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-github-neutral-subtle dark:bg-github-dark-neutral-subtle text-github-fg-default dark:text-github-dark-fg-default border border-github-border-default dark:border-github-dark-border-default">
                                {skill}
                              </span>
                            ))}
                            {candidate.skills.length > 5 && (
                              <span className="text-xs text-github-fg-default dark:text-github-dark-fg-default">+{candidate.skills.length - 5} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>                    <div className="flex items-center space-x-3">
                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        candidate.status === 'shortlisted'
                          ? 'bg-github-success-subtle dark:bg-github-dark-success-subtle text-github-success-fg dark:text-github-dark-success-fg border border-github-success-muted dark:border-github-dark-success-muted'
                          : candidate.status === 'rejected'
                          ? 'bg-github-danger-subtle dark:bg-github-dark-danger-subtle text-github-danger-fg dark:text-github-dark-danger-fg border border-github-danger-muted dark:border-github-dark-danger-muted'
                          : 'bg-github-neutral-subtle dark:bg-github-dark-neutral-subtle text-github-fg-default dark:text-github-dark-fg-default border border-github-border-default dark:border-github-dark-border-default'
                      }`}>
                        {candidate.status === 'shortlisted' && <CheckCircleIcon className="w-3 h-3 mr-1" />}
                        {candidate.status === 'pending' && <ClockIcon className="w-3 h-3 mr-1" />}
                        {candidate.status}
                      </span>

                      {/* Status Toggle Buttons */}                      <div className="flex space-x-1">
                        <button
                          onClick={() => updateStatus.mutate({ 
                            candidateId: candidate.candidate_id, 
                            status: candidate.status === 'shortlisted' ? 'pending' : 'shortlisted' 
                          })}
                          disabled={updateStatus.isPending}
                          className={`btn-github text-xs ${
                            candidate.status === 'shortlisted'
                              ? 'btn-github text-github-fg-default dark:text-github-dark-fg-default hover:bg-github-neutral-subtle dark:hover:bg-github-dark-neutral-subtle'
                              : 'btn-github-primary'
                          }`}
                        >
                          {updateStatus.isPending ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                          ) : candidate.status === 'shortlisted' ? (
                            'Unshortlist'
                          ) : (
                            'Shortlist'
                          )}
                        </button>                        {/* View Resume Button */}
                        {candidate.resume_available && (
                          <button
                            onClick={() => handleViewResume(candidate.candidate_id)}
                            className="btn-github text-xs text-github-fg-default dark:text-github-dark-fg-default hover:bg-github-accent-subtle dark:hover:bg-github-dark-accent-subtle hover:text-github-accent-fg dark:hover:text-github-dark-accent-fg"
                          >
                            <EyeIcon className="w-3 h-3 mr-1" />
                            View Resume
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>          ) : (            <div className="text-center py-8">
              <UserGroupIcon className="w-12 h-12 text-github-fg-muted dark:text-github-dark-fg-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">No Candidates Found</h3>
              <p className="text-github-fg-default dark:text-github-dark-fg-default">
                Upload some resumes first to see candidates here.
              </p>
            </div>
          )}
        </div>
      )}      
      {/* Resume Modal */}
      <AnimatePresence>
        {resumeModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setResumeModal({ isOpen: false, url: '', filename: '', fileType: undefined })}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-github-canvas-subtle dark:bg-github-dark-canvas-default rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-github-border-default dark:border-github-dark-border-default">
                <h3 className="text-lg font-medium text-github-fg-default dark:text-github-dark-fg-default">
                  {resumeModal.filename}
                </h3>
                <div className="flex items-center space-x-2">
                  <a
                    href={resumeModal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-github text-sm"
                  >
                    Open in New Tab
                  </a>                  <button
                    onClick={() => setResumeModal({ isOpen: false, url: '', filename: '', fileType: undefined })}
                    className="p-1 hover:bg-github-canvas-subtle dark:hover:bg-github-dark-canvas-subtle rounded-full"
                  >
                    <XMarkIcon className="w-5 h-5 text-github-fg-muted dark:text-github-dark-fg-muted" />
                  </button>
                </div>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-120px)]">
                {renderPreviewContent()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
