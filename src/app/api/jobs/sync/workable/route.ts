import { NextRequest, NextResponse } from 'next/server'
import { WORKABLE_COMPANIES } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

// Workable ATS - fetches from many companies, needs batching
export const maxDuration = 120

// Split companies into 2 batches (~40 companies each)
const NUM_BATCHES = 2
const BATCH_SIZE = Math.ceil(WORKABLE_COMPANIES.length / NUM_BATCHES)
const BATCHES: Record<number, typeof WORKABLE_COMPANIES> = {}
for (let i = 0; i < NUM_BATCHES; i++) {
  BATCHES[i + 1] = WORKABLE_COMPANIES.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
}

async function handleSync(batch?: number) {
  try {
    const companies = batch ? BATCHES[batch as keyof typeof BATCHES] : WORKABLE_COMPANIES
    const batchLabel = batch ? ` (batch ${batch}/${NUM_BATCHES})` : ''

    if (!companies || companies.length === 0) {
      return NextResponse.json({ error: 'Invalid batch number' }, { status: 400 })
    }

    console.log(`Workable sync${batchLabel}: ${companies.length} companies`)
    const startTime = Date.now()

    // Import the fetch function dynamically to use with batch
    const { fetchWorkableJobsForCompanies } = await import('@/lib/job-apis')
    const jobs = await fetchWorkableJobsForCompanies(companies)

    const fetchTime = Date.now() - startTime
    console.log(`Workable${batchLabel} fetch completed in ${fetchTime}ms, found ${jobs.length} jobs`)

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        batch: batch || 'all',
        warning: 'No design jobs found from Workable',
        fetched: 0,
        inserted: 0,
      })
    }

    const result = await syncJobs(jobs, 'workable')

    return NextResponse.json({
      success: true,
      batch: batch || 'all',
      companies: companies.length,
      fetchTimeMs: fetchTime,
      ...result,
    })
  } catch (error) {
    console.error('Workable sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const batch = searchParams.get('batch')
  return handleSync(batch ? parseInt(batch) : undefined)
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const batch = searchParams.get('batch')
  return handleSync(batch ? parseInt(batch) : undefined)
}
