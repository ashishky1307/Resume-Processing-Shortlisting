'use client'

import { m as motion } from 'framer-motion'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'
import dynamic from 'next/dynamic'

// Dynamically import components to avoid SSR issues with client components
const FileUploader = dynamic(() => import('./FileUploader'), { ssr: false })
const CandidateList = dynamic(() => import('./CandidateList'), { ssr: false })
const CandidateShortlisting = dynamic(() => import('./CandidateShortlisting'), { ssr: false })

const tabs = [
  { name: 'Upload Resume', id: 'upload' },
  { name: 'Candidates', id: 'candidates' },
  { name: 'Shortlisting', id: 'shortlisting' },
]

export default function ResumeProcessor() {
  return (
    <Tab.Group>      <Tab.List className="flex space-x-1 rounded-lg bg-github-canvas-subtle dark:bg-github-dark-canvas-subtle p-1 mb-6 border border-github-border-default dark:border-github-dark-border-default">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            className={({ selected }) =>
              clsx(
                'w-full rounded-md py-2.5 px-3 text-sm font-medium leading-5 transition-all',
                'ring-github-accent-emphasis ring-opacity-60 ring-offset-2 ring-offset-github-canvas-default focus:outline-none focus:ring-2',
                selected
                  ? 'bg-github-canvas-default dark:bg-github-dark-canvas-default shadow-sm text-github-fg-default dark:text-github-dark-fg-default border border-github-border-default dark:border-github-dark-border-default'
                  : 'text-github-fg-muted dark:text-github-dark-fg-muted hover:bg-github-canvas-default/50 dark:hover:bg-github-dark-canvas-default/50 hover:text-github-fg-default dark:hover:text-github-dark-fg-default'
              )
            }
          >
            {tab.name}
          </Tab>
        ))}
      </Tab.List>

      <Tab.Panels className="mt-2">        {/* Upload Resume Panel */}
        <Tab.Panel>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="github-card p-6 shadow-sm"
          >
            <FileUploader />
          </motion.div>
        </Tab.Panel>        {/* Candidates List Panel */}
        <Tab.Panel>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="github-card p-6 shadow-sm"
          >
            <CandidateList />
          </motion.div>
        </Tab.Panel>        {/* Shortlisting Panel */}
        <Tab.Panel>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="github-card p-6 shadow-sm"
          >
            <CandidateShortlisting />
          </motion.div>
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  )
}
