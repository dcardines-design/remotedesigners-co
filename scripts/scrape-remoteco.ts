#!/usr/bin/env npx ts-node
// Standalone script to scrape Remote.co jobs
// Run via: npx ts-node scripts/scrape-remoteco.ts
// Or via GitHub Actions on a schedule

import { createClient } from '@supabase/supabase-js'

// ============ SCRAPER CODE (inlined to avoid build issues) ============

import puppeteer from 'puppeteer'
import type { Browser, Page } from 'puppeteer'

interface RemoteCoJob {
  title: string
  url: string
  company: string
  location: string
  salary?: string
  jobType?: string
  remoteType?: string
}

interface NormalizedJob {
  id: string
  source: string
  title: string
  company: string
  company_logo?: string
  location: string
  salary_min?: number
  salary_max?: number
  salary_text?: string
  description: string
  job_type: string
  experience_level: string
  skills: string[]
  apply_url: string
  posted_at: string
  is_featured: boolean
}

function parseSalary(salaryText?: string): { min?: number; max?: number; text?: string } {
  if (!salaryText) return {}

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

async function applyStealthSettings(page: Page): Promise<void> {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] })
    Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' })
    // @ts-ignore
    window.chrome = { runtime: {} }
  })
}

interface JobDetails {
  description: string
  directApplyUrl?: string
}

