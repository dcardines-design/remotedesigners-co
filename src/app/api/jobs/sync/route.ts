import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { fetchAllJobs, NormalizedJob } from '@/lib/job-apis'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting job sync...')
    const supabase = createAdminSupabaseClient()

    // Fetch all jobs from external APIs
    const externalJobs = await fetchAllJobs()
    console.log(`Fetched ${externalJobs.length} jobs from external APIs`)

    // Get existing jobs to check for duplicates and jobs needing updates
    const { data: existingJobs } = await supabase
      .from('jobs')
      .select('id, external_id, apply_url, description')
    // Index by external_id and also by apply_url for fallback matching
    const existingById = new Map<string, { id: string; descLength: number }>()
    const existingByUrl = new Map<string, { id: string; descLength: number }>()
    for (const j of existingJobs || []) {
      const data = { id: j.id, descLength: j.description?.length || 0 }
      if (j.external_id) existingById.set(j.external_id, data)
      if (j.apply_url) existingByUrl.set(j.apply_url, data)
    }
    const existingIds = new Set(existingById.keys())

    // Generate unique external_id using title + company + source as fallback
    // Transform to database format
    const allJobs = externalJobs.map((job) => ({
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

    // Filter out jobs that already exist (check both by external_id and apply_url)
    const jobsToInsert = allJobs.filter(job =>
      !existingIds.has(job.external_id) && !existingByUrl.has(job.apply_url)
    )

    // Find existing jobs that need description updates (no description OR new one is significantly longer)
    const jobsToUpdate = allJobs.filter(job => {
      const existing = existingById.get(job.external_id) || existingByUrl.get(job.apply_url)
      if (!existing || !job.description) return false
      // Update if no description or new description is at least 20% longer
      return existing.descLength === 0 || (job.description.length > existing.descLength * 1.2)
    })

    console.log(`New jobs to insert: ${jobsToInsert.length} (${allJobs.length - jobsToInsert.length} already exist)`)
    console.log(`Jobs to update with descriptions: ${jobsToUpdate.length}`)

    // Insert new jobs in batches
    let inserted = 0
    let skipped = 0
    const batchSize = 20

    for (let i = 0; i < jobsToInsert.length; i += batchSize) {
      const batch = jobsToInsert.slice(i, i + batchSize)

      const { error } = await supabase
        .from('jobs')
        .insert(batch)

      if (error) {
        console.error(`Batch ${i / batchSize} error:`, error.message)
        skipped += batch.length
      } else {
        inserted += batch.length
      }
    }

    console.log(`Inserted: ${inserted}, Skipped: ${skipped}`)

    // Update existing jobs with missing/short descriptions
    let updated = 0
    for (const job of jobsToUpdate) {
      const existing = existingById.get(job.external_id) || existingByUrl.get(job.apply_url)
      if (existing) {
        const { error } = await supabase
          .from('jobs')
          .update({
            description: job.description,
            location: job.location,
            title: job.title,
            external_id: job.external_id, // Set external_id if missing
            salary_text: job.salary_text,
          })
          .eq('id', existing.id)

        if (!error) updated++
      }
    }
    console.log(`Updated: ${updated}`)

    // Get total count
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    console.log(`Sync complete. Total jobs in DB: ${count}`)

    return NextResponse.json({
      success: true,
      synced: externalJobs.length,
      inserted,
      updated,
      total: count,
    })
  } catch (error) {
    console.error('Job sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync jobs', details: String(error) },
      { status: 500 }
    )
  }
}
