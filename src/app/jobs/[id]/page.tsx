import { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import { extractIdFromSlug } from '@/lib/slug'
import JobDetailClient from './JobDetailClient'

const BASE_URL = 'https://remotedesigners.co'

interface Job {
  id: string
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
  apply_url: string
  source: string
  external_id?: string
  posted_at: string
  is_featured: boolean
  is_active: boolean
  is_sticky?: boolean
  sticky_until?: string
  is_rainbow?: boolean
}

async function getJob(slug: string): Promise<Job | null> {
  const supabase = createServerSupabaseClient()
  const jobId = extractIdFromSlug(slug)

  if (!jobId) return null

  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, company, company_logo, location, salary_min, salary_max, salary_text, description, job_type, experience_level, skills, apply_url, source, external_id, posted_at, is_featured, is_active, is_sticky, sticky_until, is_rainbow')
    .eq('id', jobId)
    .single()

  if (error || !data) return null
  return data as Job
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const job = await getJob(id)

  if (!job) {
    return {
      title: 'Job Not Found',
      description: 'This job listing is no longer available.',
    }
  }

  const title = `${job.title} at ${job.company} - Remote Design Job`
  const description = job.description
    ? job.description.slice(0, 160).replace(/<[^>]*>/g, '') + '...'
    : `${job.title} position at ${job.company}. ${job.location}. Apply now on RemoteDesigners.co`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${BASE_URL}/jobs/${id}`,
      siteName: 'RemoteDesigners.co',
      images: job.company_logo ? [{ url: job.company_logo, alt: job.company }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: job.company_logo ? [job.company_logo] : undefined,
    },
    alternates: {
      canonical: `${BASE_URL}/jobs/${id}`,
    },
  }
}

function parseLocation(location: string) {
  const isRemote = location.toLowerCase().includes('remote')
  const loc = location.replace(/\s*\(?remote\)?\s*/gi, '').trim()

  let country = 'US'
  if (loc.toLowerCase().includes('uk') || loc.toLowerCase().includes('united kingdom')) country = 'GB'
  else if (loc.toLowerCase().includes('canada')) country = 'CA'
  else if (loc.toLowerCase().includes('germany')) country = 'DE'
  else if (loc.toLowerCase().includes('australia')) country = 'AU'
  else if (loc.toLowerCase().includes('france')) country = 'FR'
  else if (loc.toLowerCase().includes('spain')) country = 'ES'
  else if (loc.toLowerCase().includes('netherlands')) country = 'NL'
  else if (loc.toLowerCase().includes('ireland')) country = 'IE'
  else if (loc.toLowerCase().includes('worldwide') || loc.toLowerCase().includes('anywhere')) country = ''

  return { isRemote, locality: loc || location, country }
}

function generateJobPostingSchema(job: Job) {
  const locationInfo = parseLocation(job.location)
  const postedDate = new Date(job.posted_at)
  const validThrough = new Date(postedDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || `${job.title} position at ${job.company}`,
    datePosted: job.posted_at,
    validThrough: validThrough,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      ...(job.company_logo && { logo: job.company_logo }),
    },
    employmentType: job.job_type?.toUpperCase().replace('-', '_') || 'FULL_TIME',
  }

  if (locationInfo.isRemote) {
    jsonLd.jobLocationType = 'TELECOMMUTE'
    if (locationInfo.country) {
      jsonLd.applicantLocationRequirements = {
        '@type': 'Country',
        name: locationInfo.country,
      }
    }
  }

  jsonLd.jobLocation = {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressLocality: locationInfo.locality || 'Remote',
      addressRegion: locationInfo.locality || 'Remote',
      addressCountry: locationInfo.country || 'US',
    },
  }

  if (job.salary_min || job.salary_max) {
    jsonLd.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: {
        '@type': 'QuantitativeValue',
        ...(job.salary_min && { minValue: job.salary_min }),
        ...(job.salary_max && { maxValue: job.salary_max }),
        ...(!job.salary_min && job.salary_max && { value: job.salary_max }),
        ...(!job.salary_max && job.salary_min && { value: job.salary_min }),
        unitText: 'YEAR',
      },
    }
  }

  return jsonLd
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getJob(id)

  const jsonLd = job ? generateJobPostingSchema(job) : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <JobDetailClient initialJob={job} error={job ? undefined : 'Job not found'} />
    </>
  )
}
