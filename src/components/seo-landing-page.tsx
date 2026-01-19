'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { generateJobSlug } from '@/lib/slug'
import { HeroBackground } from './hero-background'
import { JobCard } from './job-card'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { FREE_JOBS_LIMIT } from '@/lib/stripe'
import { isCompMember } from '@/lib/admin'
import { toast } from 'sonner'
import { useSignupModal } from '@/context/signup-modal-context'

// Helper functions
const getInitials = (company: string) => company.substring(0, 2).toUpperCase()

const getCompanyLogoUrl = (company: string): string => {
  const cleanName = company.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '')
  return `https://logo.clearbit.com/${cleanName}.com`
}

const getGoogleFaviconUrl = (company: string): string => {
  const cleanName = company.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '')
  return `https://www.google.com/s2/favicons?domain=${cleanName}.com&sz=128`
}

// Company logo component with fallback
function CompanyLogo({ company, companyLogo }: { company: string; companyLogo?: string }) {
  const [imgSrc, setImgSrc] = useState(companyLogo || getCompanyLogoUrl(company))
  const [fallbackAttempted, setFallbackAttempted] = useState(false)
  const [showInitials, setShowInitials] = useState(false)

  const handleError = () => {
    if (!fallbackAttempted) {
      setFallbackAttempted(true)
      setImgSrc(getGoogleFaviconUrl(company))
    } else {
      setShowInitials(true)
    }
  }

  if (showInitials) {
    return (
      <span className="text-sm font-medium text-neutral-400">
        {getInitials(company)}
      </span>
    )
  }

  return (
    <img
      src={imgSrc}
      alt={company}
      className="w-full h-full object-contain"
      onError={handleError}
    />
  )
}

const toTitleCase = (str: string) =>
  str.toLowerCase().replace(/(?:^|[\s-])\w/g, match => match.toUpperCase())

const formatSalary = (job: any): string | null => {
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
  if (location.length <= 40) return location
  const isRemote = location.toLowerCase().includes('remote')
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

const isNewJob = (posted_at: string) => {
  const diff = Date.now() - new Date(posted_at).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24)) <= 2
}

const cleanJobTitle = (title: string): string => {
  let cleaned = title.replace(/^for a position of\s+/i, '')
  cleaned = cleaned.replace(/\s+in\s+[A-Za-z\s,]+(?:,\s*[A-Z]{2})?$/i, '')
  return cleaned.trim()
}

interface FAQ {
  question: string
  answer: string
}

