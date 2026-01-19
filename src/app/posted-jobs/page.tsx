'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { RainbowButton } from '@/components/ui'

interface Job {
  id: string
  title: string
  company: string
  company_logo?: string
  location: string
  job_type: string
  experience_level?: string
  skills?: string[]
  is_featured: boolean
  is_sticky: boolean
  sticky_until?: string
  is_rainbow: boolean
  is_active: boolean
  posted_at: string
  expires_at: string
  views: number
  clicks: number
}

const getCompanyLogoUrl = (company: string): string => {
  const cleanName = company.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '')
  return `https://logo.clearbit.com/${cleanName}.com`
}

const getInitials = (company: string) => company.substring(0, 2).toUpperCase()

const toTitleCase = (str: string) =>
  str.toLowerCase().replace(/(?:^|[\s-])\w/g, match => match.toUpperCase())

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const getDaysRemaining = (expiresAt: string) => {
  const now = new Date()
  const expires = new Date(expiresAt)
  const diff = expires.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days
}

export default function PostedJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    const fetchPostedJobs = async () => {
      const supabase = createBrowserSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsAuthenticated(false)
        setLoading(false)
        return
      }

      setIsAuthenticated(true)

      // Query by email (primary) or user_id (fallback)
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, company, company_logo, location, job_type, experience_level, skills, is_featured, is_sticky, sticky_until, is_rainbow, is_active, posted_at, expires_at, views, clicks')
        .or(`poster_email.eq.${user.email?.toLowerCase()},posted_by.eq.${user.id}`)
        .order('posted_at', { ascending: false })

      if (error) {
        console.error('Error fetching posted jobs:', error)
        setError('Failed to load your posted jobs')
      } else {
        setJobs(data || [])
      }

      setLoading(false)
    }

    fetchPostedJobs()
  }, [])

  const handleDelete = async (jobId: string, jobTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${jobTitle}"? This cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete job')
      }

      setJobs(jobs.filter(j => j.id !== jobId))
    } catch (error) {
      console.error('Error deleting job:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete job')
    }
  }

  // Not logged in
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-medium text-neutral-900 mb-4">Jobs Posted</h1>
            <p className="text-neutral-500 mb-8">Sign in to view jobs you've posted</p>
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

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-48 mb-8" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-neutral-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-medium text-neutral-900 mb-4">Something went wrong</h1>
            <p className="text-red-500 mb-8">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-8 py-12">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-neutral-900">Jobs Posted</h1>
              <p className="text-neutral-500 mt-1">
                Manage jobs you've posted
              </p>
            </div>
            <RainbowButton href="/post-job" size="sm">
              Post a new job
            </RainbowButton>
          </div>
        </div>

        {/* Empty state */}
        {jobs.length === 0 ? (
          <div className="bg-white border border-dashed border-neutral-300 rounded-xl px-12 py-20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-neutral-900 mb-2">No jobs posted yet</h2>
              <p className="text-neutral-500 mb-6">Post your first job to start hiring designers</p>
              <Link
                href="/post-job"
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white rounded-lg border border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[1px] transition-all"
              >
                Post a job
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => {
              const daysRemaining = getDaysRemaining(job.expires_at)
              const isExpired = daysRemaining <= 0
              // Determine sticky type: 24h = blue, 7d = purple
              const is7DaySticky = job.is_sticky && job.sticky_until && job.posted_at
                ? (new Date(job.sticky_until).getTime() - new Date(job.posted_at).getTime()) > 2 * 24 * 60 * 60 * 1000
                : false
              const stickyPinColor = is7DaySticky ? 'text-purple-500' : 'text-blue-500'

              return (
                <div
                  key={job.id}
                  className={`border rounded-xl p-5 relative transition-all ${
                    isExpired
                      ? 'bg-neutral-50 border-neutral-200 opacity-60'
                      : job.is_featured
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-neutral-200'
                  }`}
                >
                  {/* Left border indicator */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                      job.is_rainbow
                        ? ''
                        : job.is_featured
                          ? 'bg-amber-400'
                          : 'bg-green-500'
                    }`}
                    style={job.is_rainbow ? {
                      background: 'linear-gradient(180deg, #ec4899 0%, #8b5cf6 20%, #3b82f6 40%, #10b981 60%, #eab308 80%, #ec4899 100%)',
                      backgroundSize: '100% 300%',
                      animation: 'rainbowFlow 2s linear infinite'
                    } : {}}
                  />

                  <div className="flex gap-4 pl-1">
                    {/* Company Logo */}
                    <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img
                        src={job.company_logo || getCompanyLogoUrl(job.company)}
                        alt={job.company}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.parentElement!.innerHTML = `<span class="text-sm font-medium text-neutral-400">${getInitials(job.company)}</span>`
                        }}
                      />
                    </div>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      {/* Top row: Title + Days Left */}
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div>
                          <h3 className="text-lg font-normal text-neutral-900">{job.title}</h3>
                          <p className="text-sm text-neutral-500">{job.company} · {job.location}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {job.is_sticky && (
                            <svg className={`w-4 h-4 ${stickyPinColor}`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M16 4l4 4-1.5 1.5-1-1L14 12l1 5-3 3-2.5-5L5 19.5 4.5 19l4.5-4.5-5-2.5 3-3 5 1 3.5-3.5-1-1L16 4z"/>
                            </svg>
                          )}
                          {isExpired ? (
                            <span className="bg-neutral-200 text-neutral-600 text-[10px] font-medium tracking-wider px-2 py-0.5 rounded">
                              EXPIRED
                            </span>
                          ) : (
                            <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 rounded ${
                              daysRemaining <= 7
                                ? 'bg-red-100 text-red-600'
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {daysRemaining} DAYS LEFT
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Chips row */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {job.is_featured && (
                          <span className="bg-yellow-400 text-neutral-900 text-[11px] font-medium px-2 py-0.5 rounded border border-yellow-500">
                            Featured
                          </span>
                        )}
                        <span className="bg-white text-neutral-600 text-[11px] px-2 py-0.5 rounded border border-neutral-200">
                          {toTitleCase(job.job_type)}
                        </span>
                        {job.experience_level && (
                          <span className="bg-white text-neutral-600 text-[11px] px-2 py-0.5 rounded border border-neutral-200">
                            {toTitleCase(job.experience_level)}
                          </span>
                        )}
                        {job.skills && job.skills.slice(0, 3).map(skill => (
                          <span key={skill} className="bg-white text-neutral-600 text-[11px] px-2 py-0.5 rounded border border-neutral-200">
                            {skill}
                          </span>
                        ))}
                        {job.skills && job.skills.length > 3 && (
                          <div className="relative group/chips">
                            <span className="bg-white text-neutral-400 text-[11px] px-2 py-0.5 rounded border border-neutral-200 cursor-default group-hover/chips:border-neutral-300 group-hover/chips:text-neutral-500 transition-all">
                              +{job.skills.length - 3}
                            </span>
                            <div className="absolute left-0 bottom-full mb-1.5 z-20 opacity-0 invisible group-hover/chips:opacity-100 group-hover/chips:visible transition-all duration-150">
                              <div className="bg-neutral-100 border border-neutral-200 rounded-lg shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] p-2 flex flex-wrap gap-1.5 min-w-[200px] max-w-[300px]">
                                {job.skills.slice(3).map(skill => (
                                  <span key={skill} className="bg-white text-neutral-600 text-[11px] px-2 py-0.5 rounded border border-neutral-200">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-4">
                        <span>Posted {formatDate(job.posted_at)}</span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {job.views || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                          </svg>
                          {job.clicks || 0} clicks
                        </span>
                      </div>
                    </div>

                    {/* Actions - absolute bottom right */}
                    <div className="absolute bottom-5 right-5 flex items-center gap-2">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                          className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded border bg-white border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[1px] transition-all"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#737373">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>
                        {openMenuId === job.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] z-20 overflow-hidden">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null)
                                  handleDelete(job.id, job.title)
                                }}
                                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="px-3 py-1.5 text-xs font-medium text-neutral-600 bg-white rounded border border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[1px] transition-all"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
