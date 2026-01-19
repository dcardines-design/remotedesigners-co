// Script to run Playwright scrapers directly (for GitHub Actions)
// Usage: npx tsx scripts/scrape-playwright-jobs.ts

import { scrapeNodeskJobs } from '../src/lib/scrapers/nodesk'
import { scrapeJustRemoteJobs } from '../src/lib/scrapers/justremote'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function syncJobs(jobs: any[], source: string) {
  console.log(`Syncing ${jobs.length} jobs from ${source}...`)

  const { data: existingJobs } = await supabase
    .from('jobs')
    .select('external_id, apply_url')

  const existingIds = new Set(existingJobs?.map(j => j.external_id) || [])
  const existingUrls = new Set(existingJobs?.map(j => j.apply_url) || [])

  const newJobs = jobs.filter(job =>
    !existingIds.has(job.id) && !existingUrls.has(job.apply_url)
  )

  if (newJobs.length === 0) {
    console.log(`${source}: No new jobs to insert`)
    return { inserted: 0 }
  }

  const jobsToInsert = newJobs.map(job => ({
    title: job.title,
    company: job.company,
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
    external_id: job.id,
    is_featured: false,
    is_active: true,
    posted_at: job.posted_at,
  }))

  const { error } = await supabase.from('jobs').insert(jobsToInsert)

  if (error) {
    console.error(`${source} insert error:`, error.message)
    return { inserted: 0, error: error.message }
  }

  console.log(`${source}: Inserted ${jobsToInsert.length} new jobs`)
  return { inserted: jobsToInsert.length }
}

async function main() {
  console.log('Starting Playwright scrapers...\n')

  // Run Nodesk
  try {
    console.log('=== NODESK ===')
    const nodeskJobs = await scrapeNodeskJobs()
    await syncJobs(nodeskJobs, 'nodesk')
  } catch (error) {
    console.error('Nodesk scraper failed:', error)
  }

  // Run JustRemote
  try {
    console.log('\n=== JUSTREMOTE ===')
    const justremoteJobs = await scrapeJustRemoteJobs()
    await syncJobs(justremoteJobs, 'justremote')
  } catch (error) {
    console.error('JustRemote scraper failed:', error)
  }

  console.log('\nDone!')
}

main().catch(console.error)
