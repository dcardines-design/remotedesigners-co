// Indeed Jobs API (RapidAPI)
// Docs: https://rapidapi.com/letscrape-6bRBa3QguO5/api/indeed12

import type { NormalizedJob, IndeedJobDetails } from '../types'
import { isDesignJob, filterSkills, extractSkills, parseExperienceLevel, parseJobType, stripHtml, getClearbitLogo } from '../utils'

interface IndeedSearchResult {
  id: string
  title: string
  company_name: string
  location: string
  pub_date_ts_milli?: number
}

export async function fetchIndeedJobs(): Promise<NormalizedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY

  if (!apiKey) {
    console.log('Indeed: No RapidAPI key configured, skipping')
    return []
  }

  // Helper to fetch job details
  const fetchJobDetails = async (jobId: string): Promise<IndeedJobDetails | null> => {
    try {
      const response = await fetch(
        `https://indeed12.p.rapidapi.com/job/${jobId}?locality=us`,
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

    // Design job search queries with localities
    const searches = [
      // US remote design jobs
      { query: 'remote UI designer', locality: 'us' },
      { query: 'remote UX designer', locality: 'us' },
      { query: 'remote product designer', locality: 'us' },
      { query: 'remote graphic designer', locality: 'us' },
      // Philippines remote design jobs
      { query: 'remote UI designer', locality: 'ph' },
      { query: 'remote UX designer', locality: 'ph' },
      { query: 'remote product designer', locality: 'ph' },
      { query: 'remote graphic designer', locality: 'ph' },
      { query: 'remote web designer', locality: 'ph' },
      { query: 'figma designer remote', locality: 'ph' },
    ]

    for (const { query, locality } of searches) {
      const response = await fetch(
        `https://indeed12.p.rapidapi.com/jobs/search?query=${encodeURIComponent(query)}&location=remote&page_id=1&locality=${locality}&fromage=7&sort=date`,
        {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'indeed12.p.rapidapi.com'
          }
        }
      )

      if (!response.ok) {
        console.error(`Indeed API error for ${locality}/${query}:`, response.status)
        continue
      }

      const data = await response.json()
      const searchResults: IndeedSearchResult[] = data.hits || data.jobs || []
      console.log(`Indeed ${locality}: Found ${searchResults.length} results for "${query}"`)

      // Fetch details for each job (limit to avoid rate limits)
      for (const result of searchResults.slice(0, 5)) {
        if (seenIds.has(result.id)) continue
        seenIds.add(result.id)

        // Skip if not a design job based on title
        if (!isDesignJob(result.title, [])) continue

        const details = await fetchJobDetails(result.id)
        if (!details) continue

        // Parse salary from details
        const salary = details.salary || {}
        const salaryMin = typeof salary.min === 'number' && salary.min > 0 ? salary.min : undefined
        const salaryMax = typeof salary.max === 'number' && salary.max > 0 ? salary.max : undefined
        const salaryType = salary.type || ''
        const salaryText = salaryMin && salaryMax
          ? `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()} ${salaryType.toLowerCase()}`
          : undefined

        // Strip HTML from description
        const description = stripHtml(details.description || '')

        // Try to get company logo from Clearbit (free tier)
        const companyName = details.company?.name || result.company_name
        const clearbitLogo = getClearbitLogo(companyName)

        allJobs.push({
          id: `indeed-${result.id}`,
          source: 'indeed' as const,
          title: details.job_title || result.title,
          company: companyName,
          company_logo: details.company?.logo_url || clearbitLogo,
          location: details.location || result.location || 'Remote',
          salary_min: salaryMin,
          salary_max: salaryMax,
          salary_text: salaryText,
          description: description,
          job_type: parseJobType(details.job_type || result.title),
          experience_level: parseExperienceLevel(details.job_title || result.title),
          skills: filterSkills(extractSkills(description)),
          apply_url: details.apply_url || details.indeed_final_url || `https://www.indeed.com/viewjob?jk=${result.id}`,
          posted_at: result.pub_date_ts_milli
            ? new Date(result.pub_date_ts_milli).toISOString()
            : new Date().toISOString(),
          is_featured: false,
        })

        // Rate limiting between detail requests
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // Rate limiting between search queries
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`Indeed: Fetched ${allJobs.length} jobs with details`)

    // Deduplicate by title + company
    const seen = new Set<string>()
    return allJobs.filter(job => {
      const key = `${job.title.slice(0, 30).toLowerCase()}-${job.company.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  } catch (error) {
    console.error('Indeed fetch error:', error)
    return []
  }
}
