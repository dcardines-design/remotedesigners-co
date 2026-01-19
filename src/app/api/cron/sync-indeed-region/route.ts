import { NextRequest, NextResponse } from 'next/server'
import { fetchIndeedJobs, INDEED_REGIONS, IndeedRegion } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

export const runtime = 'nodejs'
export const maxDuration = 60 // 1 minute max per region (much faster)

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get region from query parameter
  const region = request.nextUrl.searchParams.get('region') as IndeedRegion | null

  if (!region || !INDEED_REGIONS[region]) {
    return NextResponse.json({
      error: 'Invalid region',
      validRegions: Object.keys(INDEED_REGIONS),
      usage: '/api/cron/sync-indeed-region?region=us'
    }, { status: 400 })
  }

  try {
    const regionName = INDEED_REGIONS[region].name
    console.log(`Starting Indeed cron sync for ${regionName}...`)

    const jobs = await fetchIndeedJobs(region)
    const result = await syncJobs(jobs, 'indeed')

    console.log(`Indeed ${regionName} sync complete: ${result.inserted} inserted, ${result.skipped} skipped`)

    return NextResponse.json({
      success: true,
      region: regionName,
      ...result
    })
  } catch (error) {
    console.error(`Indeed ${region} sync error:`, error)
    return NextResponse.json({
      error: `Failed to sync Indeed jobs for ${region}`,
      details: String(error)
    }, { status: 500 })
  }
}
