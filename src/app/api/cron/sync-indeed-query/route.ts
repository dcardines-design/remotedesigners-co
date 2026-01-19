import { NextRequest, NextResponse } from 'next/server'
import { syncJobs } from '@/lib/sync-jobs'
import { NormalizedJob } from '@/lib/job-apis'

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds max for slow RapidAPI regions

// Query types for each region
const QUERY_TYPES = {
  ui: 'remote UI designer',
  ux: 'remote UX designer',
  product: 'remote product designer',
  graphic: 'remote graphic designer',
} as const

// Valid regions with their Indeed locality codes
const REGIONS = {
  us: 'us',
  ph: 'ph',
  ca: 'ca',
  gb: 'gb',
  au: 'au',
  in: 'in',
  sg: 'my', // Singapore uses Malaysia locality
  id: 'id',
} as const

type QueryType = keyof typeof QUERY_TYPES
type Region = keyof typeof REGIONS

// Design job filter
const DESIGN_KEYWORDS = [
  'designer', 'design', 'ux', 'ui', 'graphic', 'visual', 'product design',
  'brand', 'creative', 'art director', 'creative director'
]

function isDesignJob(title: string): boolean {
  const lowerTitle = title.toLowerCase()
  return DESIGN_KEYWORDS.some(keyword => lowerTitle.includes(keyword))
}

function extractSkills(text: string): string[] {
  const skillPatterns = [
    'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'after effects',
    'invision', 'principle', 'framer', 'webflow', 'css', 'html', 'javascript',
    'react', 'prototyping', 'wireframing', 'user research', 'usability testing'
  ]
  const lowerText = text.toLowerCase()
  return skillPatterns.filter(skill => lowerText.includes(skill))
}

function parseJobType(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('contract')) return 'contract'
  if (lower.includes('freelance')) return 'freelance'
  if (lower.includes('part-time') || lower.includes('part time')) return 'part-time'
  if (lower.includes('intern')) return 'internship'
  return 'full-time'
}

function parseExperienceLevel(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes('senior') || lower.includes('sr.') || lower.includes('lead')) return 'senior'
  if (lower.includes('junior') || lower.includes('jr.') || lower.includes('entry')) return 'entry'
  if (lower.includes('principal') || lower.includes('staff') || lower.includes('director')) return 'lead'
  return 'mid'
}

interface IndeedSearchResult {
  id: string
  title: string
  company_name: string
  location: string
  salary?: { min?: number; max?: number; type?: string }
  pub_date_ts_milli?: number
}

interface IndeedJobDetails {
  job_title?: string
  description?: string
  apply_url?: string
  indeed_final_url?: string
  location?: string
  job_type?: string
  salary?: { min?: number; max?: number; type?: string }
  company?: { name?: string; logo_url?: string }
}

