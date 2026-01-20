import { NextResponse } from 'next/server'
import {
  fetchJSearchJobs,
  fetchAdzunaJobs,
  // Disabled - no direct apply links (link to job board pages):
  // fetchArbeitnowJobs,
  // fetchHimalayasJobs,
  // fetchJobicyJobs,
  // fetchAuthenticJobs,
  // fetchWorkingNomadsJobs,
  // fetchMuseJobs,
} from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

// Vercel timeout (60s for Pro)
export const maxDuration = 60

async function handleSync() {
  try {
    const results = []

    // Fetch from smaller/faster APIs
    // Note: Ashby moved to dedicated /api/jobs/sync/ashby route with batching
    // Only sources with DIRECT apply links (not job board pages)
    const sources = [
      { name: 'jsearch', fn: fetchJSearchJobs },    // Direct: job_apply_link
      { name: 'adzuna', fn: fetchAdzunaJobs },      // Direct: redirect_url
      // Disabled - link to job board pages, not direct apply:
      // { name: 'arbeitnow', fn: fetchArbeitnowJobs },
      // { name: 'himalayas', fn: fetchHimalayasJobs },
      // { name: 'jobicy', fn: fetchJobicyJobs },
      // { name: 'authenticjobs', fn: fetchAuthenticJobs },
      // { name: 'workingnomads', fn: fetchWorkingNomadsJobs },
      // { name: 'muse', fn: fetchMuseJobs },
    ]

    for (const source of sources) {
      try {
        const jobs = await source.fn()
        const result = await syncJobs(jobs, source.name)
        results.push(result)
      } catch (err) {
        console.error(`${source.name} error:`, err)
        results.push({ source: source.name, error: String(err) })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Others sync error:', error)
    return NextResponse.json({ error: 'Failed to sync', details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return handleSync()
}

export async function POST() {
  return handleSync()
}
