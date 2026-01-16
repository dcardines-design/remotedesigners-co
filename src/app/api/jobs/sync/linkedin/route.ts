import { NextResponse } from 'next/server'
import { fetchLinkedInJobs } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

async function handleSync() {
  try {
    console.log('Fetching LinkedIn jobs...')
    const jobs = await fetchLinkedInJobs()
    const result = await syncJobs(jobs, 'linkedin')

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('LinkedIn sync error:', error)
    return NextResponse.json({ error: 'Failed to sync', details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return handleSync()
}

export async function POST() {
  return handleSync()
}
