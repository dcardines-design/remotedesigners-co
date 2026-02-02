import { NextResponse } from 'next/server'
import { fetchWorkAtAStartupJobs } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

// YC startups job board - needs more time for API calls
export const maxDuration = 120

async function handleSync() {
  try {
    console.log('Fetching Work at a Startup (YC) jobs...')
    const startTime = Date.now()

    const jobs = await fetchWorkAtAStartupJobs()

    const fetchTime = Date.now() - startTime
    console.log(`Work at a Startup fetch completed in ${fetchTime}ms, found ${jobs.length} jobs`)

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        warning: 'No design jobs found from Work at a Startup',
        fetched: 0,
        inserted: 0,
      })
    }

    const result = await syncJobs(jobs, 'workatastartup')

    return NextResponse.json({
      success: true,
      fetchTimeMs: fetchTime,
      ...result,
    })
  } catch (error) {
    console.error('Work at a Startup sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return handleSync()
}

export async function POST() {
  return handleSync()
}
