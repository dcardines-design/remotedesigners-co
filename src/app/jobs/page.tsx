'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, DollarSign, Clock, Loader2, ExternalLink, RefreshCw, Zap } from 'lucide-react'
import { AutoApplyModal } from '@/components/AutoApplyModal'

interface Job {
  id: string
  source: string
  title: string
  company: string
  company_logo?: string
  location: string
  salary_min?: number
  salary_max?: number
  salary_text?: string
  description: string
  job_type: string
  experience_level?: string
  skills: string[]
  apply_url: string
  posted_at: string
  is_featured: boolean
}

interface JobsResponse {
  jobs: Job[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  sources: {
    remotive: number
    remoteok: number
    arbeitnow: number
    jsearch: number
  }
  lastUpdated: string
}

const experienceLevels = [
  { value: 'all', label: 'All Levels' },
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
]

const jobTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
]

const sourceColors: Record<string, string> = {
  remotive: 'bg-purple-100 text-purple-700',
  remoteok: 'bg-green-100 text-green-700',
  arbeitnow: 'bg-blue-100 text-blue-700',
  jsearch: 'bg-orange-100 text-orange-700',
  himalayas: 'bg-teal-100 text-teal-700',
  jobicy: 'bg-pink-100 text-pink-700',
  weworkremotely: 'bg-yellow-100 text-yellow-700',
  dribbble: 'bg-rose-100 text-rose-700',
  authenticjobs: 'bg-indigo-100 text-indigo-700',
  workingnomads: 'bg-cyan-100 text-cyan-700',
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return `${Math.floor(seconds / 604800)}w ago`
}

function formatSalary(job: Job): string | null {
  if (job.salary_text) return job.salary_text
  if (job.salary_min && job.salary_max) {
    return `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
  }
  if (job.salary_min) return `$${(job.salary_min / 1000).toFixed(0)}k+`
  return null
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<JobsResponse['pagination'] | null>(null)
  const [sources, setSources] = useState<JobsResponse['sources'] | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [experience, setExperience] = useState('all')
  const [jobType, setJobType] = useState('all')
  const [page, setPage] = useState(1)

  // Auto-apply modal
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isAutoApplyOpen, setIsAutoApplyOpen] = useState(false)

  const fetchJobs = async (
    options: { isRefresh?: boolean; currentPage?: number; currentSearch?: string; currentExperience?: string; currentJobType?: string } = {}
  ) => {
    const {
      isRefresh = false,
      currentPage = page,
      currentSearch = search,
      currentExperience = experience,
      currentJobType = jobType
    } = options

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const params = new URLSearchParams()
      if (currentSearch) params.set('search', currentSearch)
      if (currentExperience !== 'all') params.set('experience', currentExperience)
      if (currentJobType !== 'all') params.set('type', currentJobType)
      params.set('page', currentPage.toString())
      params.set('limit', '10') // Lower limit for better pagination

      const response = await fetch(`/api/jobs?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }

      const data: JobsResponse = await response.json()
      setJobs(data.jobs)
      setPagination(data.pagination)
      setSources(data.sources)
      setLastUpdated(data.lastUpdated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshJobs = async () => {
    try {
      setRefreshing(true)
      await fetch('/api/jobs', { method: 'POST' })
      await fetchJobs({ isRefresh: true })
    } catch (err) {
      console.error('Refresh error:', err)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchJobs({ currentPage: page, currentExperience: experience, currentJobType: jobType })
  }, [page, experience, jobType])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchJobs({ currentPage: 1, currentSearch: search })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, company, or skill..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={experience}
              onChange={(e) => { setExperience(e.target.value); setPage(1) }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {experienceLevels.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
            <select
              value={jobType}
              onChange={(e) => { setJobType(e.target.value); setPage(1) }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {jobTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              Search
            </button>
          </form>

          {/* Source Stats */}
          {sources && (
            <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
              <span className="text-gray-500">Sources:</span>
              {sources.remotive > 0 && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                  Remotive ({sources.remotive})
                </span>
              )}
              {sources.remoteok > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  RemoteOK ({sources.remoteok})
                </span>
              )}
              {sources.arbeitnow > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  Arbeitnow ({sources.arbeitnow})
                </span>
              )}
              {sources.jsearch > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                  JSearch ({sources.jsearch})
                </span>
              )}
              <button
                onClick={refreshJobs}
                disabled={refreshing}
                className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Jobs List */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">Remote Design Jobs</h1>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading remote design jobs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => fetchJobs()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No jobs found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {pagination?.total} remote design jobs
                {lastUpdated && (
                  <span className="text-gray-400 text-sm ml-2">
                    · Updated {timeAgo(lastUpdated)}
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-primary-200 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Company Logo */}
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {job.company_logo ? (
                        <img
                          src={job.company_logo}
                          alt={job.company}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <span className="text-xl font-bold text-gray-400">
                          {job.company[0]}
                        </span>
                      )}
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${sourceColors[job.source] || 'bg-gray-100 text-gray-700'}`}>
                              {job.source}
                            </span>
                            <span className="text-xs text-gray-400">{timeAgo(job.posted_at)}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.title}
                          </h3>
                          <p className="text-gray-600">{job.company}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setSelectedJob(job)
                              setIsAutoApplyOpen(true)
                            }}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                            title="Auto Apply with AI"
                          >
                            <Zap className="w-4 h-4" />
                            Auto Apply
                          </button>
                          <a
                            href={job.apply_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Apply
                          </a>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                        {formatSalary(job) && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatSalary(job)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.job_type}
                        </span>
                        {job.experience_level && (
                          <span className="capitalize px-2.5 py-1 bg-white text-neutral-600 text-xs rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-default">
                            {job.experience_level}
                          </span>
                        )}
                      </div>

                      {/* Skills */}
                      {job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {job.skills.slice(0, 6).map((skill) => (
                            <span
                              key={skill}
                              className="px-2.5 py-1 text-xs bg-white text-neutral-600 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-default"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 6 && (
                            <span className="px-2.5 py-1 text-xs text-neutral-400">
                              +{job.skills.length - 6} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

      {/* Auto Apply Modal */}
      {selectedJob && (
        <AutoApplyModal
          job={selectedJob}
          isOpen={isAutoApplyOpen}
          onClose={() => {
            setIsAutoApplyOpen(false)
            setSelectedJob(null)
          }}
        />
      )}
    </div>
  )
}
