import { NextResponse } from 'next/server'
import { fetchIndeedJobs } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

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

async function handleSync() {
  // Auto-check quota
  const quotaCheck = await checkIndeedQuota()
  if (!quotaCheck.available) {
    return NextResponse.json({ success: false, message: quotaCheck.message, quotaAvailable: false })
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
