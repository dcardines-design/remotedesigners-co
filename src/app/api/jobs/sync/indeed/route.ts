import { NextResponse } from 'next/server'
import { fetchIndeedJobs } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

async function handleSync() {
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
