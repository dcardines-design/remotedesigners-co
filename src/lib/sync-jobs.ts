import { createAdminSupabaseClient } from '@/lib/supabase'
import { NormalizedJob } from '@/lib/job-apis'
import { postJobToTwitter } from '@/lib/twitter-service'

export async function syncJobs(jobs: NormalizedJob[], sourceName: string) {
  console.log(`Starting ${sourceName} sync...`)
  const supabase = createAdminSupabaseClient()

  // Get existing jobs to check for duplicates
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
  const existingIds = new Set(existingById.keys())

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

  // Filter out duplicates and find jobs to update (better descriptions)
  const jobsToInsert: typeof allJobs = []
  const jobsToUpdate: Array<{ id: string; description: string }> = []

  for (const job of allJobs) {
    const existingByIdMatch = existingById.get(job.external_id)
    const existingByUrlMatch = existingByUrl.get(job.apply_url)
    const existing = existingByIdMatch || existingByUrlMatch

    if (!existing) {
      // New job - insert it
      jobsToInsert.push(job)
    } else if (job.description && job.description.length > 100) {
      // Existing job - check if new description is significantly better (50%+ longer)
      if (job.description.length > existing.descLength * 1.5) {
        jobsToUpdate.push({ id: existing.id, description: job.description.slice(0, 20000) })
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

  // Update jobs with better descriptions
  let updated = 0
  for (const job of jobsToUpdate) {
    const { error } = await supabase
      .from('jobs')
      .update({ description: job.description })
      .eq('id', job.id)

    if (!error) updated++
  }

  console.log(`${sourceName} sync complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped${tweeted ? ', tweeted' : ''}`)

  return { source: sourceName, fetched: jobs.length, inserted, updated, skipped }
}
