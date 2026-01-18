import { NextRequest, NextResponse } from 'next/server'
import { fetchGreenhouseJobs, GREENHOUSE_COMPANIES } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

// Vercel timeout (60s for Pro)
export const maxDuration = 60

// Split companies into 5 batches (~28 companies each)
const NUM_BATCHES = 5
const BATCH_SIZE = Math.ceil(GREENHOUSE_COMPANIES.length / NUM_BATCHES)
const BATCHES: Record<number, typeof GREENHOUSE_COMPANIES> = {}
for (let i = 0; i < NUM_BATCHES; i++) {
  BATCHES[i + 1] = GREENHOUSE_COMPANIES.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
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