function FAQSection({ faqs }: { faqs: FAQ[] }) {
  const [openFaq, setOpenFaq] = useState<number>(0)

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-medium text-neutral-900 mb-6 md:mb-8">Frequently Asked Questions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 items-start">
        {faqs.map((faq, index) => {
          const isOpen = openFaq === index
          return (
            <button
              key={index}
              onClick={() => setOpenFaq(isOpen ? -1 : index)}
              className="w-full border-t border-neutral-200 hover:bg-neutral-100/50 transition-colors duration-150 py-4 px-2 md:px-0 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-900">{faq.question}</span>
                <div className={`w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="transition-transform duration-150"
                  >
                    <path
                      d="M3 7H11"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M7 3V11"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      className={`origin-center transition-transform duration-150 ${isOpen ? 'scale-y-0' : 'scale-y-100'}`}
                    />
                  </svg>
                </div>
              </div>
              <div
                className={`grid transition-all duration-150 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <p className="text-neutral-600 pr-12" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Available job types and regions for drill-down chips
const allJobTypes = ['ui-ux-design', 'product-design', 'graphic-design', 'motion-design', 'brand-design', 'web-design']
const allRegions = ['usa', 'europe', 'uk', 'canada', 'asia', 'worldwide']

// For regional pages: show all job types. For job type pages: show all regions.
const availableCombinations: Record<string, string[]> = {
  // Regional pages get all job types
  ...Object.fromEntries(allRegions.map(r => [r, allJobTypes])),
  // Job type pages get all regions
  ...Object.fromEntries(allJobTypes.map(j => [j, allRegions])),
}

const jobTypeLabels: Record<string, string> = {
  'ui-ux-design': 'UI/UX Design',
  'product-design': 'Product Design',
  'graphic-design': 'Graphic Design',
  'motion-design': 'Motion Design',
  'brand-design': 'Brand Design',
  'web-design': 'Web Design',
}

const regionLabels: Record<string, string> = {
  'usa': 'USA',
  'europe': 'Europe',
  'uk': 'UK',
  'canada': 'Canada',
  'asia': 'Asia',
  'worldwide': 'Worldwide',
}

interface SEOLandingPageProps {
  h1: string
  intro: string
  jobs: any[]
  totalCount: number
  currentSlug: string
  pageType: 'jobType' | 'regional' | 'experienceLevel' | 'employmentType'
  faqs?: FAQ[]
  breadcrumbLabel: string
  parentPage?: { label: string; href: string }
}

export function SEOLandingPage({ h1, intro, jobs, totalCount, currentSlug, pageType, faqs, breadcrumbLabel, parentPage }: SEOLandingPageProps) {
  const router = useRouter()
  const { openLoginModal } = useSignupModal()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [savingJobs, setSavingJobs] = useState<Set<string>>(new Set())
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check subscription status and fetch saved jobs
  useEffect(() => {
    const checkSubscriptionAndSavedJobs = async () => {
      const supabase = createBrowserSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setIsAuthenticated(true)

        // Comp member bypass
        if (isCompMember(user.email)) {
          setIsSubscribed(true)
        } else {
          // Check subscription status
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()

          setIsSubscribed(!!subscription)
        }

        // Fetch saved jobs
        const { data: saved } = await supabase
          .from('saved_jobs')
          .select('job_id')
          .eq('user_id', user.id)

        if (saved) {
          setSavedJobs(new Set(saved.map(s => s.job_id)))
        }
      }
    }
    checkSubscriptionAndSavedJobs()
  }, [])

  const handleSaveJob = async (e: React.MouseEvent, jobId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      openLoginModal()
      return
    }

    setSavingJobs(prev => new Set(prev).add(jobId))

    try {
      const supabase = createBrowserSupabaseClient()
      const isSaved = savedJobs.has(jobId)

      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('job_id', jobId)

        if (error) throw error

        setSavedJobs(prev => {
          const next = new Set(prev)
          next.delete(jobId)
          return next
        })
        toast.success('Job removed from saved')
      } else {
        // Save
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { error } = await supabase
          .from('saved_jobs')
          .insert({ user_id: user.id, job_id: jobId, status: 'saved' })

        if (error) throw error

        setSavedJobs(prev => new Set(prev).add(jobId))
        toast.success('Job saved!')
      }
    } catch (error) {
      console.error('Error saving job:', error)
      toast.error('Failed to save job')
    } finally {
      setSavingJobs(prev => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  return (
    <div className="bg-neutral-50 min-h-screen relative">
      <HeroBackground />

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-16 pb-4 md:pb-8 relative z-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-neutral-500">
            <li>
              <Link href="/" className="hover:text-neutral-900 transition-colors">
                Home
              </Link>
            </li>
            <li className="text-neutral-300">/</li>
            {parentPage ? (
              <>
                <li>
                  <Link href={parentPage.href} className="hover:text-neutral-900 transition-colors">
                    {parentPage.label}
                  </Link>
                </li>
                <li className="text-neutral-300">/</li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/" className="hover:text-neutral-900 transition-colors">
                    Remote Design Jobs
                  </Link>
                </li>
                <li className="text-neutral-300">/</li>
              </>
            )}
            <li className="text-neutral-900 font-medium">
              {breadcrumbLabel}
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <div className="mb-12">
          <div className="max-w-2xl">
            <h1 className="text-2xl md:text-4xl font-medium text-neutral-900 mb-4 tracking-tight">
              {h1}
            </h1>
            <p className="text-lg text-neutral-600 mb-6">
              {intro}
            </p>
          </div>
        </div>

        {/* Jobs count and Filter Chips Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4">
          {availableCombinations[currentSlug] && availableCombinations[currentSlug].length > 0 && (
            <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 order-first">
              <span className="text-sm text-neutral-500 md:mr-1">
                {pageType === 'regional' ? 'Filter by specialty' : 'Filter by location'}
              </span>
              <div className="flex flex-wrap items-center gap-2">
              {pageType === 'regional' ? (
                // Show job type chips on regional pages
                availableCombinations[currentSlug].map((jobTypeSlug) => (
                  <Link
                    key={jobTypeSlug}
                    href={`/remote-${jobTypeSlug}-jobs-${currentSlug}`}
                    className="bg-white text-neutral-600 text-sm px-4 py-2 rounded-md border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                  >
                    {jobTypeLabels[jobTypeSlug] || jobTypeSlug}
                  </Link>
                ))
              ) : (
                // Show region chips on job type pages
                availableCombinations[currentSlug].map((regionSlug) => (
                  <Link
                    key={regionSlug}
                    href={`/remote-${currentSlug}-jobs-${regionSlug}`}
                    className="bg-white text-neutral-600 text-sm px-4 py-2 rounded-md border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                  >
                    {regionLabels[regionSlug] || regionSlug}
                  </Link>
                ))
              )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-neutral-500 order-last">
            <span className="font-medium text-neutral-900">{totalCount}</span>
            <span>jobs available</span>
          </div>
        </div>

        {/* Job Listings */}
        <div className="space-y-4 mb-16">
          {jobs.length === 0 ? (
            <div className="border border-neutral-200 rounded-lg bg-white p-8 text-center">
              <p className="text-neutral-500">No jobs found yet. Check back soon!</p>
            </div>
          ) : (
            jobs.map((job, index) => {
              const isLocked = !isSubscribed && index >= FREE_JOBS_LIMIT

              // Locked job card with paywall
              if (isLocked) {
                const salary = formatSalary(job)
                const timeAgo = formatTimeAgo(job.posted_at)

                return (
                  <div
                    key={job.id}
                    onClick={() => {
                      router.push(`/membership?skip_url=${encodeURIComponent(window.location.href)}`)
                    }}
                    className="block border rounded-xl p-5 relative cursor-pointer bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08),0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-all duration-200"
                  >
                    {/* Left border indicator */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-neutral-200" />

                    {/* 10% visible, rest blurred with gradient fade */}
                    <div className="relative flex gap-4 pl-3 select-none pointer-events-none">
                      {/* Company Avatar - blurred */}
                      <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden blur-[3px]">
                        <img
                          src={job.company_logo || getCompanyLogoUrl(job.company)}
                          alt={job.company}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            if (!target.dataset.triedFallback) {
                              target.dataset.triedFallback = 'true'
                              target.src = getGoogleFaviconUrl(job.company)
                            } else {
                              target.style.display = 'none'
                              target.parentElement!.innerHTML = `<span class="text-sm font-medium text-neutral-400">${getInitials(job.company)}</span>`
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <h3 className="text-lg font-normal text-neutral-900">{cleanJobTitle(job.title)}</h3>
                          <span className="text-sm text-neutral-400">{timeAgo}</span>
                        </div>
                        <p className="text-sm text-neutral-500 mb-3">{job.company} · {formatLocation(job.location)}</p>
                        <div className="flex gap-2">
                          <span className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200">
                            {toTitleCase(job.job_type || 'Full-time')}
                          </span>
                          {salary && (
                            <span className="bg-neutral-100 text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200">
                              {salary}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* White gradient overlay - 0% to 100% white */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)'
                        }}
                      />
                    </div>

                    {/* Lock overlay */}
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-t from-white/90 via-white/60 to-transparent">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-neutral-200 shadow-sm">
                        <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-sm font-medium text-neutral-900">Subscribe to view</span>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <JobCard
                  key={job.id}
                  job={job}
                  showActions={true}
                  onSave={handleSaveJob}
                  isSaved={savedJobs.has(job.id)}
                  isSaving={savingJobs.has(job.id)}
                  isSubscribed={isSubscribed}
                />
              )
            })
          )}
        </div>

        {/* FAQ Section */}
        {faqs && faqs.length > 0 && (
          <FAQSection faqs={faqs} />
        )}
      </div>
    </div>
  )
}