async function fetchJobDetails(page: Page, url: string): Promise<JobDetails> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await new Promise(r => setTimeout(r, 1000))

    const result = await page.evaluate((): JobDetails => {
      let directApplyUrl: string | undefined
      const applyLinks = document.querySelectorAll('a')
      for (const link of applyLinks) {
        const text = link.textContent?.trim().toLowerCase()
        const href = link.getAttribute('href')
        if (text === 'apply' && href && !href.includes('remote.co') && !href.includes('/signup')) {
          directApplyUrl = href
          break
        }
      }

      const selectors = ['.job-description', '[class*="job-detail"]', '[class*="description"]', 'article', 'main']
      let description = ''
      for (const selector of selectors) {
        const el = document.querySelector(selector)
        if (el && el.textContent && el.textContent.length > 200) {
          description = el.textContent.trim().slice(0, 15000)
          break
        }
      }

      if (!description) {
        const main = document.querySelector('main') || document.body
        const paragraphs = main.querySelectorAll('p, li')
        let text = ''
        paragraphs.forEach(p => {
          const content = p.textContent?.trim()
          if (content && content.length > 20) text += content + '\n'
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

async function scrapeRemoteCoJobs(maxPages: number = 3): Promise<NormalizedJob[]> {
  let browser: Browser | null = null

  try {
    console.log('Launching Puppeteer for Remote.co scrape...')

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled'
      ]
    })

    const page = await browser.newPage()
    await applyStealthSettings(page)
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36')

    const allJobs: RemoteCoJob[] = []

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const url = pageNum === 1
        ? 'https://remote.co/remote-jobs/design/'
        : `https://remote.co/remote-jobs/design/?page=${pageNum}`

      console.log(`Scraping Remote.co page ${pageNum}...`)
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
      await new Promise(r => setTimeout(r, 2000))

      const pageJobs = await page.evaluate((): RemoteCoJob[] => {
        const jobs: RemoteCoJob[] = []
        const processedUrls = new Set<string>()
        const jobLinks = document.querySelectorAll('a[href*="/job-details/"]')

        jobLinks.forEach(link => {
          const href = link.getAttribute('href')
          if (!href || processedUrls.has(href)) return
          processedUrls.add(href)

          const childDivs = link.querySelectorAll(':scope > div, :scope > span')
          let title = ''

          for (let i = childDivs.length - 1; i >= 0; i--) {
            const text = childDivs[i].textContent?.trim() || ''
            if (text && text !== 'New!' && text !== 'Today' && text !== 'Yesterday' && !text.match(/^\d+ days? ago$/)) {
              title = text
              break
            }
          }

          if (!title) return

          let container = link.parentElement
          while (container && !container.querySelector('h3') && !container.querySelector('ul')) {
            container = container.parentElement
          }
          if (!container) container = link.parentElement?.parentElement ?? null

          const companyEl = container?.querySelector('h3')
          const company = companyEl?.textContent?.trim() || ''

          const listItems = container?.querySelectorAll('li') || []
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

          let location = 'Remote'
          const allText = container?.textContent || ''
          const locationMatch = allText.match(/(?:Remote in|Hybrid Remote in)\s+([^•\n]+)/)
          if (locationMatch) location = locationMatch[1].trim()

          jobs.push({ title, url: href, company, location, salary: salary || undefined, jobType, remoteType })
        })

        return jobs
      })

      allJobs.push(...pageJobs)
      console.log(`Page ${pageNum}: found ${pageJobs.length} jobs`)

      if (pageNum < maxPages) await new Promise(r => setTimeout(r, 2000))
    }

    console.log(`Total jobs from listing: ${allJobs.length}, fetching descriptions...`)

    const jobsToProcess = allJobs.slice(0, 30)
    const normalizedJobs: NormalizedJob[] = []

    for (const job of jobsToProcess) {
      const fullUrl = `https://remote.co${job.url}`
      const jobDetails = await fetchJobDetails(page, fullUrl)
      const salary = parseSalary(job.salary)
      const jobId = job.url.split('/').filter(Boolean).pop() || job.title.replace(/\s+/g, '-')
      const applyUrl = jobDetails.directApplyUrl || fullUrl

      normalizedJobs.push({
        id: `remoteco-${jobId}`,
        source: 'remoteco',
        title: job.title,
        company: job.company || 'Unknown Company',
        location: job.location,
        salary_min: salary.min,
        salary_max: salary.max,
        salary_text: salary.text,
        description: jobDetails.description || `${job.title} at ${job.company}. ${job.remoteType || 'Remote'}. ${job.jobType || 'Full-Time'}.`,
        job_type: parseJobType(job.jobType),
        experience_level: parseExperienceLevel(job.title),
        skills: [],
        apply_url: applyUrl,
        posted_at: new Date().toISOString(),
        is_featured: false
      })

      await new Promise(r => setTimeout(r, 1000))
    }

    console.log(`Remote.co scrape complete: ${normalizedJobs.length} jobs with descriptions`)
    return normalizedJobs

  } finally {
    if (browser) await browser.close()
  }
}

// ============ SYNC CODE ============

async function syncJobs(jobs: NormalizedJob[], sourceName: string) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY (or NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log(`Starting ${sourceName} sync...`)

  const { data: existingJobs } = await supabase
    .from('jobs')
    .select('id, external_id, apply_url, description')

  const existingById = new Map<string, { id: string; descLength: number }>()
  const existingByUrl = new Map<string, { id: string; descLength: number }>()

  for (const j of existingJobs || []) {
    const data = { id: j.id, descLength: j.description?.length || 0 }
    if (j.external_id) existingById.set(j.external_id, data)
    if (j.apply_url) existingByUrl.set(j.apply_url, data)
  }

  const allJobs = jobs.map((job) => ({
    title: job.title,
    company: job.company,
    company_logo: job.company_logo || null,
    location: job.location,
    salary_min: job.salary_min || null,
    salary_max: job.salary_max || null,
    salary_text: job.salary_text || null,
    description: job.description?.slice(0, 20000) || null,
    job_type: job.job_type || 'full-time',
    experience_level: job.experience_level || null,
    skills: job.skills || [],
    apply_url: job.apply_url,
    source: job.source,
    external_id: job.id || `${job.title}-${job.company}`.slice(0, 200),
    is_featured: job.is_featured || false,
    is_active: true,
    posted_at: job.posted_at,
  }))

  const jobsToInsert: typeof allJobs = []
  const jobsToUpdate: Array<{ id: string; description: string }> = []

  for (const job of allJobs) {
    const existing = existingById.get(job.external_id) || existingByUrl.get(job.apply_url)

    if (!existing) {
      jobsToInsert.push(job)
    } else if (job.description && job.description.length > 100) {
      if (job.description.length > existing.descLength * 1.5) {
        jobsToUpdate.push({ id: existing.id, description: job.description.slice(0, 20000) })
      }
    }
  }

  console.log(`${sourceName}: ${jobsToInsert.length} new, ${jobsToUpdate.length} to update`)

  let inserted = 0
  let skipped = 0
  const batchSize = 20

  for (let i = 0; i < jobsToInsert.length; i += batchSize) {
    const batch = jobsToInsert.slice(i, i + batchSize)
    const { error } = await supabase.from('jobs').insert(batch)

    if (error) {
      console.error(`${sourceName} batch error:`, error.message)
      skipped += batch.length
    } else {
      inserted += batch.length
    }
  }

  let updated = 0
  for (const job of jobsToUpdate) {
    const { error } = await supabase
      .from('jobs')
      .update({ description: job.description })
      .eq('id', job.id)

    if (!error) updated++
  }

  console.log(`${sourceName} sync complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped`)
  return { source: sourceName, fetched: jobs.length, inserted, updated, skipped }
}

// ============ MAIN ============

async function main() {
  console.log('=== Remote.co Scraper ===')
  console.log(`Started at: ${new Date().toISOString()}`)

  try {
    const jobs = await scrapeRemoteCoJobs(3)
    const result = await syncJobs(jobs, 'remoteco')

    console.log('\n=== Results ===')
    console.log(JSON.stringify(result, null, 2))

    process.exit(0)
  } catch (error) {
    console.error('Scrape failed:', error)
    process.exit(1)
  }
}

main()
