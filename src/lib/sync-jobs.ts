import { createAdminSupabaseClient } from '@/lib/supabase'
import { NormalizedJob } from '@/lib/job-apis'

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

  // Filter out duplicates
  const jobsToInsert = allJobs.filter(job =>
    !existingIds.has(job.external_id) && !existingByUrl.has(job.apply_url)
  )

  console.log(`${sourceName}: ${jobsToInsert.length} new jobs (${allJobs.length - jobsToInsert.length} already exist)`)

  // Insert new jobs in batches
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

  console.log(`${sourceName} sync complete: ${inserted} inserted, ${skipped} skipped`)

  return { source: sourceName, fetched: jobs.length, inserted, skipped }
}
