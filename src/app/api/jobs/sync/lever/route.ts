import { NextResponse } from 'next/server'
import { fetchLeverJobs } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

// Increase timeout for this route (Vercel Pro: up to 300s)
export const maxDuration = 60

async function handleSync() {
  try {
    const jobs = await fetchLeverJobs()
    const result = await syncJobs(jobs, 'lever')
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Lever sync error:', error)
    return NextResponse.json({ error: 'Failed to sync', details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return handleSync()
}

export async function POST() {
  return handleSync()
}
