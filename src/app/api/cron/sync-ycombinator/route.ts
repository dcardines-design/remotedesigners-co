import { NextResponse } from 'next/server'
import { fetchYCombinatorJobs } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Starting YCombinator cron sync...')
    const jobs = await fetchYCombinatorJobs()
    const result = await syncJobs(jobs, 'ycombinator')
    console.log(`YCombinator cron complete: ${result.inserted} inserted, ${result.skipped} skipped`)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('YCombinator cron sync error:', error)
    return NextResponse.json({
      error: 'Failed to sync YCombinator jobs',
      details: String(error)
    }, { status: 500 })
  }
}
