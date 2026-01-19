// Nodesk.co Playwright Scraper
// Scrapes remote design jobs from nodesk.co/remote-jobs/design/

import { chromium, Browser, Page } from 'playwright'
import { NormalizedJob } from '@/lib/job-apis'

interface NodeskJob {
  title: string
  url: string
  company: string
  location: string
  salary?: string
  jobType?: string
  tags: string[]
  postedAgo?: string
}

function parseSalary(salaryText?: string): { min?: number; max?: number; text?: string } {
  if (!salaryText) return {}

  // Format: "$100K – $150K" or "$172K – $253K"
  const match = salaryText.match(/\$(\d+)K?\s*[–-]\s*\$(\d+)K?/i)
  if (match) {
    const min = parseInt(match[1]) * (match[1].length <= 3 ? 1000 : 1)
    const max = parseInt(match[2]) * (match[2].length <= 3 ? 1000 : 1)
    return {
      min: min < 1000 ? min * 1000 : min,
      max: max < 1000 ? max * 1000 : max,
      text: salaryText
    }
  }

  return { text: salaryText }
}

function parseJobType(text?: string): string {
  if (!text) return 'full-time'
  const lower = text.toLowerCase()
  if (lower.includes('contract')) return 'contract'
  if (lower.includes('part-time')) return 'part-time'
  if (lower.includes('freelance')) return 'freelance'
  if (lower.includes('internship')) return 'internship'
  return 'full-time'
}

function parseExperienceLevel(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes('senior') || lower.includes('sr.') || lower.includes('lead')) return 'senior'
  if (lower.includes('principal') || lower.includes('staff') || lower.includes('head')) return 'lead'
  if (lower.includes('junior') || lower.includes('jr.') || lower.includes('entry')) return 'entry'
  return 'mid'
}

function extractSkillsFromTags(tags: string[]): string[] {
  const skillKeywords = [
    'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'InDesign',
    'CSS', 'HTML', 'JavaScript', 'React', 'Vue', 'Angular', 'TypeScript',
    'Framer', 'Webflow', 'Principle', 'After Effects', 'Blender', '3D',
    'UI', 'UX', 'Product', 'Brand', 'Visual', 'Motion', 'Interaction'
  ]

  const skills: string[] = []
  for (const tag of tags) {
    for (const skill of skillKeywords) {
      if (tag.toLowerCase().includes(skill.toLowerCase()) && !skills.includes(skill)) {
        skills.push(skill)
      }
    }
  }
  return skills.slice(0, 10)
}

