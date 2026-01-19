// JustRemote Playwright Scraper
// Scrapes remote design jobs from justremote.co/remote-design-jobs

import { chromium, Browser, Page } from 'playwright'
import { NormalizedJob } from '@/lib/job-apis'

interface JustRemoteJob {
  title: string
  url: string
  company: string
  jobType: string
  postedDate: string
}

function parseJobType(text?: string): string {
  if (!text) return 'full-time'
  const lower = text.toLowerCase()
  if (lower.includes('contract')) return 'contract'
  if (lower.includes('part-time')) return 'part-time'
  if (lower.includes('freelance')) return 'freelance'
  return 'full-time'
}

function parseExperienceLevel(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes('senior') || lower.includes('sr.') || lower.includes('lead')) return 'senior'
  if (lower.includes('principal') || lower.includes('staff') || lower.includes('head') || lower.includes('director')) return 'lead'
  if (lower.includes('junior') || lower.includes('jr.') || lower.includes('entry') || lower.includes('associate')) return 'entry'
  return 'mid'
}

interface JobDetails {
  description: string
  directApplyUrl?: string
}

async function fetchJobDetails(page: Page, url: string): Promise<JobDetails> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })

    const result = await page.evaluate((): JobDetails => {
      // Find direct apply link - look for "Apply" button/link that goes to external site
      let directApplyUrl: string | undefined
      const applyLinks = document.querySelectorAll('a')
      for (const link of applyLinks) {
        const text = link.textContent?.trim().toLowerCase() || ''
        const href = link.getAttribute('href')
        if ((text.includes('apply') || text === 'apply now' || text === 'apply for this job') &&
            href && !href.includes('justremote.co') &&
            (href.startsWith('http') || href.startsWith('//'))) {
          directApplyUrl = href.startsWith('//') ? 'https:' + href : href
          break
        }
      }

      // Look for main job description content
      const selectors = [
        '.job-description',
        '[class*="description"]',
        'article',
        '.prose',
        'main'
      ]

      let description = ''
      for (const selector of selectors) {
        const el = document.querySelector(selector)
        if (el && el.textContent && el.textContent.length > 200) {
          description = el.textContent.trim().slice(0, 15000)
          break
        }
      }

      if (!description) {
        // Fallback: get all paragraph text
        const paragraphs = document.querySelectorAll('p')
        let text = ''
        paragraphs.forEach(p => {
          text += p.textContent?.trim() + '\n'
        })
        description = text.slice(0, 15000)
      }

      return { description, directApplyUrl }
    })

    return result
  } catch (error) {
    console.error(`Failed to fetch details for ${url}:`, error)
    return { description: '' }
  }
}

