'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { KanbanBoard } from '@/components/kanban'
import type { ColumnStatus } from '@/components/kanban'

interface SavedJob {
  savedJobId: string
  status: ColumnStatus
  id: string
  title: string
  company: string
  company_logo?: string
  location: string
  apply_url: string
  job_type?: string
  experience_level?: string
  skills?: string[]
}

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<SavedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isMember, setIsMember] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsAuthenticated(false)
        return
      }

      setIsAuthenticated(true)
      fetchSavedJobs()
    }

    checkAuth()
  }, [])

  const fetchSavedJobs = async () => {
    try {
      const response = await fetch('/api/saved-jobs')

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false)
          return
        }
        throw new Error('Failed to fetch saved jobs')
      }

      const data = await response.json()
      setJobs(data.jobs || [])
      setIsMember(data.isMember || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-medium text-neutral-900 mb-4">Saved Jobs</h1>
            <p className="text-neutral-500 mb-8">Sign in to track your job applications</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-48 mb-8" />
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-72 flex-shrink-0">
                  <div className="h-6 bg-neutral-200 rounded w-24 mb-3" />
                  <div className="h-96 bg-neutral-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-medium text-neutral-900 mb-4">Something went wrong</h1>
            <p className="text-red-500 mb-8">{error}</p>
            <button
              onClick={() => {
                setError(null)
                setLoading(true)
                fetchSavedJobs()
              }}
              className="px-6 py-3 text-sm font-medium text-white bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-neutral-50">
      <div className="max-w-[1600px] mx-auto px-6 pt-12 pb-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to jobs
          </Link>
          <h1 className="text-4xl font-semibold text-neutral-900">Saved Jobs</h1>
          <p className="text-neutral-500 mt-1">
            Drag jobs between columns to track your application progress
          </p>
        </div>

        {/* Empty state */}
        {jobs.length === 0 ? (
          <div className="bg-white border border-dashed border-neutral-300 rounded-xl px-12 py-20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-neutral-900 mb-2">No saved jobs yet</h2>
              <p className="text-neutral-500 mb-6">Start saving jobs you're interested in to track them here</p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white rounded-lg border border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[1px] transition-all"
              >
                Browse jobs
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4 -mx-6">
            <div className="px-6">
              <KanbanBoard initialJobs={jobs} isMember={isMember} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
