'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { resumeApi, type Candidate, type CandidateFilters } from '@/src/lib/api'
import { EyeIcon, ChevronUpIcon, ChevronDownIcon, BuildingOfficeIcon, AcademicCapIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import CandidateFiltersComponent from './CandidateFilters'
import DocumentViewer from './DocumentViewer'
import Pagination from './Pagination'

interface ResumeModalProps {
  isOpen: boolean
  onClose: () => void
  resumeUrl: string
  filename: string
  fileType?: string
}

const ResumeModal = ({ isOpen, onClose, resumeUrl, filename, fileType }: ResumeModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0 }}
            >
              <div
                onClick={onClose}
                className="absolute inset-0 bg-black cursor-pointer"
                role="presentation"
                tabIndex={-1}
              />
            </motion.div>
            
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative github-card shadow-xl w-full max-w-6xl"
            >
              <div className="p-4 border-b border-github-border-default dark:border-github-dark-border-default">
                <h3 className="text-lg font-semibold text-github-fg-default dark:text-github-dark-fg-default">Resume Preview: {filename}</h3>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-github-fg-muted dark:text-github-dark-fg-muted hover:text-github-fg-default dark:hover:text-github-dark-fg-default"
                >
                  <span className="sr-only">Close</span>
                  &times;
                </button>
              </div>              {/* Use the comprehensive DocumentViewer component */}
              <div className="relative w-full" style={{ height: '80vh' }}>
                <DocumentViewer
                  url={resumeUrl}
                  filename={filename}
                  fileType={fileType || 'unknown'}
                />
              </div>

              <div className="p-4 border-t border-github-border-default dark:border-github-dark-border-default bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle flex justify-end">
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-github-primary"
                >
                  Open in New Tab
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function CandidateList() {
  const [filters, setFilters] = useState<CandidateFilters>({
    page: 1,
    limit: 5,
    status: '',
    minExperience: undefined,
    maxExperience: undefined,
    skills: [],
    location: '',
    company: '',
    position: '',
    education: ''
  })
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
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

  const queryClient = useQueryClient()

  // Fetch candidates with filters and pagination
  const { data: candidatesResponse, isLoading, error } = useQuery({
    queryKey: ['candidates', filters],
    queryFn: () => resumeApi.getCandidates(filters)
  })

  const candidates = candidatesResponse?.candidates || []
  const pagination = candidatesResponse?.pagination

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
    setExpandedRows(new Set()) // Clear expanded rows when changing page
  }

  // Shortlist mutation
  const shortlist = useMutation({
    mutationFn: (candidateId: number) => resumeApi.shortlistCandidate(candidateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate shortlisted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to shortlist candidate')
    }
  })  // View resume
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

  // Toggle row expansion
  const toggleRowExpansion = (candidateId: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(candidateId)) {
      newExpanded.delete(candidateId)
    } else {
      newExpanded.add(candidateId)
    }
    setExpandedRows(newExpanded)
  }
  if (error) {
    return (
      <div className="text-github-danger-fg dark:text-github-dark-danger-fg text-center py-4">
        Error loading candidates: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }

  const statusBadgeColors: Record<string, string> = {
    pending: 'bg-github-neutral-muted dark:bg-github-dark-neutral-muted text-github-fg-default dark:text-github-dark-fg-default',
    shortlisted: 'bg-github-success-subtle dark:bg-github-dark-success-subtle text-github-success-fg dark:text-github-dark-success-fg border border-github-success-muted dark:border-github-dark-success-muted',
    rejected: 'bg-github-danger-subtle dark:bg-github-dark-danger-subtle text-github-danger-fg dark:text-github-dark-danger-fg border border-github-danger-muted dark:border-github-dark-danger-muted'
  }
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-github-fg-default dark:text-github-dark-fg-default mb-4">
          Candidate Database
        </h2>        {/* Comprehensive Filters Component */}        <CandidateFiltersComponent
          onFiltersChangeAction={setFilters}
        />
      </div>

      {/* Candidates Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-github-border-default dark:divide-github-dark-border-default">          <thead className="bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-github-fg-muted dark:text-github-dark-fg-muted uppercase tracking-wider">
                
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-github-fg-muted dark:text-github-dark-fg-muted uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-github-fg-muted dark:text-github-dark-fg-muted uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-github-fg-muted dark:text-github-dark-fg-muted uppercase tracking-wider">
                Experience
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-github-fg-muted dark:text-github-dark-fg-muted uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-github-fg-muted dark:text-github-dark-fg-muted uppercase tracking-wider">
                Skills
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-github-fg-muted dark:text-github-dark-fg-muted uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-github-fg-muted dark:text-github-dark-fg-muted uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>          <tbody className="bg-github-canvas-default dark:bg-github-dark-canvas-default divide-y divide-github-border-muted dark:divide-github-dark-border-muted">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <svg className="animate-spin h-5 w-5 text-github-accent-emphasis dark:text-github-dark-accent-emphasis" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </td>
              </tr>
            ) : candidates && candidates.length > 0 ? (
              candidates.map((candidate: Candidate) => (
                <React.Fragment key={candidate.candidate_id}>
                  {/* Main candidate row */}
                  <tr className="hover:bg-github-canvas-subtle dark:hover:bg-github-dark-canvas-subtle">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-github-fg-default dark:text-github-dark-fg-default">
                      <button
                        onClick={() => toggleRowExpansion(candidate.candidate_id)}
                        className="p-1 hover:bg-github-neutral-muted dark:hover:bg-github-dark-neutral-muted rounded"
                      >
                        {expandedRows.has(candidate.candidate_id) ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronUpIcon className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-github-fg-default dark:text-github-dark-fg-default font-medium">
                      <div>
                        <div className="font-medium">{candidate.full_name}</div>
                        <div className="text-xs text-github-fg-muted dark:text-github-dark-fg-muted">ID: {candidate.candidate_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-github-fg-muted dark:text-github-dark-fg-muted">
                      {candidate.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-github-fg-muted dark:text-github-dark-fg-muted">
                      {candidate.years_experience ? `${candidate.years_experience} years` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-github-fg-muted dark:text-github-dark-fg-muted">
                      {candidate.location || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-github-fg-muted dark:text-github-dark-fg-muted">
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-github-accent-subtle dark:bg-github-dark-accent-subtle text-github-accent-fg dark:text-github-dark-accent-fg border border-github-accent-muted dark:border-github-dark-accent-muted">
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 3 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-github-neutral-muted dark:bg-github-dark-neutral-muted text-github-fg-muted dark:text-github-dark-fg-muted">
                            +{candidate.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeColors[candidate.status]}`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {/* Shortlist Button */}
                      <button
                        onClick={() => shortlist.mutate(candidate.candidate_id)}
                        disabled={candidate.status === 'shortlisted' || shortlist.isPending}
                        className={`btn-github text-sm ${
                          candidate.status === 'shortlisted'
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-github-success-subtle dark:hover:bg-github-dark-success-subtle hover:text-github-success-fg dark:hover:text-github-dark-success-fg'
                        }`}
                      >
                        {shortlist.isPending ? (
                          <ChevronUpIcon className="animate-bounce h-4 w-4" />
                        ) : (
                          'Shortlist'
                        )}
                      </button>

                      {/* View Resume Button */}
                      {candidate.resume_available && (
                        <button
                          onClick={() => handleViewResume(candidate.candidate_id)}
                          className="btn-github text-sm hover:bg-github-accent-subtle dark:hover:bg-github-dark-accent-subtle hover:text-github-accent-fg dark:hover:text-github-dark-accent-fg"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded row with additional details */}
                  {expandedRows.has(candidate.candidate_id) && (
                    <tr className="bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle">
                      <td colSpan={8} className="px-6 py-4">
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Skills Section */}
                            <div>
                              <h4 className="text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2 flex items-center">
                                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                                All Skills
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {candidate.skills.map((skill, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-github-accent-subtle dark:bg-github-dark-accent-subtle text-github-accent-fg dark:text-github-dark-accent-fg border border-github-accent-muted dark:border-github-dark-accent-muted">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Contact Information */}
                            <div>
                              <h4 className="text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
                                Contact Information
                              </h4>
                              <div className="text-xs text-github-fg-muted dark:text-github-dark-fg-muted space-y-1">
                                <div><strong>Email:</strong> {candidate.email || 'N/A'}</div>
                                <div><strong>Phone:</strong> {candidate.phone || 'N/A'}</div>
                                <div><strong>Location:</strong> {candidate.location || 'N/A'}</div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            {/* Work Experience */}
                            {candidate.work_experience && candidate.work_experience.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2 flex items-center">
                                  <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                                  Work Experience
                                </h4>
                                <div className="space-y-2">
                                  {candidate.work_experience.map((exp, idx) => (
                                    <div key={idx} className="text-xs text-github-fg-muted dark:text-github-dark-fg-muted border-l-2 border-github-accent-muted dark:border-github-dark-accent-muted pl-3">
                                      <div className="font-medium">{exp.position} at {exp.company}</div>
                                      <div className="text-github-fg-subtle dark:text-github-dark-fg-subtle">
                                        {exp.start_date} - {exp.end_date || 'Present'}
                                      </div>
                                      {exp.description && (
                                        <div className="mt-1">{exp.description}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Education */}
                            {candidate.education && candidate.education.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2 flex items-center">
                                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                                  Education
                                </h4>
                                <div className="space-y-2">
                                  {candidate.education.map((edu, idx) => (
                                    <div key={idx} className="text-xs text-github-fg-muted dark:text-github-dark-fg-muted border-l-2 border-github-success-muted dark:border-github-dark-success-muted pl-3">
                                      <div className="font-medium">{edu.degree}</div>
                                      <div className="text-github-fg-subtle dark:text-github-dark-fg-subtle">
                                        {edu.institution}
                                      </div>
                                      {edu.graduation_year && (
                                        <div className="text-github-fg-subtle dark:text-github-dark-fg-subtle">
                                          Graduated: {edu.graduation_year}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-github-fg-muted dark:text-github-dark-fg-muted">
                  No candidates found
                </td>
              </tr>
            )}
          </tbody>        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          className="rounded-b-lg"
        />
      )}

      {/* Resume Preview Modal */}
      <ResumeModal
        isOpen={resumeModal.isOpen}
        onClose={() => setResumeModal(prev => ({ ...prev, isOpen: false }))}
        resumeUrl={resumeModal.url}
        filename={resumeModal.filename}
        fileType={resumeModal.fileType}
      />
    </div>
  )
}
