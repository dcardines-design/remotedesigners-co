import { NextResponse } from 'next/server'
import { fetchRapidAPIRemoteJobs } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

// Vercel timeout
export const maxDuration = 60

async function handleSync() {
  try {
    console.log('Fetching RapidAPI Remote Jobs...')
    const startTime = Date.now()

    const jobs = await fetchRapidAPIRemoteJobs()

    const fetchTime = Date.now() - startTime
    console.log(`RapidAPI Remote Jobs fetch completed in ${fetchTime}ms, found ${jobs.length} jobs`)

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        warning: 'No design jobs found in this batch',
        fetched: 0,
        inserted: 0,
      })
    }

    const result = await syncJobs(jobs, 'rapidapi-remote')

    return NextResponse.json({
      success: true,
      fetchTimeMs: fetchTime,
      ...result,
    })
  } catch (error) {
    console.error('RapidAPI Remote Jobs sync error:', error)
    return NextResponse.json({ error: 'Failed to sync', details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return handleSync()
}

export async function POST() {
  return handleSync()
}
