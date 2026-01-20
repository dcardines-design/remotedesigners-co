import { NextResponse } from 'next/server'
import { fetchIndeedJobs } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

// DISABLED: Indeed API quota reached (100% of PRO plan used)
const INDEED_API_DISABLED = true

async function handleSync() {
  // Check if Indeed API is disabled
  if (INDEED_API_DISABLED) {
    return NextResponse.json({
      success: false,
      message: 'Indeed API disabled - quota reached. Waiting for reset or plan upgrade.',
      disabled: true,
    })
  }

  try {
    const jobs = await fetchIndeedJobs()
    const result = await syncJobs(jobs, 'indeed')
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Indeed sync error:', error)
    return NextResponse.json({ error: 'Failed to sync', details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return handleSync()
}

export async function POST() {
  return handleSync()
}
