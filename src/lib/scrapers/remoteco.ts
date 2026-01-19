// Remote.co Puppeteer Scraper with Stealth
// Scrapes remote design jobs from remote.co/remote-jobs/design/

import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { Browser, Page } from 'puppeteer'
import { NormalizedJob } from '@/lib/job-apis'

// Add stealth plugin
puppeteer.use(StealthPlugin())

interface RemoteCoJob {
  title: string
  url: string
  company: string
  location: string
  salary?: string
  jobType?: string
  remoteType?: string
}

function parseSalary(salaryText?: string): { min?: number; max?: number; text?: string } {
  if (!salaryText) return {}

  // Format: "$105,393 - $126,512 Annually" or "$51 Hourly"
  const annualMatch = salaryText.match(/\$([\d,]+)\s*-\s*\$([\d,]+)\s*Annually/i)
  if (annualMatch) {
    return {
      min: parseInt(annualMatch[1].replace(/,/g, '')),
      max: parseInt(annualMatch[2].replace(/,/g, '')),
      text: salaryText
    }
  }

  const hourlyMatch = salaryText.match(/\$([\d.]+)(?:\s*-\s*\$([\d.]+))?\s*Hourly/i)
  if (hourlyMatch) {
    const hourlyMin = parseFloat(hourlyMatch[1])
    const hourlyMax = hourlyMatch[2] ? parseFloat(hourlyMatch[2]) : hourlyMin
    return {
      min: Math.round(hourlyMin * 2080),
      max: Math.round(hourlyMax * 2080),
      text: salaryText
    }
  }

  return { text: salaryText }
}

function parseJobType(text?: string): string {
  if (!text) return 'full-time'
  const lower = text.toLowerCase()
  if (lower.includes('part-time')) return 'part-time'
  if (lower.includes('contract') || lower.includes('temporary')) return 'contract'
  if (lower.includes('freelance')) return 'freelance'
  if (lower.includes('internship')) return 'internship'
  return 'full-time'
}

function parseExperienceLevel(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes('senior') || lower.includes('sr.') || lower.includes('lead')) return 'senior'
  if (lower.includes('principal') || lower.includes('staff') || lower.includes('head') || lower.includes('director')) return 'lead'
  if (lower.includes('junior') || lower.includes('jr.') || lower.includes('entry') || lower.includes('associate')) return 'entry'
  return 'mid'
}

async function fetchJobDescription(page: Page, url: string): Promise<string> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })

    // Wait a bit for content to load
    await new Promise(r => setTimeout(r, 1000))

    const description = await page.evaluate(() => {
      // Remote.co job detail page structure
      const selectors = [
        '.job-description',
        '[class*="job-detail"]',
        '[class*="description"]',
        'article',
        'main'
      ]

      for (const selector of selectors) {
        const el = document.querySelector(selector)
        if (el && el.textContent && el.textContent.length > 200) {
          return el.textContent.trim().slice(0, 15000)
        }
      }

      // Fallback: get all paragraph text from main content
      const main = document.querySelector('main') || document.body
      const paragraphs = main.querySelectorAll('p, li')
      let text = ''
      paragraphs.forEach(p => {
        const content = p.textContent?.trim()
        if (content && content.length > 20) {
          text += content + '\n'
        }
      })
      return text.slice(0, 15000)
    })

    return description
  } catch (error) {
    console.error(`Failed to fetch description for ${url}:`, error)
    return ''
  }
}

