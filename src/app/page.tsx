'use client'

import { useState, useEffect, useCallback, useMemo, Suspense, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { generateJobSlug } from '@/lib/slug'

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Filter state interface
interface FilterState {
  search: string
  locations: string[]
  jobTypes: string[]
  experience: string
  salaryMin: string
  salaryMax: string
  datePosted: string
  remoteType: string
  skills: string[]
  featuredOnly: boolean
  newOnly: boolean
}

// Skills are now fetched dynamically from the database

const LOCATION_OPTIONS = [
  { value: 'worldwide', label: 'Anywhere in the World', emoji: '🌍' },
  { value: 'usa', label: 'United States', emoji: '🇺🇸' },
  { value: 'europe', label: 'Europe', emoji: '🇪🇺' },
  { value: 'north-america', label: 'North America', emoji: '🏈' },
  { value: 'latin-america', label: 'Latin America', emoji: '💃' },
  { value: 'asia', label: 'Asia', emoji: '⛩️' },
  { value: 'africa', label: 'Africa', emoji: '🌍' },
  { value: 'oceania', label: 'Oceania', emoji: '🌊' },
  { value: 'middle-east', label: 'Middle East', emoji: '🏜️' },
  { value: 'uk', label: 'United Kingdom', emoji: '🇬🇧' },
  { value: 'canada', label: 'Canada', emoji: '🇨🇦' },
  { value: 'germany', label: 'Germany', emoji: '🇩🇪' },
]

// Location search dropdown component
function LocationSearchDropdown({ locations, onToggle }: { locations: string[], onToggle: (loc: string) => void }) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredOptions = LOCATION_OPTIONS.filter(opt =>
    !locations.includes(opt.value) &&
    (opt.label.toLowerCase().includes(search.toLowerCase()) ||
     opt.value.toLowerCase().includes(search.toLowerCase()))
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (value: string) => {
    onToggle(value)
    setSearch('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-2">
      <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
        Location{locations.length > 0 && ` (${locations.length})`}
      </span>
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search regions..."
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2.5 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
          />
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center gap-2"
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {locations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {locations.map(loc => {
            const option = LOCATION_OPTIONS.find(o => o.value === loc)
            return (
              <button
                key={loc}
                onClick={() => onToggle(loc)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-neutral-900 text-white rounded-md border border-neutral-900 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[1px] active:shadow-none active:translate-y-[2px] transition-all"
              >
                {option?.emoji} {option?.label || loc}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface NormalizedJob {
  id: string
  source: string
  title: string
  company: string
  company_logo?: string
  location: string
  salary_min?: number
  salary_max?: number
  salary_text?: string
  description?: string
  job_type: string
  experience_level?: string
  skills?: string[]
  posted_at: string
  apply_url: string
  is_featured: boolean
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

// Helper functions
const getInitials = (company: string) => company.substring(0, 2).toUpperCase()

// Generate company logo URL using Clearbit
const getCompanyLogoUrl = (company: string): string => {
  // Clean company name and create domain guess
  const cleanName = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')  // Remove special chars
    .replace(/\s+/g, '')        // Remove spaces
  return `https://logo.clearbit.com/${cleanName}.com`
}

const toTitleCase = (str: string) =>
  str.toLowerCase().replace(/(?:^|[\s-])\w/g, match => match.toUpperCase())

const cleanJobTitle = (title: string): string => {
  // Remove "for a position of" prefix
  let cleaned = title.replace(/^for a position of\s+/i, '')

  // Remove location suffix like "in Nashville, TN" or "in New York"
  cleaned = cleaned.replace(/\s+in\s+[A-Za-z\s,]+(?:,\s*[A-Z]{2})?$/i, '')

  // Remove other common prefixes
  cleaned = cleaned.replace(/^looking for\s+(?:a\s+)?/i, '')
  cleaned = cleaned.replace(/^hiring\s+(?:a\s+)?/i, '')
  cleaned = cleaned.replace(/^seeking\s+(?:a\s+)?/i, '')

  return cleaned.trim()
}

const getDaysAgo = (posted_at: string) => {
  const diff = Date.now() - new Date(posted_at).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const isNewJob = (posted_at: string) => getDaysAgo(posted_at) <= 2

const formatSalary = (job: NormalizedJob): string | null => {
  if (job.salary_text) return job.salary_text
  if (job.salary_min && job.salary_max) {
    return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
  }
  if (job.salary_min) return `$${job.salary_min.toLocaleString()}+`
  if (job.salary_max) return `Up to $${job.salary_max.toLocaleString()}`
  return null
}

const isRemoteJob = (location: string) => location.toLowerCase().includes('remote')

const formatLocation = (location: string): string => {
  // If short enough, return as-is
  if (location.length <= 40) return location

  const isRemote = location.toLowerCase().includes('remote')

  // Handle "City, ST" patterns (US format) - split by ", or" or "; "
  if (location.includes(', or ') || location.includes(' or Remote')) {
    const beforeOr = location.split(/,?\s+or\s+/i)[0]
    // Count US-style locations (City, ST)
    const usCities = beforeOr.match(/[A-Za-z\s]+,\s*[A-Z]{2}/g) || []
    if (usCities.length > 0) {
      if (usCities.length === 1) {
        return isRemote ? `${usCities[0]} · Remote` : usCities[0]
      }
      return isRemote
        ? `${usCities[0]} +${usCities.length - 1} more · Remote`
        : `${usCities[0]} +${usCities.length - 1} more`
    }
  }

  // Handle semicolon-separated locations like "Ireland (Remote); Netherlands (Remote)"
  if (location.includes(';')) {
    const parts = location.split(';').map(p => p.trim()).filter(Boolean)
    const allRemote = parts.every(p => p.toLowerCase().includes('remote'))
    const countries = parts.map(p => p.replace(/\s*\(Remote\)/gi, '').trim())

    if (countries.length <= 2) {
      return allRemote ? `${countries.join(', ')} · Remote` : countries.join(', ')
    }

    const displayed = countries.slice(0, 2).join(', ')
    const remaining = countries.length - 2
    return allRemote
      ? `${displayed} +${remaining} more · Remote`
      : `${displayed} +${remaining} more`
  }

  // Fallback: truncate long strings
  if (location.length > 50) {
    const truncated = location.substring(0, 40).replace(/,?\s*$/, '')
    return isRemote ? `${truncated}... · Remote` : `${truncated}...`
  }

  return location
}

const formatTimeAgo = (posted_at: string): string => {
  const diff = Date.now() - new Date(posted_at).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

// Inner component that uses useSearchParams
function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [jobs, setJobs] = useState<NormalizedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [availableSkills, setAvailableSkills] = useState<{ skill: string; count: number }[]>([])

  // Initialize filters from URL
  // Collapsible filter sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    quickFilters: true,
    jobType: true,
    workType: true,
    experience: false,
    datePosted: false,
    salary: false,
    skills: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const [filters, setFilters] = useState<FilterState>(() => ({
    search: searchParams.get('search') || '',
    locations: searchParams.getAll('location'),
    jobTypes: searchParams.getAll('type'),
    experience: searchParams.get('experience') || '',
    salaryMin: searchParams.get('salary_min') || '',
    salaryMax: searchParams.get('salary_max') || '',
    datePosted: searchParams.get('date_posted') || 'all',
    remoteType: searchParams.get('remote_type') || '',
    skills: searchParams.getAll('skill'),
    featuredOnly: searchParams.get('featured') === 'true',
    newOnly: searchParams.get('new') === 'true',
  }))

  // Debounce filters for API calls
  const debouncedFilters = useDebounce(filters, 300)

  // Sync filters to URL
  const updateURL = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams()

    if (newFilters.search) params.set('search', newFilters.search)
    newFilters.locations.forEach(l => params.append('location', l))
    newFilters.jobTypes.forEach(t => params.append('type', t))
    if (newFilters.experience) params.set('experience', newFilters.experience)
    if (newFilters.salaryMin) params.set('salary_min', newFilters.salaryMin)
    if (newFilters.salaryMax) params.set('salary_max', newFilters.salaryMax)
    if (newFilters.datePosted && newFilters.datePosted !== 'all') params.set('date_posted', newFilters.datePosted)
    if (newFilters.remoteType) params.set('remote_type', newFilters.remoteType)
    newFilters.skills.forEach(s => params.append('skill', s))
    if (newFilters.featuredOnly) params.set('featured', 'true')
    if (newFilters.newOnly) params.set('new', 'true')

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [router, pathname])

  const fetchJobs = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      const params = new URLSearchParams()
      if (debouncedFilters.search) params.set('search', debouncedFilters.search)
      if (debouncedFilters.locations.length) params.set('location', debouncedFilters.locations.join(','))
      if (debouncedFilters.jobTypes.length === 1) params.set('type', debouncedFilters.jobTypes[0])
      if (debouncedFilters.experience) params.set('experience', debouncedFilters.experience)
      if (debouncedFilters.salaryMin) params.set('salary_min', debouncedFilters.salaryMin)
      if (debouncedFilters.salaryMax) params.set('salary_max', debouncedFilters.salaryMax)
      if (debouncedFilters.datePosted && debouncedFilters.datePosted !== 'all') params.set('date_posted', debouncedFilters.datePosted)
      if (debouncedFilters.remoteType) params.set('remote_type', debouncedFilters.remoteType)
      if (debouncedFilters.skills.length) params.set('skills', debouncedFilters.skills.join(','))
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/jobs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch jobs')

      const data = await res.json()

      let filteredJobs = data.jobs as NormalizedJob[]

      // Client-side filters
      if (debouncedFilters.newOnly) {
        filteredJobs = filteredJobs.filter(job => isNewJob(job.posted_at))
      }
      if (debouncedFilters.featuredOnly) {
        filteredJobs = filteredJobs.filter(job => job.is_featured)
      }

      setJobs(prev => append ? [...prev, ...filteredJobs] : filteredJobs)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [debouncedFilters])

  // Fetch when debounced filters change
  useEffect(() => {
    fetchJobs(1, false)
    updateURL(filters)
  }, [debouncedFilters])

  // Fetch available skills on mount
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await fetch('/api/skills')
        if (res.ok) {
          const data = await res.json()
          setAvailableSkills(data.skills || [])
        }
      } catch (err) {
        console.error('Failed to fetch skills:', err)
      }
    }
    fetchSkills()
  }, [])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.locations.length) count++
    if (filters.jobTypes.length) count++
    if (filters.experience) count++
    if (filters.salaryMin || filters.salaryMax) count++
    if (filters.datePosted && filters.datePosted !== 'all') count++
    if (filters.remoteType) count++
    if (filters.skills.length) count++
    if (filters.featuredOnly) count++
    if (filters.newOnly) count++
    return count
  }, [filters])

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleJobType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter(t => t !== type)
        : [...prev.jobTypes, type]
    }))
  }

  const toggleLocation = (location: string) => {
    setFilters(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    }))
  }

  const toggleSkill = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      locations: [],
      jobTypes: [],
      experience: '',
      salaryMin: '',
      salaryMax: '',
      datePosted: 'all',
      remoteType: '',
      skills: [],
      featuredOnly: false,
      newOnly: false,
    })
  }

  const loadMore = () => {
    if (pagination && pagination.hasMore) {
      fetchJobs(pagination.page + 1, true)
    }
  }

  const newJobsCount = jobs.filter(j => isNewJob(j.posted_at)).length

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Hero Section */}
        <div className="mb-16 relative">
          {/* Background Image */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen -mt-40 max-h-[480px] overflow-hidden pointer-events-none">
            <img
              src="/hero-bg.png"
              alt=""
              className="w-full h-auto opacity-[0.15]"
            />
            {/* Fade overlay - gradient from transparent to background color (bottom only) */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0) 60%, rgba(250,250,250,1) 100%)' }}
            />
          </div>

          <div className="max-w-2xl mx-auto text-center relative z-10">
            <div className="flex items-center justify-center gap-2 mb-10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-glow" />
              <span className="text-sm text-neutral-500">
                {pagination?.total || 0} designer jobs posted
              </span>
            </div>

            <h1 className="text-6xl font-medium text-neutral-900 leading-tight mb-6">
              The{' '}
              <span
                className="bg-clip-text text-transparent animate-gradient"
                style={{ backgroundImage: 'linear-gradient(135deg, #22c55e 0%, #f97316 50%, #ea580c 100%)' }}
              >
                Best and Latest
              </span>
              <br />
              Remote Design Jobs
            </h1>

            <p className="text-lg text-neutral-500 mb-10 leading-relaxed">
              Browse thousands of remote design jobs from top companies worldwide. Updated daily with the freshest opportunities in UI, UX, product design, and more.
            </p>

            <div
              className="relative inline-block p-[1px] rounded-[7.5px] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.3),0px_1px_2px_0px_rgba(0,0,0,0.1)] hover:translate-y-[1px] hover:shadow-[0px_3px_0px_0px_rgba(0,0,0,0.3),0px_1px_2px_0px_rgba(0,0,0,0.1)] active:translate-y-[2px] active:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.3)] transition-all"
              style={{ backgroundImage: 'linear-gradient(135deg, #00C939 0%, #FF8C00 33%, #FF6467 66%, #FF64F2 100%)' }}
            >
              <button
                className="relative px-6 py-3 rounded-[6.5px] font-normal text-base text-white"
                style={{ backgroundImage: 'linear-gradient(135deg, #3b3b3b 0%, #1a1a1a 100%)' }}
              >
                Post a job for $299
              </button>
            </div>
          </div>
        </div>

        {/* Job Count */}
        <div className="flex items-center gap-2 mb-6 text-base">
          <span className="text-neutral-900">{pagination?.total || 0} designer jobs</span>
          <span className="text-neutral-500">·</span>
          <span className="text-neutral-500">{newJobsCount} new</span>
        </div>

        {/* Main Content - Jobs + Filters */}
        <div className="flex gap-8">
          {/* Job Listings */}
          <div className="flex-1 space-y-4">
            {/* Post a Job Card */}
            <Link href="/post-job" className="block border border-neutral-200 rounded-lg bg-neutral-50/20 p-8 hover:border-neutral-300 transition-colors relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-400/40 rounded-l-lg" />
              <div className="text-center text-neutral-500">
                <p className="text-2xl mb-1">+</p>
                <p className="text-base">post a job</p>
              </div>
            </Link>

            {/* Loading State */}
            {loading && (
              <>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="border border-neutral-200 rounded-lg bg-white/10 p-5 relative overflow-hidden animate-pulse">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-200 rounded-l-lg" />
                    <div className="flex gap-4 pl-4">
                      <div className="w-12 h-12 rounded-full bg-neutral-200" />
                      <div className="flex-1">
                        <div className="h-5 bg-neutral-200 rounded w-3/4 mb-3" />
                        <div className="h-4 bg-neutral-200 rounded w-1/2 mb-3" />
                        <div className="flex gap-2">
                          <div className="h-6 bg-neutral-200 rounded w-20" />
                          <div className="h-6 bg-neutral-200 rounded w-24" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="border border-red-200 rounded-lg bg-red-50 p-8 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => fetchJobs(1, false)}
                  className="text-red-600 underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* No Results */}
            {!loading && !error && jobs.length === 0 && (
              <div className="border border-neutral-200 rounded-lg bg-white p-8 text-center">
                <p className="text-neutral-500">No jobs found matching your criteria</p>
              </div>
            )}

            {/* Job Cards */}
            {!loading && jobs.map(job => {
              const isNew = isNewJob(job.posted_at)
              const salary = formatSalary(job)
              const remote = isRemoteJob(job.location)
              const timeAgo = formatTimeAgo(job.posted_at)

              return (
                <Link
                  key={job.id}
                  href={`/jobs/${generateJobSlug(job.title, job.company, job.id)}`}
                  className="block border border-neutral-200 rounded-xl bg-white p-5 relative overflow-hidden hover:border-neutral-300 hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08),0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-all duration-200 cursor-pointer"
                >
                  {/* Left border indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isNew ? 'bg-green-500' : 'bg-neutral-200'}`} />

                  <div className="flex gap-4 pl-3">
                    {/* Company Avatar */}
                    <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className="text-lg font-normal text-neutral-900">{cleanJobTitle(job.title)}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isNew && (
                            <span className="bg-green-500 text-white text-xs font-medium px-2.5 py-1 rounded">
                              NEW
                            </span>
                          )}
                          <span className="text-sm text-neutral-400">{timeAgo}</span>
                        </div>
                      </div>

                      <p className="text-sm text-neutral-500 mb-3">
                        {job.company} · {formatLocation(job.location)}
                      </p>

                      <div className="flex items-end justify-between gap-4">
                        <div className="flex flex-wrap gap-2 max-w-[70%]">
                          {job.is_featured && (
                            <a
                              href="/?featured=true"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-yellow-400 text-neutral-900 text-xs font-medium px-2.5 py-1 rounded border border-yellow-500 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                            >
                              Featured
                            </a>
                          )}
                          {job.job_type && (
                            <a
                              href={`/?type=${job.job_type.toLowerCase()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                            >
                              {toTitleCase(job.job_type)}
                            </a>
                          )}
                          {job.experience_level && (
                            <a
                              href={`/?experience=${job.experience_level.toLowerCase()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                            >
                              {toTitleCase(job.experience_level)}
                            </a>
                          )}
                          {salary && (
                            <span className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 cursor-default">
                              {salary}
                            </span>
                          )}
                          {remote && (
                            <a
                              href="/?remote_type=remote"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                            >
                              Remote
                            </a>
                          )}
                          {job.skills && job.skills.slice(0, 3).map((skill, index) => (
                            <a
                              key={index}
                              href={`/?skill=${encodeURIComponent(skill)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                            >
                              {toTitleCase(skill)}
                            </a>
                          ))}
                        </div>
                        <a
                          href={job.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded border border-white/10 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-[2px] active:shadow-none transition-all"
                          style={{ backgroundImage: 'linear-gradient(165deg, #3a3a3a 0%, #1a1a1a 100%)' }}
                        >
                          Apply
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Load More Button */}
            {!loading && jobs.length > 0 && pagination?.hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full border border-neutral-200 rounded-lg bg-white p-4 text-center text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load more jobs'}
              </button>
            )}
          </div>

          {/* Filters Sidebar */}
          <div className="w-72 flex-shrink-0 hidden md:block">
            <div className="sticky top-24 bg-neutral-100 border border-neutral-200 rounded-lg max-h-[calc(100vh-12rem)] flex flex-col">
              {/* Filter Header - Fixed */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
                <span className="text-sm font-medium text-neutral-900">Filter jobs</span>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                    >
                      Clear ({activeFilterCount})
                    </button>
                  )}
                  <div className="flex items-center">
                    <button
                      onClick={() => setExpandedSections({
                        quickFilters: true,
                        jobType: true,
                        workType: true,
                        experience: true,
                        datePosted: true,
                        salary: true,
                        skills: true,
                      })}
                      className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                      title="Expand all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setExpandedSections({
                        quickFilters: false,
                        jobType: false,
                        workType: false,
                        experience: false,
                        datePosted: false,
                        salary: false,
                        skills: false,
                      })}
                      className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                      title="Collapse all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M15 15v4.5m0-4.5h4.5m-4.5 0 5.25 5.25" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Filter Content */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-lg px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                />
              </div>

              {/* Location */}
              <LocationSearchDropdown
                locations={filters.locations}
                onToggle={toggleLocation}
              />

              {/* Quick Filters */}
              <div>
                <button
                  onClick={() => toggleSection('quickFilters')}
                  className="flex items-center justify-between w-full py-1 group"
                >
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600">
                    Quick Filters{(filters.featuredOnly || filters.newOnly) && ` (${(filters.featuredOnly ? 1 : 0) + (filters.newOnly ? 1 : 0)})`}
                  </span>
                  <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expandedSections.quickFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.quickFilters && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => handleFilterChange('featuredOnly', !filters.featuredOnly)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                        filters.featuredOnly
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                      }`}
                    >
                      Featured
                    </button>
                    <button
                      onClick={() => handleFilterChange('newOnly', !filters.newOnly)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                        filters.newOnly
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                      }`}
                    >
                      New
                    </button>
                  </div>
                )}
              </div>

              {/* Job Type */}
              <div>
                <button
                  onClick={() => toggleSection('jobType')}
                  className="flex items-center justify-between w-full py-1 group"
                >
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600">
                    Job Type{filters.jobTypes.length > 0 && ` (${filters.jobTypes.length})`}
                  </span>
                  <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expandedSections.jobType ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.jobType && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {['full-time', 'contract', 'part-time', 'freelance', 'internship'].map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleJobType(type)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-all capitalize ${
                          filters.jobTypes.includes(type)
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                        }`}
                      >
                        {type.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Type */}
              <div>
                <button
                  onClick={() => toggleSection('workType')}
                  className="flex items-center justify-between w-full py-1 group"
                >
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600">
                    Work Type{filters.remoteType && ` (1)`}
                  </span>
                  <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expandedSections.workType ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.workType && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      { value: '', label: 'All' },
                      { value: 'remote', label: 'Remote' },
                      { value: 'hybrid', label: 'Hybrid' },
                      { value: 'onsite', label: 'On-site' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange('remoteType', filters.remoteType === option.value ? '' : option.value)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                          filters.remoteType === option.value
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Experience Level */}
              <div>
                <button
                  onClick={() => toggleSection('experience')}
                  className="flex items-center justify-between w-full py-1 group"
                >
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600">
                    Experience{filters.experience && ` (1)`}
                  </span>
                  <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expandedSections.experience ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.experience && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      { value: '', label: 'All' },
                      { value: 'entry', label: 'Entry' },
                      { value: 'mid', label: 'Mid' },
                      { value: 'senior', label: 'Senior' },
                      { value: 'lead', label: 'Lead' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange('experience', filters.experience === option.value ? '' : option.value)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                          filters.experience === option.value
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Posted */}
              <div>
                <button
                  onClick={() => toggleSection('datePosted')}
                  className="flex items-center justify-between w-full py-1 group"
                >
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600">
                    Date Posted{filters.datePosted && filters.datePosted !== 'all' && ` (1)`}
                  </span>
                  <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expandedSections.datePosted ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.datePosted && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      { value: 'all', label: 'Any time' },
                      { value: '1d', label: '24h' },
                      { value: '7d', label: '7 days' },
                      { value: '30d', label: '30 days' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange('datePosted', option.value)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                          filters.datePosted === option.value
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Salary Range */}
              <div>
                <button
                  onClick={() => toggleSection('salary')}
                  className="flex items-center justify-between w-full py-1 group"
                >
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600">
                    Salary Range{(filters.salaryMin || filters.salaryMax) && ` (${(filters.salaryMin ? 1 : 0) + (filters.salaryMax ? 1 : 0)})`}
                  </span>
                  <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expandedSections.salary ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.salary && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.salaryMin}
                        onChange={e => handleFilterChange('salaryMin', e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                      />
                      <span className="text-neutral-400">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.salaryMax}
                        onChange={e => handleFilterChange('salaryMax', e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                      />
                    </div>
                    <p className="text-xs text-neutral-400">Annual salary in USD</p>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div>
                <button
                  onClick={() => toggleSection('skills')}
                  className="flex items-center justify-between w-full py-1 group"
                >
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600">
                    Skills{filters.skills.length > 0 && ` (${filters.skills.length})`}
                  </span>
                  <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expandedSections.skills ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.skills && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {availableSkills.length === 0 ? (
                      <span className="text-xs text-neutral-400">Loading skills...</span>
                    ) : (
                      availableSkills.map(({ skill, count }) => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                            filters.skills.includes(skill)
                              ? 'bg-neutral-900 text-white border-neutral-900'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                          }`}
                          title={`${count} jobs`}
                        >
                          {skill}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main export with Suspense wrapper for useSearchParams
export default function Home() {
  return (
    <Suspense fallback={
      <div className="bg-neutral-50 min-h-screen flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