async function fetchIndeedQuery(region: Region, queryType: QueryType): Promise<NormalizedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    console.log('Indeed: No RapidAPI key configured')
    return []
  }

  const locality = REGIONS[region]
  const query = QUERY_TYPES[queryType]
  const jobs: NormalizedJob[] = []
  const seenIds = new Set<string>()

  // Fetch job details helper with 20s timeout
  const fetchDetails = async (jobId: string): Promise<IndeedJobDetails | null> => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)

      const response = await fetch(
        `https://indeed12.p.rapidapi.com/job/${jobId}?locality=${locality}`,
        {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'indeed12.p.rapidapi.com'
          },
          signal: controller.signal
        }
      )
      clearTimeout(timeout)
      if (!response.ok) return null
      return await response.json()
    } catch {
      return null
    }
  }

  try {
    // Single search query with 25s timeout
    const searchController = new AbortController()
    const searchTimeout = setTimeout(() => searchController.abort(), 25000)

    const response = await fetch(
      `https://indeed12.p.rapidapi.com/jobs/search?query=${encodeURIComponent(query)}&location=remote&page_id=1&locality=${locality}&fromage=7&sort=date`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'indeed12.p.rapidapi.com'
        },
        signal: searchController.signal
      }
    )
    clearTimeout(searchTimeout)

    if (!response.ok) {
      console.error(`Indeed API error for ${region}/${queryType}:`, response.status)
      return []
    }

    const data = await response.json()
    const results: IndeedSearchResult[] = data.hits || data.jobs || []
    console.log(`Indeed ${region}/${queryType}: Found ${results.length} results`)

    // Fetch details for up to 2 jobs to stay within timeouts
    // Slow regions (PH, IN, ID) can take 15+ seconds per request
    for (const result of results.slice(0, 2)) {
      if (seenIds.has(result.id)) continue
      seenIds.add(result.id)

      if (!isDesignJob(result.title)) continue

      const details = await fetchDetails(result.id)
      if (!details) continue

      // Parse salary
      const salary = details.salary || result.salary || {}
      const salaryMin = typeof salary.min === 'number' && salary.min > 0 ? salary.min : undefined
      const salaryMax = typeof salary.max === 'number' && salary.max > 0 ? salary.max : undefined
      const salaryType = salary.type || ''
      const salaryText = salaryMin && salaryMax
        ? `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()} ${salaryType.toLowerCase()}`
        : undefined

      // Strip HTML from description
      const description = (details.description || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      // Company logo from Clearbit
      const companyName = details.company?.name || result.company_name
      const companyDomain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '').concat('.com')

      jobs.push({
        id: `indeed-${result.id}`,
        source: 'indeed' as const,
        title: details.job_title || result.title,
        company: companyName,
        company_logo: details.company?.logo_url || `https://logo.clearbit.com/${companyDomain}`,
        location: details.location || result.location || 'Remote',
        salary_min: salaryMin,
        salary_max: salaryMax,
        salary_text: salaryText,
        description,
        job_type: parseJobType(details.job_type || result.title),
        experience_level: parseExperienceLevel(details.job_title || result.title),
        skills: extractSkills(description),
        apply_url: details.apply_url || details.indeed_final_url || `https://www.indeed.com/viewjob?jk=${result.id}`,
        posted_at: result.pub_date_ts_milli
          ? new Date(result.pub_date_ts_milli).toISOString()
          : new Date().toISOString(),
        is_featured: false,
      })

      // Minimal delay between detail requests
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    return jobs
  } catch (error) {
    console.error(`Indeed ${region}/${queryType} error:`, error)
    return []
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get parameters
  const region = request.nextUrl.searchParams.get('region') as Region | null
  const type = request.nextUrl.searchParams.get('type') as QueryType | null

  // Validate
  if (!region || !REGIONS[region]) {
    return NextResponse.json({
      error: 'Invalid region',
      validRegions: Object.keys(REGIONS),
    }, { status: 400 })
  }

  if (!type || !QUERY_TYPES[type]) {
    return NextResponse.json({
      error: 'Invalid type',
      validTypes: Object.keys(QUERY_TYPES),
    }, { status: 400 })
  }

  try {
    const startTime = Date.now()
    const jobs = await fetchIndeedQuery(region, type)
    const result = await syncJobs(jobs, 'indeed')
    const duration = Date.now() - startTime

    console.log(`Indeed ${region}/${type}: ${result.inserted} inserted, ${result.skipped} skipped (${duration}ms)`)

    return NextResponse.json({
      success: true,
      region,
      type,
      query: QUERY_TYPES[type],
      duration: `${duration}ms`,
      ...result
    })
  } catch (error) {
    console.error(`Indeed ${region}/${type} sync error:`, error)
    return NextResponse.json({
      error: 'Sync failed',
      details: String(error)
    }, { status: 500 })
  }
}

// List all available endpoints
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const endpoints = []
  for (const region of Object.keys(REGIONS)) {
    for (const type of Object.keys(QUERY_TYPES)) {
      endpoints.push({
        region,
        type,
        url: `/api/cron/sync-indeed-query?region=${region}&type=${type}`
      })
    }
  }

  return NextResponse.json({
    message: 'Available Indeed sync endpoints for cron-job.org',
    total: endpoints.length,
    endpoints,
    cronJobOrgSetup: {
      method: 'GET',
      header: 'Authorization: Bearer YOUR_CRON_SECRET',
      schedule: 'Every 2-4 hours, staggered by 5 minutes per job'
    }
  })
}
