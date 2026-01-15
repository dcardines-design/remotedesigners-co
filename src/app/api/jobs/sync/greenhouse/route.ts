import { NextRequest, NextResponse } from 'next/server'
import { fetchGreenhouseJobs, GREENHOUSE_COMPANIES } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

// Split companies into 3 batches
const BATCH_SIZE = Math.ceil(GREENHOUSE_COMPANIES.length / 3)
const BATCHES = {
  1: GREENHOUSE_COMPANIES.slice(0, BATCH_SIZE),
  2: GREENHOUSE_COMPANIES.slice(BATCH_SIZE, BATCH_SIZE * 2),
  3: GREENHOUSE_COMPANIES.slice(BATCH_SIZE * 2),
}

async function handleSync(batch?: number) {
  try {
    const companies = batch ? BATCHES[batch as keyof typeof BATCHES] : undefined
    const batchLabel = batch ? ` (batch ${batch}/${Object.keys(BATCHES).length})` : ''
    console.log(`Greenhouse sync${batchLabel}: ${companies?.length || GREENHOUSE_COMPANIES.length} companies`)

    const jobs = await fetchGreenhouseJobs(companies)
    const result = await syncJobs(jobs, 'greenhouse')
    return NextResponse.json({ success: true, batch, ...result })
  } catch (error) {
    console.error('Greenhouse sync error:', error)
    return NextResponse.json({ error: 'Failed to sync', details: String(error) }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const batch = request.nextUrl.searchParams.get('batch')
  return handleSync(batch ? parseInt(batch) : undefined)
}

export async function POST(request: NextRequest) {
  const batch = request.nextUrl.searchParams.get('batch')
  return handleSync(batch ? parseInt(batch) : undefined)
}