export async function scrapeNodeskJobs(): Promise<NormalizedJob[]> {
  let browser: Browser | null = null

  try {
    console.log('Launching browser for Nodesk scrape...')

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    const page = await context.newPage()

    console.log('Navigating to Nodesk design jobs...')
    await page.goto('https://nodesk.co/remote-jobs/design/', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    // Wait for Algolia to load jobs
    await page.waitForSelector('.ais-Hits-item', { timeout: 10000 })

    // Scroll to load more jobs (infinite scroll)
    console.log('Scrolling to load more jobs...')
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1500)
    }

    // Extract job data
    console.log('Extracting job data...')
    const rawJobs = await page.evaluate((): NodeskJob[] => {
      const jobs: NodeskJob[] = []
      const items = document.querySelectorAll('.ais-Hits-item')

      items.forEach((item) => {
        const titleLink = item.querySelector('h2 a') as HTMLAnchorElement
        const companyLink = item.querySelector('h3 a') as HTMLAnchorElement
        const locationEl = item.querySelector('h5 a, h5')

        if (!titleLink || !companyLink) return

        const title = titleLink.innerText?.trim()
        const url = titleLink.getAttribute('href')
        const company = companyLink.innerText?.trim()

        // Skip sponsored/featured collection links
        if (!url || url.includes('/collections/') || url.includes('/new/')) return
        if (!title || title.includes('Jobs') && title.includes('/')) return

        const allText = item.textContent || ''

        // Extract salary
        const salaryMatch = allText.match(/\$[\d,]+[kK]?\s*[–-]\s*\$[\d,]+[kK]?/)

        // Extract job type
        const typeMatch = allText.match(/Full-Time|Part-Time|Contract|Freelance|Internship/i)

        // Extract posted time
        const postedMatch = allText.match(/(\d+[dwmh])\s*$/i)

        // Get tags
        const tags = Array.from(item.querySelectorAll('a[href*="/remote-jobs/"]'))
          .map(a => (a as HTMLAnchorElement).innerText.trim())
          .filter(t => t.length < 30 && t.length > 1)

        jobs.push({
          title,
          url: url || '',
          company,
          location: locationEl?.textContent?.trim() || 'Remote',
          salary: salaryMatch?.[0],
          jobType: typeMatch?.[0],
          tags,
          postedAgo: postedMatch?.[1]
        })
      })

      return jobs
    })

    console.log(`Extracted ${rawJobs.length} raw jobs from Nodesk`)

    // Fetch job descriptions (limit to avoid timeout)
    const jobsToProcess = rawJobs.slice(0, 30)
    const normalizedJobs: NormalizedJob[] = []

    for (const job of jobsToProcess) {
      try {
        // First, get the direct apply URL from Nodesk listing page link
        // The job.url contains something like /remote-jobs/design/job-title/
        // We need to find the actual apply link which goes to Greenhouse etc.

        // Extract apply URL from job tags/listing - check if it's already an external URL
        let applyUrl = `https://nodesk.co${job.url}`

        // Go to Nodesk job page briefly to get the external apply link
        await page.goto(applyUrl, { waitUntil: 'domcontentloaded', timeout: 10000 })

        const externalUrl = await page.evaluate(() => {
          // Find the apply/view job link that goes to external site
          const links = document.querySelectorAll('a')
          for (const link of links) {
            const text = link.textContent?.trim().toLowerCase() || ''
            const href = link.getAttribute('href')
            if ((text.includes('apply') || text.includes('view job') || text.includes('view listing')) &&
                href && (href.startsWith('http') || href.startsWith('//')) &&
                !href.includes('nodesk.co')) {
              return href.startsWith('//') ? 'https:' + href : href
            }
          }
          return null
        })

        if (externalUrl) {
          applyUrl = externalUrl
        }

        // Now fetch description from the actual job page (Greenhouse, Lever, etc.)
        let description = ''
        if (applyUrl && !applyUrl.includes('nodesk.co')) {
          try {
            await page.goto(applyUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
            await page.waitForTimeout(1000) // Let content load

            description = await page.evaluate(() => {
              // Common job description selectors for ATS systems
              const selectors = [
                '#content', // Greenhouse
                '.job-description',
                '[class*="job-description"]',
                '[class*="description"]',
                '.posting-description', // Lever
                '[data-qa="job-description"]',
                'article',
                'main',
                '.content'
              ]

              for (const selector of selectors) {
                const el = document.querySelector(selector)
                if (el && el.textContent && el.textContent.length > 200) {
                  return el.textContent.trim().slice(0, 15000)
                }
              }

              // Fallback: get all paragraph text
              const paragraphs = document.querySelectorAll('p, li')
              let text = ''
              paragraphs.forEach(p => {
                const content = p.textContent?.trim()
                if (content && content.length > 20) {
                  text += content + '\n'
                }
              })
              return text.slice(0, 15000)
            })
          } catch (err) {
            console.log(`Could not fetch description from ${applyUrl}`)
          }
        }

        const salary = parseSalary(job.salary)

        normalizedJobs.push({
          id: `nodesk-${job.url.replace(/[^a-z0-9]/gi, '-')}`,
          source: 'nodesk' as any,
          title: job.title,
          company: job.company,
          location: job.location,
          salary_min: salary.min,
          salary_max: salary.max,
          salary_text: salary.text,
          description: description || `${job.title} at ${job.company}. ${job.tags.join(', ')}`,
          job_type: parseJobType(job.jobType),
          experience_level: parseExperienceLevel(job.title),
          skills: extractSkillsFromTags(job.tags),
          apply_url: applyUrl,
          posted_at: new Date().toISOString(),
          is_featured: false
        })

        // Rate limit
        await page.waitForTimeout(500)

      } catch (err) {
        console.error(`Failed to fetch details for ${job.title}:`, err)
      }
    }

    console.log(`Nodesk scrape complete: ${normalizedJobs.length} jobs normalized`)
    return normalizedJobs

  } catch (error) {
    console.error('Nodesk scrape error:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Quick scrape without fetching individual job pages (faster, less data)
export async function scrapeNodeskJobsQuick(): Promise<NormalizedJob[]> {
  let browser: Browser | null = null

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.goto('https://nodesk.co/remote-jobs/design/', {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    await page.waitForSelector('.ais-Hits-item', { timeout: 10000 })

    // Scroll to load more
    for (let i = 0; i < 2; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1000)
    }

    const rawJobs = await page.evaluate((): NodeskJob[] => {
      const jobs: NodeskJob[] = []
      const items = document.querySelectorAll('.ais-Hits-item')

      items.forEach((item) => {
        const titleLink = item.querySelector('h2 a') as HTMLAnchorElement
        const companyLink = item.querySelector('h3 a') as HTMLAnchorElement

        if (!titleLink || !companyLink) return

        const title = titleLink.innerText?.trim()
        const url = titleLink.getAttribute('href')
        const company = companyLink.innerText?.trim()

        if (!url || url.includes('/collections/') || url.includes('/new/')) return
        if (!title || title.includes('Jobs') && title.includes('/')) return

        const allText = item.textContent || ''
        const salaryMatch = allText.match(/\$[\d,]+[kK]?\s*[–-]\s*\$[\d,]+[kK]?/)
        const typeMatch = allText.match(/Full-Time|Part-Time|Contract|Freelance|Internship/i)

        const tags = Array.from(item.querySelectorAll('a[href*="/remote-jobs/"]'))
          .map(a => (a as HTMLAnchorElement).innerText.trim())
          .filter(t => t.length < 30 && t.length > 1)

        const locationEl = item.querySelector('h5 a, h5')

        jobs.push({
          title,
          url: url || '',
          company,
          location: locationEl?.textContent?.trim() || 'Remote',
          salary: salaryMatch?.[0],
          jobType: typeMatch?.[0],
          tags
        })
      })

      return jobs
    })

    return rawJobs.map(job => {
      const salary = parseSalary(job.salary)
      return {
        id: `nodesk-${job.url.replace(/[^a-z0-9]/gi, '-')}`,
        source: 'nodesk' as any,
        title: job.title,
        company: job.company,
        location: job.location,
        salary_min: salary.min,
        salary_max: salary.max,
        salary_text: salary.text,
        description: `${job.title} at ${job.company}. Location: ${job.location}. ${job.tags.join(', ')}`,
        job_type: parseJobType(job.jobType),
        experience_level: parseExperienceLevel(job.title),
        skills: extractSkillsFromTags(job.tags),
        apply_url: `https://nodesk.co${job.url}`,
        posted_at: new Date().toISOString(),
        is_featured: false
      }
    })

  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
