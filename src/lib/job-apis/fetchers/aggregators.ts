// Job aggregator APIs - Remotive, RemoteOK, Arbeitnow, JSearch

import type { NormalizedJob } from '../types'
import { isDesignJob, filterSkills, extractSkills, parseExperienceLevel, parseJobType, getClearbitLogo } from '../utils'

// ============ REMOTIVE API ============
// Docs: https://remotive.com/api/remote-jobs (no auth needed)

interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  company_logo: string
  category: string
  job_type: string
  publication_date: string
  candidate_required_location: string
  salary: string
  description: string
  tags: string[]
}

export async function fetchRemotiveJobs(): Promise<NormalizedJob[]> {
  try {
    const response = await fetch('https://remotive.com/api/remote-jobs?category=design')

    if (!response.ok) {
      console.error('Remotive API error:', response.status)
      return []
    }

    const data = await response.json()
    const jobs: RemotiveJob[] = data.jobs || []

    return jobs.map(job => ({
      id: `remotive-${job.id}`,
      source: 'remotive' as const,
      title: job.title,
      company: job.company_name,
      company_logo: job.company_logo || undefined,
      location: job.candidate_required_location || 'Remote',
      salary_text: job.salary || undefined,
      description: job.description,
      job_type: job.job_type?.toLowerCase() || 'full-time',
      experience_level: parseExperienceLevel(job.title),
      skills: filterSkills([...new Set([...job.tags, ...extractSkills(job.description)])]),
      apply_url: job.url,
      posted_at: job.publication_date,
      is_featured: false,
    }))
  } catch (error) {
    console.error('Remotive fetch error:', error)
    return []
  }
}

// ============ REMOTEOK API ============
// Docs: https://remoteok.com/api (no auth needed)

interface RemoteOKJob {
  id: string
  slug: string
  company: string
  company_logo: string
  position: string
  tags: string[]
  location: string
  salary_min: number
  salary_max: number
  date: string
  description: string
  url: string
}

export async function fetchRemoteOKJobs(): Promise<NormalizedJob[]> {
  try {
    const response = await fetch('https://remoteok.com/api?tag=design', {
      headers: {
        'User-Agent': 'RemoteDesigners.co Job Aggregator'
      }
    })

    if (!response.ok) {
      console.error('RemoteOK API error:', response.status)
      return []
    }

    const data = await response.json()
    // First item is legal notice, rest are jobs
    const jobs: RemoteOKJob[] = Array.isArray(data) ? data.slice(1) : []

    return jobs
      .filter(job => job.position && isDesignJob(job.position, job.tags))
      .map(job => ({
        id: `remoteok-${job.id}`,
        source: 'remoteok' as const,
        title: job.position,
        company: job.company,
        company_logo: job.company_logo || undefined,
        location: job.location || 'Remote',
        salary_min: job.salary_min || undefined,
        salary_max: job.salary_max || undefined,
        description: job.description || '',
        job_type: 'full-time',
        experience_level: parseExperienceLevel(job.position),
        skills: filterSkills([...new Set([...(job.tags || []), ...extractSkills(job.description || '')])]),
        apply_url: job.url || `https://remoteok.com/l/${job.slug}`,
        posted_at: job.date,
        is_featured: false,
      }))
  } catch (error) {
    console.error('RemoteOK fetch error:', error)
    return []
  }
}

// ============ ARBEITNOW API ============
// Docs: https://arbeitnow.com/api (no auth needed)

interface ArbeitnowJob {
  slug: string
  company_name: string
  title: string
  description: string
  remote: boolean
  url: string
  tags: string[]
  job_types: string[]
  location: string
  created_at: number
}

export async function fetchArbeitnowJobs(): Promise<NormalizedJob[]> {
  try {
    const response = await fetch('https://arbeitnow.com/api/job-board-api')

    if (!response.ok) {
      console.error('Arbeitnow API error:', response.status)
      return []
    }

    const data = await response.json()
    const jobs: ArbeitnowJob[] = data.data || []

    return jobs
      .filter(job => job.remote && isDesignJob(job.title, job.tags))
      .map(job => ({
        id: `arbeitnow-${job.slug}`,
        source: 'arbeitnow' as const,
        title: job.title,
        company: job.company_name,
        company_logo: getClearbitLogo(job.company_name),
        location: job.location || 'Remote (EU)',
        description: job.description,
        job_type: job.job_types?.[0]?.toLowerCase() || 'full-time',
        experience_level: parseExperienceLevel(job.title),
        skills: filterSkills([...new Set([...(job.tags || []), ...extractSkills(job.description)])]),
        apply_url: job.url,
        posted_at: new Date(job.created_at * 1000).toISOString(),
        is_featured: false,
      }))
  } catch (error) {
    console.error('Arbeitnow fetch error:', error)
    return []
  }
}

// ============ JSEARCH API (RapidAPI) ============
// Docs: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
// Free tier: 500 requests/month

interface JSearchJob {
  job_id: string
  employer_name: string
  employer_logo: string
  job_title: string
  job_description: string
  job_city: string
  job_country: string
  job_employment_type: string
  job_min_salary: number
  job_max_salary: number
  job_apply_link: string
  job_posted_at_datetime_utc: string
  job_required_skills: string[]
  job_is_remote: boolean
}

export async function fetchJSearchJobs(): Promise<NormalizedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY

  if (!apiKey) {
    console.log('JSearch: No RapidAPI key configured, skipping')
    return []
  }

  try {
    const queries = ['remote designer', 'remote UI UX designer', 'remote product designer']
    const allJobs: NormalizedJob[] = []

    for (const query of queries) {
      const response = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&remote_jobs_only=true`,
        {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
          }
        }
      )

      if (!response.ok) {
        console.error('JSearch API error:', response.status)
        continue
      }

      const data = await response.json()
      const jobs: JSearchJob[] = data.data || []

      const normalized = jobs
        .filter(job => job.job_is_remote && isDesignJob(job.job_title, job.job_required_skills))
        .map(job => ({
          id: `jsearch-${job.job_id}`,
          source: 'jsearch' as const,
          title: job.job_title,
          company: job.employer_name,
          company_logo: job.employer_logo || undefined,
          location: job.job_city ? `Remote (${job.job_city}, ${job.job_country})` : 'Remote',
          salary_min: job.job_min_salary || undefined,
          salary_max: job.job_max_salary || undefined,
          description: job.job_description,
          job_type: job.job_employment_type?.toLowerCase() || 'full-time',
          experience_level: parseExperienceLevel(job.job_title),
          skills: filterSkills([...new Set([...(job.job_required_skills || []), ...extractSkills(job.job_description)])]),
          apply_url: job.job_apply_link,
          posted_at: job.job_posted_at_datetime_utc,
          is_featured: false,
        }))

      allJobs.push(...normalized)
    }

    // Deduplicate by title + company
    const seen = new Set<string>()
    return allJobs.filter(job => {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  } catch (error) {
    console.error('JSearch fetch error:', error)
    return []
  }
}
