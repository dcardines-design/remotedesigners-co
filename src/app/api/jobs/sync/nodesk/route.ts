import { NextResponse } from 'next/server'
import { scrapeNodeskJobs } from '@/lib/scrapers/nodesk'
import { syncJobs } from '@/lib/sync-jobs'

// Playwright scraping with descriptions needs more time
export const maxDuration = 180

async function handleSync() {
  try {
    console.log('Starting Nodesk scrape...')
    const startTime = Date.now()

    // Full scrape with job descriptions
    const jobs = await scrapeNodeskJobs()

    const fetchTime = Date.now() - startTime
    console.log(`Nodesk scrape completed in ${fetchTime}ms, found ${jobs.length} jobs`)

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        warning: 'No jobs scraped - Nodesk may have changed structure',
        fetched: 0,
        inserted: 0,
      })
    }

    const result = await syncJobs(jobs, 'nodesk')

    return NextResponse.json({
      success: true,
      fetchTimeMs: fetchTime,
      ...result,
    })
  } catch (error) {
    console.error('Nodesk sync error:', error)
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
