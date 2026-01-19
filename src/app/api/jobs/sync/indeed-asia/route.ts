import { NextResponse } from 'next/server'
import { syncJobs } from '@/lib/sync-jobs'

interface IndeedJob {
  id: string
  title: string
  company_name: string
  location: string
  salary?: {
    min?: number
    max?: number
    type?: string
  }
  formatted_relative_time?: string
  link?: string
}

interface IndeedJobDetails {
  id: string
  title: string
  company_name: string
  location: string
  description?: string
  salary?: {
    min?: number
    max?: number
    type?: string
  }
  job_type?: string
  link?: string
}

interface NormalizedJob {
  title: string
  company: string
  company_logo?: string
  location: string
  salary_min?: number
  salary_max?: number
  salary_text?: string
  description?: string
  job_type?: string
  experience_level?: string
  skills: string[]
  apply_url: string
  external_id: string
  posted_at: string
}

const DESIGN_KEYWORDS = [
  'designer', 'design', 'ux', 'ui', 'graphic', 'visual', 'product design',
  'brand', 'creative', 'figma', 'sketch', 'adobe', 'motion', 'animation',
  'illustration', 'web design', 'app design', 'interaction'
]

function isDesignJob(title: string): boolean {
  const lower = title.toLowerCase()
  return DESIGN_KEYWORDS.some(kw => lower.includes(kw))
}

function extractSkills(description: string): string[] {
  const skillPatterns = [
    'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'after effects',
    'invision', 'principle', 'framer', 'protopie', 'zeplin', 'marvel',
    'html', 'css', 'javascript', 'react', 'vue', 'angular',
    'user research', 'usability testing', 'wireframing', 'prototyping',
    'design systems', 'typography', 'color theory', 'responsive design',
    'mobile design', 'web design', 'interaction design', 'motion design'
  ]

  const found: string[] = []
  const lower = description.toLowerCase()

  for (const skill of skillPatterns) {
    if (lower.includes(skill) && !found.includes(skill)) {
      found.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
    }
  }

  return found.slice(0, 10)
}

async function fetchIndeedAsiaJobs(): Promise<NormalizedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY

  if (!apiKey) {
    console.log('Indeed Asia: No RapidAPI key configured, skipping')
    return []
  }

  const fetchJobDetails = async (jobId: string, locality: string): Promise<IndeedJobDetails | null> => {
    try {
      const response = await fetch(
        `https://indeed12.p.rapidapi.com/job/${jobId}?locality=${locality}`,
        {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'indeed12.p.rapidapi.com'
          }
        }
      )
      if (!response.ok) return null
      return await response.json()
    } catch {
      return null
    }
  }

  try {
    const allJobs: NormalizedJob[] = []
    const seenIds = new Set<string>()

    // Asia-focused searches
    const searches = [
      // Philippines
      { query: 'remote designer', locality: 'ph', location: 'Philippines' },
      { query: 'remote UI UX designer', locality: 'ph', location: 'Philippines' },
      { query: 'remote graphic designer', locality: 'ph', location: 'Philippines' },
      { query: 'remote product designer', locality: 'ph', location: 'Philippines' },
      { query: 'figma designer remote', locality: 'ph', location: 'Philippines' },
      // Malaysia
      { query: 'remote designer', locality: 'my', location: 'Malaysia' },
      { query: 'remote UI UX designer', locality: 'my', location: 'Malaysia' },
      { query: 'remote graphic designer', locality: 'my', location: 'Malaysia' },
      // Singapore
      { query: 'remote designer', locality: 'sg', location: 'Singapore' },
      { query: 'remote UI UX designer', locality: 'sg', location: 'Singapore' },
      { query: 'remote product designer', locality: 'sg', location: 'Singapore' },
      // India
      { query: 'remote designer', locality: 'in', location: 'India' },
      { query: 'remote UI UX designer', locality: 'in', location: 'India' },
      { query: 'remote product designer', locality: 'in', location: 'India' },
      // Indonesia
      { query: 'remote designer', locality: 'id', location: 'Indonesia' },
      { query: 'remote UI UX designer', locality: 'id', location: 'Indonesia' },
      // Japan
      { query: 'remote designer', locality: 'jp', location: 'Japan' },
      { query: 'remote UI UX designer', locality: 'jp', location: 'Japan' },
      // Australia (APAC)
      { query: 'remote designer', locality: 'au', location: 'Australia' },
      { query: 'remote UI UX designer', locality: 'au', location: 'Australia' },
    ]

    for (const { query, locality, location } of searches) {
      try {
        const response = await fetch(
          `https://indeed12.p.rapidapi.com/jobs/search?query=${encodeURIComponent(query)}&location=remote&page_id=1&locality=${locality}&fromage=14&sort=date`,
          {
            headers: {
              'X-RapidAPI-Key': apiKey,
              'X-RapidAPI-Host': 'indeed12.p.rapidapi.com'
            }
          }
        )

        if (!response.ok) {
          console.error(`Indeed Asia API error for ${locality}/${query}:`, response.status)
          continue
        }

        const data = await response.json()
        const searchResults: IndeedJob[] = data.hits || data.jobs || []
        console.log(`Indeed ${location}: Found ${searchResults.length} results for "${query}"`)

        // Fetch details for each job (limit to avoid rate limits)
        for (const result of searchResults.slice(0, 8)) {
          if (seenIds.has(result.id)) continue
          seenIds.add(result.id)

          if (!isDesignJob(result.title)) continue

          const details = await fetchJobDetails(result.id, locality)

          const salary = details?.salary || result.salary || {}
          const salaryMin = typeof salary.min === 'number' && salary.min > 0 ? salary.min : undefined
          const salaryMax = typeof salary.max === 'number' && salary.max > 0 ? salary.max : undefined

          const jobLocation = result.location || location
          const finalLocation = jobLocation.toLowerCase().includes('remote')
            ? jobLocation
            : `${jobLocation} (Remote)`

          allJobs.push({
            title: result.title,
            company: result.company_name || 'Unknown',
            location: finalLocation,
            salary_min: salaryMin,
            salary_max: salaryMax,
            description: details?.description || '',
            job_type: details?.job_type?.toLowerCase() || 'full-time',
            skills: extractSkills(details?.description || ''),
            apply_url: result.link || details?.link || `https://indeed.com/viewjob?jk=${result.id}`,
            external_id: `indeed_asia_${result.id}`,
            posted_at: new Date().toISOString(),
          })
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (err) {
        console.error(`Indeed Asia error for ${location}:`, err)
      }
    }

    console.log(`Indeed Asia: Total ${allJobs.length} design jobs found`)
    return allJobs
  } catch (error) {
    console.error('Indeed Asia fetch error:', error)
    return []
  }
}

async function handleSync() {
  try {
    const jobs = await fetchIndeedAsiaJobs()
    const result = await syncJobs(jobs, 'indeed-asia')
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Indeed Asia sync error:', error)
    return NextResponse.json({ error: 'Failed to sync', details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return handleSync()
}

export async function POST() {
  return handleSync()
}
