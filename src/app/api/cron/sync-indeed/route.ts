import { NextResponse } from 'next/server'
import { INDEED_REGIONS } from '@/lib/job-apis'

export const runtime = 'nodejs'

// This route now redirects to regional endpoints to avoid timeouts
export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Return info about regional endpoints
  const regions = Object.entries(INDEED_REGIONS).map(([code, config]) => ({
    code,
    name: config.name,
    endpoint: `/api/cron/sync-indeed-region?region=${code}`,
    searches: config.searches.length
  }))

  return NextResponse.json({
    message: 'Indeed sync has been split into regional endpoints to avoid timeouts',
    regions,
    usage: 'Call each regional endpoint separately, e.g.: /api/cron/sync-indeed-region?region=us',
    tip: 'Set up separate cron jobs for each region on cron-job.org'
  })
}
