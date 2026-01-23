import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase'

// DELETE - Remove jobs (empty descriptions by default, or all with ?all=true)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient()
    const { searchParams } = new URL(request.url)
    const deleteAll = searchParams.get('all') === 'true'

    if (deleteAll) {
      // Delete ALL jobs for fresh start
      const { error } = await supabase
        .from('jobs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (can't use .delete() alone)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, deleted: 'all' })
    }

    // First fetch jobs with empty descriptions
    const { data: emptyJobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, description')

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch jobs', details: fetchError.message },
        { status: 500 }
      )
    }

    // Filter to find jobs with empty/placeholder descriptions
    const idsToDelete = emptyJobs
      ?.filter(j => !j.description || j.description.includes('No description provided'))
      .map(j => j.id) || []

    if (idsToDelete.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 })
    }

    // Delete in batches
    let deleted = 0
    const batchSize = 50
    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize)
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

    return NextResponse.json({
      success: true,
      deleted,
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete jobs', details: String(error) },
      { status: 500 }
    )
  }
}

// POST - Remove duplicate jobs (by apply_url AND title+company)
export async function POST(request: NextRequest) {
  try {
    console.log('Starting job cleanup...')
    const supabase = createAdminSupabaseClient()

    // Get all jobs
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
      if (idsToDelete.has(job.id)) continue // Skip already marked
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
        console.error('Delete error:', error.message)
      }
    }

    console.log(`Deleted ${deleted} duplicate jobs`)

    // Get final count
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      deleted,
      total: count,
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup jobs', details: String(error) },
      { status: 500 }
    )
  }
}
