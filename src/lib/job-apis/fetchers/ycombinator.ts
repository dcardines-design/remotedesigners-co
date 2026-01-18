// Y Combinator Jobs (via Hacker News API)
// Official HN Jobs API - https://github.com/HackerNews/API

import type { NormalizedJob } from '../types'
import { isDesignJob, filterSkills, extractSkills, parseExperienceLevel, parseJobType, stripHtml, getClearbitLogo } from '../utils'

interface HNJobItem {
  id: number
  title: string
  url?: string
  text?: string  // HTML description
  by: string     // Company/poster
  time: number   // Unix timestamp
  type: 'job'
}

export async function fetchYCombinatorJobs(): Promise<NormalizedJob[]> {
  try {
    // Fetch job story IDs from HN
    const idsResponse = await fetch('https://hacker-news.firebaseio.com/v0/jobstories.json')
    if (!idsResponse.ok) {
      console.error('HN Jobs API error:', idsResponse.status)
      return []
    }

    const jobIds: number[] = await idsResponse.json()
    console.log(`YCombinator: Found ${jobIds.length} job postings on HN`)

    const allJobs: NormalizedJob[] = []

    // Fetch details for each job (limit to 30 most recent)
    for (const jobId of jobIds.slice(0, 30)) {
      try {
        const itemResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${jobId}.json`)
        if (!itemResponse.ok) continue

        const item: HNJobItem = await itemResponse.json()
        if (!item || item.type !== 'job') continue

        // Extract company name from title (usually "Company (YC Batch) is hiring...")
        const titleMatch = item.title.match(/^([^(]+?)(?:\s*\([^)]*\))?\s+(?:is hiring|Is Hiring|hiring)/i)
        const company = titleMatch ? titleMatch[1].trim() : item.by

        // Skip if not a design job
        const description = item.text ? stripHtml(item.text) : ''

        if (!isDesignJob(item.title, [], description)) continue

        // Generate Clearbit logo URL
        const logoUrl = getClearbitLogo(company)

        allJobs.push({
          id: `ycombinator-${item.id}`,
          source: 'ycombinator' as const,
          title: item.title,
          company: company,
          company_logo: logoUrl,
          location: 'Remote', // Most YC jobs are remote-friendly
          description: description,
          job_type: parseJobType(item.title),
          experience_level: parseExperienceLevel(item.title),
          skills: filterSkills(extractSkills(description)),
          apply_url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
          posted_at: new Date(item.time * 1000).toISOString(),
          is_featured: false,
        })

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch {
        continue
      }
    }

    console.log(`YCombinator: Fetched ${allJobs.length} design jobs from HN`)

    // Deduplicate by title + company
    const seen = new Set<string>()
    return allJobs.filter(job => {
      const key = `${job.title.slice(0, 30).toLowerCase()}-${job.company.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  } catch (error) {
    console.error('YCombinator fetch error:', error)
    return []
  }
}
