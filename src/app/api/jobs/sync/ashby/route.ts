import { NextRequest, NextResponse } from 'next/server'
import { fetchAshbyJobs, ASHBY_COMPANIES } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

// Vercel timeout (60s for Pro)
export const maxDuration = 60

// Split companies into 3 batches (~20 companies each)
const NUM_BATCHES = 3
const BATCH_SIZE = Math.ceil(ASHBY_COMPANIES.length / NUM_BATCHES)
const BATCHES: Record<number, typeof ASHBY_COMPANIES> = {}
for (let i = 0; i < NUM_BATCHES; i++) {
  BATCHES[i + 1] = ASHBY_COMPANIES.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
}

async function handleSync(batch?: number) {
  try {
    const companies = batch ? BATCHES[batch as keyof typeof BATCHES] : undefined
    const batchLabel = batch ? ` (batch ${batch}/${Object.keys(BATCHES).length})` : ''
    console.log(`Ashby sync${batchLabel}: ${companies?.length || ASHBY_COMPANIES.length} companies`)

    const jobs = await fetchAshbyJobs(companies)
    const result = await syncJobs(jobs, 'ashby')
    return NextResponse.json({ success: true, batch, ...result })
  } catch (error) {
    console.error('Ashby sync error:', error)
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
