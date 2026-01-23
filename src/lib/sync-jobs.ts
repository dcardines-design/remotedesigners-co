import { createAdminSupabaseClient } from '@/lib/supabase'
import { NormalizedJob } from '@/lib/job-apis'
import { postJobToTwitter } from '@/lib/twitter-service'

export async function syncJobs(jobs: NormalizedJob[], sourceName: string) {
  console.log(`Starting ${sourceName} sync...`)
  const supabase = createAdminSupabaseClient()

  // Get existing jobs to check for duplicates
  // Check by external_id (all time), apply_url (90 days), and title+company (90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  // Get all external_ids for this source (no date filter to prevent re-inserts)
  // Limit to 5000 to avoid query limits, ordered by newest first
  const { data: existingBySource } = await supabase
    .from('jobs')
    .select('id, external_id, apply_url, title, company')
    .eq('source', sourceName)
    .order('posted_at', { ascending: false })
    .limit(5000)

  // Get recent jobs for cross-source deduplication (by URL and title+company)
  const { data: recentJobs } = await supabase
    .from('jobs')
    .select('id, external_id, apply_url, title, company')
    .gte('posted_at', ninetyDaysAgo)

  const existingJobs = [...(existingBySource || []), ...(recentJobs || [])]

  const existingById = new Map<string, { id: string; applyUrl: string }>()
  const existingByUrl = new Map<string, { id: string; applyUrl: string }>()
  const existingByTitleCompany = new Map<string, { id: string; applyUrl: string }>()

  const normalizeTitleCompany = (title: string, company: string) =>
    `${title.trim().toLowerCase()}|||${company.trim().toLowerCase()}`

  for (const j of existingJobs || []) {
    const data = { id: j.id, applyUrl: j.apply_url || '' }
    if (j.external_id) existingById.set(j.external_id, data)
    if (j.apply_url) existingByUrl.set(j.apply_url, data)
    if (j.title && j.company) {
      existingByTitleCompany.set(normalizeTitleCompany(j.title, j.company), data)
    }
  }

  // Transform to database format
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

  // Filter out duplicates and find jobs to update (direct apply URLs)
  const jobsToInsert: typeof allJobs = []
  const jobsToUpdate: Array<{ id: string; apply_url: string }> = []

  // Also track title+company within this batch to prevent intra-batch duplicates
  const batchTitleCompany = new Set<string>()

  for (const job of allJobs) {
    const existingByIdMatch = existingById.get(job.external_id)
    const existingByUrlMatch = existingByUrl.get(job.apply_url)
    const titleCompanyKey = normalizeTitleCompany(job.title, job.company)
    const existingByTitleCompanyMatch = existingByTitleCompany.get(titleCompanyKey)
    const existingInBatch = batchTitleCompany.has(titleCompanyKey)
    const existing = existingByIdMatch || existingByUrlMatch || existingByTitleCompanyMatch || (existingInBatch ? { id: 'batch', applyUrl: '' } : null)

    if (!existing) {
      // New job - insert it
      jobsToInsert.push(job)
      batchTitleCompany.add(titleCompanyKey)
    } else {
      // Existing job - check if apply_url should be updated to direct URL
      if (job.apply_url && job.apply_url !== existing.applyUrl) {
        const isDirectUrl = !job.apply_url.includes('remote.co') &&
                           !job.apply_url.includes('nodesk.co') &&
                           !job.apply_url.includes('justremote.co')
        const wasMiddleman = existing.applyUrl.includes('remote.co') ||
                            existing.applyUrl.includes('nodesk.co') ||
                            existing.applyUrl.includes('justremote.co')

        // Update if new URL is a direct apply URL and old was middleman
        if (isDirectUrl && wasMiddleman) {
          jobsToUpdate.push({ id: existing.id, apply_url: job.apply_url })
        }
      }
    }
  }

  console.log(`${sourceName}: ${jobsToInsert.length} new, ${jobsToUpdate.length} to update, ${allJobs.length - jobsToInsert.length - jobsToUpdate.length} unchanged`)

  // Insert new jobs in batches
  let inserted = 0
  let skipped = 0
  let tweeted = false
  const batchSize = 20

  for (let i = 0; i < jobsToInsert.length; i += batchSize) {
    const batch = jobsToInsert.slice(i, i + batchSize)
    const { data: insertedJobs, error } = await supabase
      .from('jobs')
      .insert(batch)
      .select('id, title, company, location, salary_min, salary_max, salary_text')

    if (error) {
      console.error(`${sourceName} batch error:`, error.message)
      skipped += batch.length
    } else {
      inserted += batch.length

      // Tweet one job per sync (to avoid rate limits)
      if (!tweeted && insertedJobs && insertedJobs.length > 0) {
        try {
          await postJobToTwitter(insertedJobs[0])
          tweeted = true
        } catch (e) {
          console.error('Twitter post failed:', e)
        }
      }
    }
  }

  // Update jobs with direct apply URLs
  let updated = 0
  for (const job of jobsToUpdate) {
    const { error } = await supabase
      .from('jobs')
      .update({ apply_url: job.apply_url })
      .eq('id', job.id)

    if (!error) updated++
  }

  console.log(`${sourceName} sync complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped${tweeted ? ', tweeted' : ''}`)

  return { source: sourceName, fetched: jobs.length, inserted, updated, skipped }
}
