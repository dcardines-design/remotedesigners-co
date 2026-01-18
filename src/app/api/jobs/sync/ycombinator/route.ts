import { NextResponse } from 'next/server'
import { fetchYCombinatorJobs } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

async function handleSync() {
  try {
    const jobs = await fetchYCombinatorJobs()
    const result = await syncJobs(jobs, 'ycombinator')
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('YCombinator sync error:', error)
    return NextResponse.json({ error: 'Failed to sync', details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return handleSync()
}

export async function POST() {
  return handleSync()
}