export async function scrapeJustRemoteJobs(): Promise<NormalizedJob[]> {
  let browser: Browser | null = null

  try {
    console.log('Launching browser for JustRemote scrape...')

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    const page = await context.newPage()

    console.log('Navigating to JustRemote design jobs...')
    await page.goto('https://justremote.co/remote-design-jobs', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    // Wait for job cards to load
    await page.waitForSelector('a[href*="remote-design-jobs/"]', { timeout: 10000 })

    const rawJobs = await page.evaluate((): JustRemoteJob[] => {
      const jobs: JustRemoteJob[] = []

      // Find job links that go to detail pages
      const jobLinks = document.querySelectorAll('a[href*="remote-design-jobs/"]')
      const processedUrls = new Set<string>()

      jobLinks.forEach(link => {
        const href = link.getAttribute('href')
        if (!href || href === '/remote-design-jobs' || href === 'remote-design-jobs') return
        if (processedUrls.has(href)) return
        processedUrls.add(href)

        // Get container
        const container = link.closest('div')?.parentElement

        // Get title from h3
        const titleEl = link.querySelector('h3')
        const title = titleEl?.textContent?.trim()
        if (!title) return

        // Get company - first div inside link usually
        const companyEl = link.querySelector('div')
        let company = companyEl?.textContent?.trim() || ''
        // Clean up company name (remove title if concatenated)
        if (company.includes(title)) {
          company = company.replace(title, '').trim()
        }

        // Get job type and date from sibling divs
        const metaContainer = link.nextElementSibling || container
        const allText = metaContainer?.textContent || ''

        const jobType = allText.includes('contract') ? 'contract' : 'permanent'
        const dateMatch = allText.match(/\d{1,2}\s+\w{3}/)
        const postedDate = dateMatch?.[0] || ''

        jobs.push({
          title,
          url: href.startsWith('/') ? href : `/${href}`,
          company,
          jobType,
          postedDate
        })
      })

      return jobs
    })

    console.log(`JustRemote: found ${rawJobs.length} jobs, fetching descriptions...`)

    // Limit to 20 jobs to avoid timeout
    const jobsToProcess = rawJobs.slice(0, 20)
    const normalizedJobs: NormalizedJob[] = []

    for (const job of jobsToProcess) {
      const fullUrl = `https://justremote.co${job.url}`
      const jobDetails = await fetchJobDetails(page, fullUrl)
      const jobSlug = job.url.split('/').filter(Boolean).pop() || job.title

      // Use direct apply URL if found, otherwise fall back to JustRemote page
      const applyUrl = jobDetails.directApplyUrl || fullUrl

      normalizedJobs.push({
        id: `justremote-${jobSlug}`,
        source: 'justremote' as any,
        title: job.title,
        company: job.company || 'Unknown Company',
        location: 'Remote',
        description: jobDetails.description || `${job.title} at ${job.company}. Remote ${job.jobType} position.`,
        job_type: parseJobType(job.jobType),
        experience_level: parseExperienceLevel(job.title),
        skills: [],
        apply_url: applyUrl,
        posted_at: new Date().toISOString(),
        is_featured: false
      })

      // Rate limit
      await page.waitForTimeout(500)
    }

    console.log(`JustRemote scrape complete: ${normalizedJobs.length} jobs with descriptions`)
    return normalizedJobs

  } catch (error) {
    console.error('JustRemote scrape error:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Quick scrape without descriptions (faster)
export async function scrapeJustRemoteJobsQuick(): Promise<NormalizedJob[]> {
  let browser: Browser | null = null

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.goto('https://justremote.co/remote-design-jobs', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    await page.waitForSelector('a[href*="remote-design-jobs/"]', { timeout: 10000 })

    const rawJobs = await page.evaluate((): JustRemoteJob[] => {
      const jobs: JustRemoteJob[] = []
      const jobLinks = document.querySelectorAll('a[href*="remote-design-jobs/"]')
      const processedUrls = new Set<string>()

      jobLinks.forEach(link => {
        const href = link.getAttribute('href')
        if (!href || href === '/remote-design-jobs' || href === 'remote-design-jobs') return
        if (processedUrls.has(href)) return
        processedUrls.add(href)

        const titleEl = link.querySelector('h3')
        const title = titleEl?.textContent?.trim()
        if (!title) return

        const companyEl = link.querySelector('div')
        let company = companyEl?.textContent?.trim() || ''
        if (company.includes(title)) company = company.replace(title, '').trim()

        const metaContainer = link.nextElementSibling
        const allText = metaContainer?.textContent || ''
        const jobType = allText.includes('contract') ? 'contract' : 'permanent'

        jobs.push({
          title,
          url: href.startsWith('/') ? href : `/${href}`,
          company,
          jobType,
          postedDate: ''
        })
      })

      return jobs
    })

    return rawJobs.map(job => {
      const jobSlug = job.url.split('/').filter(Boolean).pop() || job.title
      return {
        id: `justremote-${jobSlug}`,
        source: 'justremote' as any,
        title: job.title,
        company: job.company || 'Unknown Company',
        location: 'Remote',
        description: `${job.title} at ${job.company}. Remote ${job.jobType} position.`,
        job_type: parseJobType(job.jobType),
        experience_level: parseExperienceLevel(job.title),
        skills: [],
        apply_url: `https://justremote.co${job.url}`,
        posted_at: new Date().toISOString(),
        is_featured: false
      }
    })

  } finally {
    if (browser) await browser.close()
  }
}
