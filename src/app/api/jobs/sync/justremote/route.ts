import { NextResponse } from 'next/server'
import { scrapeJustRemoteJobs } from '@/lib/scrapers/justremote'
import { syncJobs } from '@/lib/sync-jobs'

// Playwright scraping with descriptions needs more time
export const maxDuration = 120

async function handleSync() {
  try {
    console.log('Starting JustRemote scrape...')
    const startTime = Date.now()

    const jobs = await scrapeJustRemoteJobs()

    const fetchTime = Date.now() - startTime
    console.log(`JustRemote scrape completed in ${fetchTime}ms, found ${jobs.length} jobs`)

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        warning: 'No jobs scraped - JustRemote may have changed structure',
        fetched: 0,
        inserted: 0,
      })
    }

    const result = await syncJobs(jobs, 'justremote')

    return NextResponse.json({
      success: true,
      fetchTimeMs: fetchTime,
      ...result,
    })
  } catch (error) {
    console.error('JustRemote sync error:', error)
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
