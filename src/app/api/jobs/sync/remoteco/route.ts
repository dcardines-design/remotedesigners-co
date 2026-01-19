import { NextResponse } from 'next/server'
import { scrapeRemoteCoJobs } from '@/lib/scrapers/remoteco'
import { syncJobs } from '@/lib/sync-jobs'

// Playwright scraping with descriptions needs more time
export const maxDuration = 180

async function handleSync() {
  try {
    console.log('Starting Remote.co scrape...')
    const startTime = Date.now()

    // Scrape 2 pages with descriptions (25 jobs max)
    const jobs = await scrapeRemoteCoJobs(2)

    const fetchTime = Date.now() - startTime
    console.log(`Remote.co scrape completed in ${fetchTime}ms, found ${jobs.length} jobs`)

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        warning: 'No jobs scraped - Remote.co may have changed structure',
        fetched: 0,
        inserted: 0,
      })
    }

    const result = await syncJobs(jobs, 'remoteco')

    return NextResponse.json({
      success: true,
      fetchTimeMs: fetchTime,
      ...result,
    })
  } catch (error) {
    console.error('Remote.co sync error:', error)
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
