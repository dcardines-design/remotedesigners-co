import { NextResponse } from 'next/server'
import {
  fetchArbeitnowJobs,
  fetchJSearchJobs,
  fetchHimalayasJobs,
  fetchJobicyJobs,
  fetchAuthenticJobs,
  fetchWorkingNomadsJobs,
  fetchMuseJobs,
  fetchAshbyJobs,
  fetchAdzunaJobs,
} from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

async function handleSync() {
  try {
    const results = []

    // Fetch from smaller/faster APIs
    const sources = [
      { name: 'arbeitnow', fn: fetchArbeitnowJobs },
      { name: 'jsearch', fn: fetchJSearchJobs },
      { name: 'himalayas', fn: fetchHimalayasJobs },
      { name: 'jobicy', fn: fetchJobicyJobs },
      { name: 'authenticjobs', fn: fetchAuthenticJobs },
      { name: 'workingnomads', fn: fetchWorkingNomadsJobs },
      { name: 'muse', fn: fetchMuseJobs },
      { name: 'ashby', fn: fetchAshbyJobs },
      { name: 'adzuna', fn: fetchAdzunaJobs },
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
