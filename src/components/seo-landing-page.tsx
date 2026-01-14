import Link from 'next/link'
import { generateJobSlug } from '@/lib/slug'
import { jobTypePages, jobTypeSlugs, regionalPages, regionalSlugs } from '@/config/seo-pages'

// Helper functions
const getInitials = (company: string) => company.substring(0, 2).toUpperCase()

const getCompanyLogoUrl = (company: string): string => {
  const cleanName = company.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '')
  return `https://logo.clearbit.com/${cleanName}.com`
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

interface SEOLandingPageProps {
  h1: string
  intro: string
  jobs: any[]
  totalCount: number
  currentSlug: string
  pageType: 'jobType' | 'regional'
}

export function SEOLandingPage({ h1, intro, jobs, totalCount, currentSlug, pageType }: SEOLandingPageProps) {
  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-medium text-neutral-900 mb-4">
              {h1}
            </h1>
            <p className="text-lg text-neutral-600 mb-6">
              {intro}
            </p>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span className="font-medium text-neutral-900">{totalCount}</span>
              <span>jobs available</span>
            </div>
          </div>
        </div>

        {/* Job Listings */}
        <div className="space-y-4 mb-16">
          {jobs.length === 0 ? (
            <div className="border border-neutral-200 rounded-lg bg-white p-8 text-center">
              <p className="text-neutral-500">No jobs found yet. Check back soon!</p>
            </div>
          ) : (
            jobs.map((job) => {
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
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isNew ? 'bg-green-500' : 'bg-neutral-200'}`} />
                  <div className="flex gap-4 pl-3">
                    <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img
                        src={job.company_logo || getCompanyLogoUrl(job.company)}
                        alt={job.company}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className="text-lg font-normal text-neutral-900">{cleanJobTitle(job.title)}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isNew && (
                            <span className="bg-green-500 text-white text-[10px] font-medium tracking-wider px-2 py-0.5 rounded">
                              NEW
                            </span>
                          )}
                          <span className="text-sm text-neutral-400">{timeAgo}</span>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-500 mb-3">
                        {job.company} · {formatLocation(job.location)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {job.job_type && (
                          <span className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200">
                            {toTitleCase(job.job_type)}
                          </span>
                        )}
                        {salary && (
                          <span className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200">
                            {salary}
                          </span>
                        )}
                        {remote && (
                          <span className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200">
                            Remote
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* Related Pages - Internal Linking */}
        <div className="border-t border-neutral-200 pt-12">
          <h2 className="text-xl font-medium text-neutral-900 mb-6">Explore More Remote Design Jobs</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Job Type Pages */}
            <div>
              <h3 className="text-sm font-medium text-neutral-700 mb-3">By Specialty</h3>
              <div className="flex flex-wrap gap-2">
                {jobTypeSlugs.filter(slug => pageType !== 'jobType' || slug !== currentSlug).slice(0, 6).map(slug => {
                  const p = jobTypePages[slug]
                  return (
                    <Link
                      key={slug}
                      href={`/remote-${slug}-jobs`}
                      className="px-3 py-1.5 text-sm text-neutral-600 bg-white rounded-md border border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] transition-all"
                    >
                      {p.title.replace('Remote ', '').replace(' Jobs', '')}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Regional Pages */}
            <div>
              <h3 className="text-sm font-medium text-neutral-700 mb-3">By Region</h3>
              <div className="flex flex-wrap gap-2">
                {regionalSlugs.filter(slug => pageType !== 'regional' || slug !== currentSlug).slice(0, 6).map(slug => {
                  const p = regionalPages[slug]
                  return (
                    <Link
                      key={slug}
                      href={`/remote-design-jobs-${slug}`}
                      className="px-3 py-1.5 text-sm text-neutral-600 bg-white rounded-md border border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] transition-all"
                    >
                      {p.title.replace('Remote Design Jobs in ', '').replace('Worldwide Remote Design Jobs', 'Worldwide')}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
