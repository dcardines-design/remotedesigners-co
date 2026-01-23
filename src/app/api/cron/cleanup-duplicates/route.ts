import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Starting duplicate cleanup cron...')
    const supabase = createAdminSupabaseClient()

    // Get all jobs ordered by posted_at ascending (keep oldest)
    const { data: allJobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title, company, apply_url, description, posted_at')
      .order('posted_at', { ascending: true })

    if (fetchError || !allJobs) {
      throw fetchError || new Error('Failed to fetch jobs')
    }

    const idsToDelete = new Set<string>()

    // Pass 1: Dedup by apply_url
    const byUrl = new Map<string, typeof allJobs>()
    for (const job of allJobs) {
      if (!job.apply_url) continue
      const existing = byUrl.get(job.apply_url) || []
      existing.push(job)
      byUrl.set(job.apply_url, existing)
    }

    for (const [, jobs] of Array.from(byUrl.entries())) {
      if (jobs.length > 1) {
        const withDesc = jobs.filter(j => j.description)
        const toKeep = withDesc.length > 0 ? withDesc[0] : jobs[0]
        for (const j of jobs) {
          if (j.id !== toKeep.id) idsToDelete.add(j.id)
        }
      }
    }

    // Pass 2: Dedup by normalized title+company
    const byTitleCompany = new Map<string, typeof allJobs>()
    for (const job of allJobs) {
      if (idsToDelete.has(job.id)) continue
      const key = `${job.title.trim().toLowerCase()}|||${job.company.trim().toLowerCase()}`
      const existing = byTitleCompany.get(key) || []
      existing.push(job)
      byTitleCompany.set(key, existing)
    }

    for (const [, jobs] of Array.from(byTitleCompany.entries())) {
      if (jobs.length > 1) {
        const withDesc = jobs.filter(j => j.description)
        const toKeep = withDesc.length > 0 ? withDesc[0] : jobs[0]
        for (const j of jobs) {
          if (j.id !== toKeep.id) idsToDelete.add(j.id)
        }
      }
    }

    const idsArray = Array.from(idsToDelete)
    console.log(`Found ${idsArray.length} duplicate jobs to delete`)

    // Delete duplicates in batches
    let deleted = 0
    const batchSize = 50
    for (let i = 0; i < idsArray.length; i += batchSize) {
      const batch = idsArray.slice(i, i + batchSize)
      const { error } = await supabase
        .from('jobs')
        .delete()
        .in('id', batch)

      if (!error) {
        deleted += batch.length
      } else {
        console.error('Delete batch error:', error.message)
      }
    }

    console.log(`Cleanup complete: deleted ${deleted} duplicates`)

    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      deleted,
      total: count,
    })
  } catch (error) {
    console.error('Cleanup cron error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup', details: String(error) },
      { status: 500 }
    )
  }
}
