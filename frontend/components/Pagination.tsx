'use client'

import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline'
import { PaginationInfo } from '@/src/lib/api'

interface PaginationProps {
  pagination: PaginationInfo
  onPageChange: (page: number) => void
  className?: string
}

export default function Pagination({ pagination, onPageChange, className = '' }: PaginationProps) {
  const { page, total_pages, has_prev, has_next, total_count, limit } = pagination

  // Calculate start and end of current page items
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total_count)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxPages = 7 // Maximum number of page buttons to show

    if (total_pages <= maxPages) {
      // Show all pages if total is small
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i)
      }
    } else {
      // Show first page
      pages.push(1)

      // Calculate range around current page
      let rangeStart = Math.max(2, page - 2)
      let rangeEnd = Math.min(total_pages - 1, page + 2)

      // Adjust range to always show 5 pages in the middle
      if (rangeEnd - rangeStart < 4) {
        if (rangeStart === 2) {
          rangeEnd = Math.min(total_pages - 1, rangeStart + 4)
        } else if (rangeEnd === total_pages - 1) {
          rangeStart = Math.max(2, rangeEnd - 4)
        }
      }

      // Add ellipsis if needed
      if (rangeStart > 2) {
        pages.push('...')
      }

      // Add middle pages
      for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed
      if (rangeEnd < total_pages - 1) {
        pages.push('...')
      }

      // Show last page
      if (total_pages > 1) {
        pages.push(total_pages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  if (total_pages <= 1) {
    return null // Don't show pagination if there's only one page
  }

  return (
    <div className={`flex items-center justify-between bg-github-canvas-default dark:bg-github-dark-canvas-default px-4 py-3 border-t border-github-border-default dark:border-github-dark-border-default ${className}`}>
      {/* Results info */}
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => has_prev && onPageChange(page - 1)}
          disabled={!has_prev}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-github-fg-default dark:text-github-dark-fg-default bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle border border-github-border-default dark:border-github-dark-border-default hover:bg-github-canvas-inset dark:hover:bg-github-dark-canvas-inset disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => has_next && onPageChange(page + 1)}
          disabled={!has_next}
          className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-github-fg-default dark:text-github-dark-fg-default bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle border border-github-border-default dark:border-github-dark-border-default hover:bg-github-canvas-inset dark:hover:bg-github-dark-canvas-inset disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-github-fg-muted dark:text-github-dark-fg-muted">
            Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{total_count}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* First page button */}
            <button
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-github-border-default dark:border-github-dark-border-default bg-github-canvas-default dark:bg-github-dark-canvas-default text-sm font-medium text-github-fg-muted dark:text-github-dark-fg-muted hover:bg-github-canvas-subtle dark:hover:bg-github-dark-canvas-subtle disabled:opacity-50 disabled:cursor-not-allowed"
              title="First page"
            >
              <ChevronDoubleLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Previous page button */}
            <button
              onClick={() => has_prev && onPageChange(page - 1)}
              disabled={!has_prev}
              className="relative inline-flex items-center px-2 py-2 border border-github-border-default dark:border-github-dark-border-default bg-github-canvas-default dark:bg-github-dark-canvas-default text-sm font-medium text-github-fg-muted dark:text-github-dark-fg-muted hover:bg-github-canvas-subtle dark:hover:bg-github-dark-canvas-subtle disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Page numbers */}
            {pageNumbers.map((pageNum, index) => {
              if (pageNum === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 border border-github-border-default dark:border-github-dark-border-default bg-github-canvas-default dark:bg-github-dark-canvas-default text-sm font-medium text-github-fg-muted dark:text-github-dark-fg-muted"
                  >
                    ...
                  </span>
                )
              }

              const isCurrentPage = pageNum === page
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum as number)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    isCurrentPage
                      ? 'z-10 bg-github-accent-emphasis border-github-accent-emphasis text-github-fg-onEmphasis dark:text-github-dark-fg-onEmphasis'
                      : 'bg-github-canvas-default dark:bg-github-dark-canvas-default border-github-border-default dark:border-github-dark-border-default text-github-fg-default dark:text-github-dark-fg-default hover:bg-github-canvas-subtle dark:hover:bg-github-dark-canvas-subtle'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}

            {/* Next page button */}
            <button
              onClick={() => has_next && onPageChange(page + 1)}
              disabled={!has_next}
              className="relative inline-flex items-center px-2 py-2 border border-github-border-default dark:border-github-dark-border-default bg-github-canvas-default dark:bg-github-dark-canvas-default text-sm font-medium text-github-fg-muted dark:text-github-dark-fg-muted hover:bg-github-canvas-subtle dark:hover:bg-github-dark-canvas-subtle disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Last page button */}
            <button
              onClick={() => onPageChange(total_pages)}
              disabled={page === total_pages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-github-border-default dark:border-github-dark-border-default bg-github-canvas-default dark:bg-github-dark-canvas-default text-sm font-medium text-github-fg-muted dark:text-github-dark-fg-muted hover:bg-github-canvas-subtle dark:hover:bg-github-dark-canvas-subtle disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last page"
            >
              <ChevronDoubleRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
