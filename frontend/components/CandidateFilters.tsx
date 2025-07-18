'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { CandidateFilters } from '@/src/lib/api'

interface CandidateFiltersComponentProps {
  onFiltersChangeAction: (filters: CandidateFilters) => void
}

export default function CandidateFiltersComponent({ onFiltersChangeAction }: CandidateFiltersComponentProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<CandidateFilters>({
    limit: 100,
    status: '',
    minExperience: undefined,
    maxExperience: undefined,
    skills: [],
    location: '',
    company: '',
    position: '',
    education: ''
  })

  const [skillInput, setSkillInput] = useState('')
  const handleFilterChange = (key: keyof CandidateFilters, value: string | number | string[] | undefined) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChangeAction(newFilters)
  }

  const addSkill = () => {
    if (skillInput.trim() && !filters.skills?.includes(skillInput.trim())) {
      const newSkills = [...(filters.skills || []), skillInput.trim()]
      handleFilterChange('skills', newSkills)
      setSkillInput('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    const newSkills = filters.skills?.filter(skill => skill !== skillToRemove) || []
    handleFilterChange('skills', newSkills)
  }

  const clearAllFilters = () => {
    const clearedFilters: CandidateFilters = {
      limit: 100,
      status: '',
      minExperience: undefined,
      maxExperience: undefined,
      skills: [],
      location: '',
      company: '',
      position: '',      education: ''
    }
    setFilters(clearedFilters)
    onFiltersChangeAction(clearedFilters)
    setSkillInput('')
  }

  const hasActiveFilters = () => {
    return filters.status || 
           filters.minExperience !== undefined || 
           filters.maxExperience !== undefined ||
           (filters.skills && filters.skills.length > 0) ||
           filters.location ||
           filters.company ||
           filters.position ||
           filters.education
  }

  return (
    <div className="bg-github-canvas-subtle dark:bg-github-dark-canvas-default rounded-lg border border-github-border-default dark:border-github-dark-border-default mb-6">
      {/* Filter Toggle Header */}
      <div className="px-4 py-3 border-b border-github-border-default dark:border-github-dark-border-default">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-github-fg-default dark:text-github-dark-fg-default hover:text-github-accent-fg dark:hover:text-github-dark-accent-fg transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            <span className="font-medium">Advanced Filters</span>
            {hasActiveFilters() && (
              <span className="bg-github-accent-fg text-github-fg-onEmphasis dark:text-github-fg-onEmphasis px-2 py-1 rounded-full text-xs">
                {[filters.status, filters.location, filters.company, filters.position, filters.education, ...(filters.skills || [])].filter(Boolean).length + (filters.minExperience !== undefined ? 1 : 0) + (filters.maxExperience !== undefined ? 1 : 0)}
              </span>
            )}
          </button>
          
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-sm text-github-danger-fg dark:text-github-dark-danger-fg hover:text-github-danger-fg dark:hover:text-github-dark-danger-fg transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <motion.div
        initial={false}
        animate={{ height: showFilters ? 'auto' : 0 }}
        className="overflow-hidden"
      >
        <div className="p-4 space-y-4">
          {/* Status and Experience Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md bg-github-canvas-default dark:bg-github-dark-canvas-default text-github-fg-default dark:text-github-dark-fg-default focus:ring-2 focus:ring-github-accent-fg focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
                Min Experience (years)
              </label>
              <input
                type="number"
                min="0"
                value={filters.minExperience || ''}
                onChange={(e) => handleFilterChange('minExperience', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md bg-github-canvas-default dark:bg-github-dark-canvas-default text-github-fg-default dark:text-github-dark-fg-default focus:ring-2 focus:ring-github-accent-fg focus:border-transparent"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
                Max Experience (years)
              </label>
              <input
                type="number"
                min="0"
                value={filters.maxExperience || ''}
                onChange={(e) => handleFilterChange('maxExperience', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md bg-github-canvas-default dark:bg-github-dark-canvas-default text-github-fg-default dark:text-github-dark-fg-default focus:ring-2 focus:ring-github-accent-fg focus:border-transparent"
                placeholder="20"
              />
            </div>
          </div>

          {/* Skills Section */}
          <div>
            <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
              Skills & Technologies
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                className="flex-1 px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md bg-github-canvas-default dark:bg-github-dark-canvas-default text-github-fg-default dark:text-github-dark-fg-default focus:ring-2 focus:ring-github-accent-fg focus:border-transparent"
                placeholder="e.g., React, Python, Machine Learning"
              />
              <button
                onClick={addSkill}
                disabled={!skillInput.trim()}
                className="px-4 py-2 bg-github-btn-bg hover:bg-github-btn-hover-bg border border-github-border-default text-github-fg-default rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            {filters.skills && filters.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-github-accent-subtle text-github-accent-fg rounded-md text-sm"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-1 text-github-accent-fg hover:text-github-danger-fg"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Location and Company Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
                Location
              </label>
              <input
                type="text"
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md bg-github-canvas-default dark:bg-github-dark-canvas-default text-github-fg-default dark:text-github-dark-fg-default focus:ring-2 focus:ring-github-accent-fg focus:border-transparent"
                placeholder="e.g., San Francisco, Remote, India"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
                Company
              </label>
              <input
                type="text"
                value={filters.company || ''}
                onChange={(e) => handleFilterChange('company', e.target.value)}
                className="w-full px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md bg-github-canvas-default dark:bg-github-dark-canvas-default text-github-fg-default dark:text-github-dark-fg-default focus:ring-2 focus:ring-github-accent-fg focus:border-transparent"
                placeholder="e.g., Google, Microsoft, Amazon"
              />
            </div>
          </div>

          {/* Position and Education Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
                Position/Title
              </label>
              <input
                type="text"
                value={filters.position || ''}
                onChange={(e) => handleFilterChange('position', e.target.value)}
                className="w-full px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md bg-github-canvas-default dark:bg-github-dark-canvas-default text-github-fg-default dark:text-github-dark-fg-default focus:ring-2 focus:ring-github-accent-fg focus:border-transparent"
                placeholder="e.g., Software Engineer, Data Scientist"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
                Education
              </label>
              <input
                type="text"
                value={filters.education || ''}
                onChange={(e) => handleFilterChange('education', e.target.value)}
                className="w-full px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md bg-github-canvas-default dark:bg-github-dark-canvas-default text-github-fg-default dark:text-github-dark-fg-default focus:ring-2 focus:ring-github-accent-fg focus:border-transparent"
                placeholder="e.g., Computer Science, MIT, Bachelor's"
              />
            </div>          </div>

          {/* Page Size */}
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-github-fg-default dark:text-github-dark-fg-default mb-2">
              Items per page
            </label>
            <select
              value={filters.limit || 5}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-github-border-default dark:border-github-dark-border-default rounded-md bg-github-canvas-default dark:bg-github-dark-canvas-default text-github-fg-default dark:text-github-dark-fg-default focus:ring-2 focus:ring-github-accent-fg focus:border-transparent"
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
