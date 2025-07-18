'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion, domMax } from 'framer-motion'
import { useState, type ReactNode } from 'react'

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={domMax}>
        {children}
      </LazyMotion>
    </QueryClientProvider>
  )
}
