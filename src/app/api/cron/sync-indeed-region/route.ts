import { NextRequest, NextResponse } from 'next/server'
import { fetchIndeedJobs, INDEED_REGIONS, IndeedRegion } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

export const runtime = 'nodejs'
export const maxDuration = 60 // 1 minute max per region (much faster)

// Auto-check if Indeed API quota is available
async function checkIndeedQuota(): Promise<{ available: boolean; message: string }> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return { available: false, message: 'RAPIDAPI_KEY not configured' }

  try {
    const res = await fetch(
      'https://indeed12.p.rapidapi.com/jobs/search?query=test&location=us&page_id=1&locality=us&fromage=1&radius=50',
      { headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'indeed12.p.rapidapi.com' } }
    )
    if (res.status === 429) return { available: false, message: 'Rate limited' }
    if (res.status === 403) return { available: false, message: 'Quota exceeded' }
    if (!res.ok) return { available: false, message: `API error: ${res.status}` }
    return { available: true, message: 'Quota available' }
  } catch (error) {
    return { available: false, message: `Connection error: ${error}` }
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Auto-check quota
  const quotaCheck = await checkIndeedQuota()
  if (!quotaCheck.available) {
    return NextResponse.json({ success: false, message: quotaCheck.message, quotaAvailable: false })
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
