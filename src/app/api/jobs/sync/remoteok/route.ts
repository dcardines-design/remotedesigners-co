import { NextResponse } from 'next/server'
import { fetchRemoteOKJobs } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

async function handleSync() {
  try {
    const jobs = await fetchRemoteOKJobs()
    const result = await syncJobs(jobs, 'remoteok')
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('RemoteOK sync error:', error)
    return NextResponse.json({ error: 'Failed to sync', details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return handleSync()
}

export async function POST() {
  return handleSync()
}
