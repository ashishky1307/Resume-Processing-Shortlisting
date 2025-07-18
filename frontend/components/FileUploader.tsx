'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  FolderIcon, 
  DocumentIcon, 
  XMarkIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ArrowPathIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import { useMutation } from '@tanstack/react-query'
import { resumeApi, type BatchProcessingResponse, type DuplicateHandling } from '../src/lib/api'

interface FileWithId extends File {
  id: string
}

export default function FileUploader() {
  const [files, setFiles] = useState<FileWithId[]>([])
  const [saveToDb, setSaveToDb] = useState(true)
  const [batchResult, setBatchResult] = useState<BatchProcessingResponse | null>(null)
  const [duplicateHandling, setDuplicateHandling] = useState<DuplicateHandling>('strict')
  // Batch upload mutation
  const uploadBatch = useMutation({
    mutationFn: async () => {
      if (files.length === 0) throw new Error('No resume files selected')
      return resumeApi.uploadResumesBatch(files, true, saveToDb, duplicateHandling)
    },
    onSuccess: (data) => {
      if (data) {
        setBatchResult(data)
        toast.success(`Batch processing completed! ${data.successful} successful, ${data.failed} failed, ${data.duplicates} duplicates`)
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to process batch'
      toast.error(message)
    }
  })
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Validate file types to ensure only resumes
    const validFiles = acceptedFiles.filter(file => {
      // Check file type
      const fileType = file.type
      if (!(
        fileType === 'application/pdf' || 
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'text/plain'
      )) {
        toast.error(`${file.name} is not a supported resume format. Please use PDF, DOCX, or TXT files.`)
        return false
      }
      
      // Check file size
      if (file.size > 10 * 1024 * 1024) { // 10MB limit per file
        toast.error(`${file.name} is too large. Maximum size is 10MB.`)
        return false
      }
      
      // Check if file is empty/blank
      if (file.size === 0) {
        toast.error(`${file.name} appears to be empty. Please upload a valid resume.`)
        return false
      }
      
      return true
    })
    
    // Add unique IDs to valid files
    const filesWithId: FileWithId[] = validFiles.map(file => 
      Object.assign(file, { id: `${file.name}-${Date.now()}-${Math.random()}` })
    )

    // Add to existing files
    setFiles(prev => [...prev, ...filesWithId])
  }, [])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB in bytes
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(rejection => {
        const { file, errors } = rejection
        if (errors.some(e => e.code === 'file-too-large')) {
          toast.error(`${file.name} is too large. Maximum size is 10MB.`)
        } else if (errors.some(e => e.code === 'file-invalid-type')) {
          toast.error(`${file.name} is not a supported resume format. Please use PDF, DOCX, or TXT files.`)
        } else {
          toast.error(`${file.name} could not be uploaded: ${errors[0].message}`)
        }
      })
    }
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const clearAll = () => {
    setFiles([])
    setBatchResult(null)
  }
  const handleUpload = async () => {
    // Check if any files are selected
    if (files.length === 0) {
      toast.error('Please select resume files to upload')
      return
    }
    
    // Show global loading toast for validation process
    const batchLoadingToast = toast.loading(`Validating ${files.length} resume file(s)...`)    // Track validation details without showing individual toasts
    const validationDetails: {
      valid: FileWithId[];
      invalid: { file: FileWithId; reason: string }[];
      errors: { file: FileWithId; error: unknown }[];
    } = {
      valid: [],
      invalid: [],
      errors: []
    }
      // Validate that files contain actual resume content using LLM
    const validateFileContent = async (file: FileWithId): Promise<boolean> => {
      // Check for empty files again (in case they were added directly)
      if (file.size === 0) {
        validationDetails.invalid.push({ 
          file, 
          reason: 'File appears to be empty.' 
        })
        return false
      }
      
      try {
        // Call the backend API to validate the resume using LLM
        const validationResult = await resumeApi.validateResumeContent(file)
        
        // Handle validation result
        if (!validationResult.is_resume) {
          // Prepare error message
          let errorMessage = `${validationResult.reasoning}`
          
          // Add missing elements if available
          if (validationResult.missing_elements && validationResult.missing_elements.length > 0) {
            errorMessage += ` Missing: ${validationResult.missing_elements.join(', ')}.`
          }
          
          validationDetails.invalid.push({ file, reason: errorMessage })
          return false
        }
        
        validationDetails.valid.push(file)
        return true
      } catch (error) {
        console.error(`Error validating ${file.name}:`, error)
        validationDetails.errors.push({ file, error })
        
        // Fall back to basic checks if the validation API fails
        if (file.size < 1000) { // Extremely small files are unlikely to be valid resumes
          validationDetails.invalid.push({ 
            file, 
            reason: 'File is too small to be a valid resume.' 
          })
          return false
        }
        
        // Allow files to pass in case of API failure with reasonable size
        validationDetails.valid.push(file)
        return true
      }
    }
    
    // Validate all files concurrently
    const validationResults = await Promise.all(
      files.map(file => validateFileContent(file))
    )
    
    // Dismiss batch loading toast
    toast.dismiss(batchLoadingToast)
    
    // Show summary notifications instead of individual ones
    if (validationDetails.invalid.length > 0) {
      // Create a summary message for invalid files
      if (validationDetails.invalid.length === 1) {
        const item = validationDetails.invalid[0]
        toast.error(`${item.file.name} is not a valid resume: ${item.reason}`)
      } else {
        toast.error(`${validationDetails.invalid.length} file(s) could not be validated as proper resumes.`, {
          duration: 5000,
        })
        
        // Show a detailed toast with all invalid files (limit to first 3 to avoid clutter)
        const detailsToShow = validationDetails.invalid.slice(0, 3)
        const remainingCount = validationDetails.invalid.length - detailsToShow.length
        
        const detailMessage = detailsToShow.map(item => 
          `• ${item.file.name}: ${item.reason}`
        ).join('\n') + (remainingCount > 0 ? `\n• ...and ${remainingCount} more` : '')
        
        toast.error(detailMessage, { duration: 8000 })
      }
      
      // Filter out invalid files
      const validFiles = files.filter((_, index) => validationResults[index])
      if (validFiles.length === 0) {
        toast.error('No valid resume files to upload. Please ensure files contain actual resume content.')
        return
      }
      setFiles(validFiles)
    }
    
    if (validationDetails.errors.length > 0) {
      toast.error(`Validation API errors encountered for ${validationDetails.errors.length} file(s). Basic validation used instead.`, { 
        duration: 4000 
      })
    }
    
    if (validationDetails.valid.length > 0) {
      toast.success(`${validationDetails.valid.length} file(s) validated successfully!`)
    }
    
    // Proceed with upload
    uploadBatch.mutate()
  }
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-github-success-fg dark:text-github-dark-success-fg" />
      case 'error':
        return <ExclamationCircleIcon className="w-5 h-5 text-github-danger-fg dark:text-github-dark-danger-fg" />
      case 'duplicate':
        return <ArrowPathIcon className="w-5 h-5 text-github-attention-fg dark:text-github-dark-attention-fg" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-github-success-fg dark:text-github-dark-success-fg bg-github-success-subtle dark:bg-github-dark-success-subtle'
      case 'error':
        return 'text-github-danger-fg dark:text-github-dark-danger-fg bg-github-danger-subtle dark:bg-github-dark-danger-subtle'
      case 'duplicate':
        return 'text-github-attention-fg dark:text-github-dark-attention-fg bg-github-attention-subtle dark:bg-github-dark-attention-subtle'
      default:
        return 'text-github-fg-muted dark:text-github-dark-fg-muted bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle'
    }
  }

  const isUploading = uploadBatch.isPending
  
  return (
    <div className="space-y-6">      {/* File Drop Zone with clearer messaging */}
      <div 
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-github-accent-emphasis dark:border-github-dark-accent-emphasis bg-github-accent-subtle dark:bg-github-dark-accent-subtle' 
            : 'border-github-border-default dark:border-github-dark-border-default hover:border-github-accent-emphasis dark:hover:border-github-dark-accent-emphasis bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle'
          }`}
      >
        <input {...getInputProps()} />        
        <div className="flex flex-col items-center space-y-4">
          <FolderIcon className="w-12 h-12 text-github-fg-muted dark:text-github-dark-fg-muted" />
          <p className="text-github-fg-default dark:text-github-dark-fg-default">
            {isDragActive ? (
              "Drop your resume files here"
            ) : (
              "Drag and drop resume files, or click to browse"
            )}
          </p>
          <p className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted">
            Supports PDF, DOCX, and TXT files up to 10MB each
            (Maximum 50 files per batch)
          </p>
          <p className="text-xs text-github-fg-muted dark:text-github-dark-fg-muted">
            Files must contain actual resume content to be processed
          </p>
            <p className="text-xs text-github-attention-fg dark:text-github-dark-attention-fg">
            Warning: AI-based validation will check for contact info, education & skills
            </p>
          <p className="text-xs text-github-danger-fg dark:text-github-dark-danger-fg">
            Empty, blank, or non-resume files will be rejected
          </p>
        </div>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (        <div className="github-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-github-fg-default dark:text-github-dark-fg-default">
              Selected Files ({files.length})
            </h3>
            <button
              onClick={clearAll}
              className="text-sm text-github-danger-fg dark:text-github-dark-danger-fg hover:underline"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle rounded">
                <div className="flex items-center space-x-2">
                  <DocumentIcon className="w-4 h-4 text-github-accent-fg dark:text-github-dark-accent-fg" />
                  <span className="text-sm text-github-fg-default dark:text-github-dark-fg-default">{file.name}</span>
                  <span className="text-xs text-github-fg-muted dark:text-github-dark-fg-muted">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 hover:bg-github-canvas-default dark:hover:bg-github-dark-canvas-default rounded-full"
                >
                  <XMarkIcon className="w-4 h-4 text-github-fg-muted dark:text-github-dark-fg-muted" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
        {/* Options */}
      <div className="flex items-center space-x-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={saveToDb}
            onChange={(e) => setSaveToDb(e.target.checked)}
            className="accent-github-accent-emphasis dark:accent-github-dark-accent-emphasis cursor-pointer"
          />
          <span className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted">Save to database</span>
        </label>
        
        {saveToDb && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted">Duplicate handling:</span>
            <select 
              value={duplicateHandling}
              onChange={(e) => setDuplicateHandling(e.target.value as DuplicateHandling)}
              className="github-input text-sm bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle border border-github-border-default dark:border-github-dark-border-default rounded px-2 py-1 text-github-fg-muted dark:text-github-dark-fg-muted"
            >
              <option value="strict">Strict (No duplicates)</option>
              <option value="allow_updates">Allow updates (Same person)</option>
              <option value="allow_all">Allow all duplicates</option>
            </select>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex space-x-4">
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className={`btn-github-primary ${
            files.length === 0 || isUploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <CloudArrowUpIcon className="w-5 h-5 mr-2" />
          {isUploading ? (
            <span className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-github-fg-onEmphasis dark:text-github-fg-onEmphasis" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {files.length > 1 ? 'Processing Batch...' : 'Processing...'}
            </span>
          ) : (
            `Upload ${files.length > 1 ? 'Batch' : ''} (${files.length} file${files.length > 1 ? 's' : ''})`
          )}
        </button>
        
        {batchResult && (
          <button
            onClick={clearAll}
            className="btn-github"
          >
            Clear Results
          </button>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {batchResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >            {/* Summary */}
            <div className="github-card bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle">
              <h3 className="text-lg font-medium text-github-fg-default dark:text-github-dark-fg-default mb-4">Processing Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-github-fg-default dark:text-github-dark-fg-default">{batchResult.total_files}</div>
                  <div className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-github-success-fg dark:text-github-dark-success-fg">{batchResult.successful}</div>
                  <div className="text-sm text-github-success-fg dark:text-github-dark-success-fg">Successful</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-github-danger-fg dark:text-github-dark-danger-fg">{batchResult.failed}</div>
                  <div className="text-sm text-github-danger-fg dark:text-github-dark-danger-fg">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-github-attention-fg dark:text-github-dark-attention-fg">{batchResult.duplicates}</div>
                  <div className="text-sm text-github-attention-fg dark:text-github-dark-attention-fg">Duplicates</div>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="github-card">
              <h3 className="text-lg font-medium text-github-fg-default dark:text-github-dark-fg-default mb-4">File Details</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {batchResult.results.map((result, index) => (
                  <div key={index} className="flex items-start justify-between p-3 bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle rounded">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <div className="font-medium text-github-fg-default dark:text-github-dark-fg-default">{result.filename}</div>
                        <div className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted">{result.message}</div>
                        {result.candidate_id && (
                          <div className="text-sm text-github-success-fg dark:text-github-dark-success-fg">
                            Candidate ID: {result.candidate_id}
                          </div>
                        )}
                        {result.existing_candidate_id && (
                          <div className="text-sm text-github-attention-fg dark:text-github-dark-attention-fg">
                            Existing Candidate ID: {result.existing_candidate_id}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