export async function scrapeRemoteCoJobs(maxPages: number = 2): Promise<NormalizedJob[]> {
  let browser: Browser | null = null

  try {
    console.log('Launching Puppeteer with stealth for Remote.co scrape...')

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    })

    const page = await browser.newPage()

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36')

    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    })

    const allJobs: RemoteCoJob[] = []

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const url = pageNum === 1
        ? 'https://remote.co/remote-jobs/design/'
        : `https://remote.co/remote-jobs/design/?page=${pageNum}`

      console.log(`Scraping Remote.co page ${pageNum}...`)

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

      // Wait for content to load
      await new Promise(r => setTimeout(r, 2000))

      const pageJobs = await page.evaluate((): RemoteCoJob[] => {
        const jobs: RemoteCoJob[] = []
        const processedUrls = new Set<string>()

        // Find all job detail links
        const jobLinks = document.querySelectorAll('a[href*="/job-details/"]')

        jobLinks.forEach(link => {
          const href = link.getAttribute('href')
          if (!href || processedUrls.has(href)) return
          processedUrls.add(href)

          // Get title - last div child or direct text
          const titleDiv = link.querySelector('div:last-of-type')
          const title = titleDiv?.textContent?.trim()

          if (!title || title === 'New!' || title === 'Today' || title === 'Yesterday' || title.includes('days ago')) return

          // Find parent container for metadata
          const container = link.closest('div')?.parentElement?.parentElement
          if (!container) return

          // Find company name from h3
          const companyEl = container.querySelector('h3')
          const company = companyEl?.textContent?.trim() || ''

          // Parse list items for metadata
          const listItems = container.querySelectorAll('li')
          let remoteType = ''
          let jobType = ''
          let salary = ''

          listItems.forEach(li => {
            const text = li.textContent?.trim() || ''
            if (text.includes('Remote Work')) remoteType = text
            else if (text.includes('Time') || text === 'Employee' || text === 'Freelance' || text === 'Temporary') {
              if (!jobType) jobType = text
            }
            else if (text.includes('$') && (text.includes('nnually') || text.includes('ourly'))) salary = text
          })

          // Get location from specific div
          const locationDiv = container.querySelector('div[class*="Remote"]')
          const location = locationDiv?.textContent?.trim() || 'Remote'

          jobs.push({
            title,
            url: href,
            company,
            location,
            salary: salary || undefined,
            jobType,
            remoteType,
          })
        })

        return jobs
      })

      allJobs.push(...pageJobs)
      console.log(`Page ${pageNum}: found ${pageJobs.length} jobs`)

      // Rate limit between pages
      if (pageNum < maxPages) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    console.log(`Total jobs from listing: ${allJobs.length}, fetching descriptions...`)

    // Limit jobs to process for descriptions (avoid timeout)
    const jobsToProcess = allJobs.slice(0, 20)
    const normalizedJobs: NormalizedJob[] = []

    for (const job of jobsToProcess) {
      const fullUrl = `https://remote.co${job.url}`
      const description = await fetchJobDescription(page, fullUrl)
      const salary = parseSalary(job.salary)
      const jobId = job.url.split('/').filter(Boolean).pop() || job.title.replace(/\s+/g, '-')

      normalizedJobs.push({
        id: `remoteco-${jobId}`,
        source: 'remoteco' as any,
        title: job.title,
        company: job.company || 'Unknown Company',
        location: job.location,
        salary_min: salary.min,
        salary_max: salary.max,
        salary_text: salary.text,
        description: description || `${job.title} at ${job.company}. ${job.remoteType || 'Remote'}. ${job.jobType || 'Full-Time'}.`,
        job_type: parseJobType(job.jobType),
        experience_level: parseExperienceLevel(job.title),
        skills: [],
        apply_url: fullUrl,
        posted_at: new Date().toISOString(),
        is_featured: false
      })

      // Rate limit between job fetches
      await new Promise(r => setTimeout(r, 1000))
    }

    console.log(`Remote.co scrape complete: ${normalizedJobs.length} jobs with descriptions`)
    return normalizedJobs

  } catch (error) {
    console.error('Remote.co scrape error:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Quick scrape without descriptions (faster)
export async function scrapeRemoteCoJobsQuick(maxPages: number = 2): Promise<NormalizedJob[]> {
  let browser: Browser | null = null

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36')

    const allJobs: RemoteCoJob[] = []

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const url = pageNum === 1
        ? 'https://remote.co/remote-jobs/design/'
        : `https://remote.co/remote-jobs/design/?page=${pageNum}`

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
      await new Promise(r => setTimeout(r, 1500))

      const pageJobs = await page.evaluate((): RemoteCoJob[] => {
        const jobs: RemoteCoJob[] = []
        const processedUrls = new Set<string>()

        const jobLinks = document.querySelectorAll('a[href*="/job-details/"]')

        jobLinks.forEach(link => {
          const href = link.getAttribute('href')
          if (!href || processedUrls.has(href)) return
          processedUrls.add(href)

          const titleDiv = link.querySelector('div:last-of-type')
          const title = titleDiv?.textContent?.trim()
          if (!title || title === 'New!' || title === 'Today' || title === 'Yesterday' || title.includes('days ago')) return

          const container = link.closest('div')?.parentElement?.parentElement
          if (!container) return

          const companyEl = container.querySelector('h3')
          const company = companyEl?.textContent?.trim() || ''

          const listItems = container.querySelectorAll('li')
          let remoteType = ''
          let jobType = ''
          let salary = ''

          listItems.forEach(li => {
            const text = li.textContent?.trim() || ''
            if (text.includes('Remote Work')) remoteType = text
            else if (text.includes('Time') || text === 'Employee' || text === 'Freelance') {
              if (!jobType) jobType = text
            }
            else if (text.includes('$')) salary = text
          })

          const locationDiv = container.querySelector('div[class*="Remote"]')
          const location = locationDiv?.textContent?.trim() || 'Remote'

          jobs.push({
            title,
            url: href,
            company,
            location,
            salary: salary || undefined,
            jobType,
            remoteType,
          })
        })

        return jobs
      })

      allJobs.push(...pageJobs)
      if (pageNum < maxPages) await new Promise(r => setTimeout(r, 1500))
    }

    return allJobs.map(job => {
      const salary = parseSalary(job.salary)
      const jobId = job.url.split('/').filter(Boolean).pop() || job.title.replace(/\s+/g, '-')

      return {
        id: `remoteco-${jobId}`,
        source: 'remoteco' as any,
        title: job.title,
        company: job.company || 'Unknown Company',
        location: job.location,
        salary_min: salary.min,
        salary_max: salary.max,
        salary_text: salary.text,
        description: `${job.title} at ${job.company}. ${job.remoteType || 'Remote'}. ${job.jobType || 'Full-Time'}.`,
        job_type: parseJobType(job.jobType),
        experience_level: parseExperienceLevel(job.title),
        skills: [],
        apply_url: `https://remote.co${job.url}`,
        posted_at: new Date().toISOString(),
        is_featured: false
      }
    })

  } finally {
    if (browser) await browser.close()
  }
}
