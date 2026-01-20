import { NextResponse } from 'next/server'
import {
  // fetchJobStreetJobs, // Disabled: Returns 404 - API changed
  fetchKalibrrJobs,
  // fetchInstahyreJobs, // Disabled: Returns 404 - API changed
  fetchWantedlyJobs,
} from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

// Asia Part 2: Kalibrr (Philippines), Wantedly (Japan)
// Note: JobStreet and Instahyre APIs changed/broken as of Jan 2026
async function handleSync() {
  try {
    const results = []

    const sources = [
      // Disabled sources - APIs changed/broken:
      // { name: 'jobstreet', fn: fetchJobStreetJobs },
      // { name: 'instahyre', fn: fetchInstahyreJobs },
      // Working sources:
      { name: 'kalibrr', fn: fetchKalibrrJobs },
      { name: 'wantedly', fn: fetchWantedlyJobs },
    ]

    for (const source of sources) {
      try {
        console.log(`Fetching from ${source.name}...`)
        const jobs = await source.fn()
        const result = await syncJobs(jobs, source.name)
        results.push({ sourceName: source.name, ...result })
        console.log(`${source.name}: ${result.inserted} inserted, ${result.skipped} skipped`)
      } catch (err) {
        console.error(`${source.name} error:`, err)
        results.push({ sourceName: source.name, error: String(err) })
      }
    }

    const totalInserted = results.reduce((sum, r) => sum + ('inserted' in r ? r.inserted : 0), 0)
    const totalSkipped = results.reduce((sum, r) => sum + ('skipped' in r ? r.skipped : 0), 0)

    return NextResponse.json({
      success: true,
      totalInserted,
      totalSkipped,
      results,
    })
  } catch (error) {
    console.error('Asia-2 sync error:', error)
    return NextResponse.json({ error: 'Failed to sync', details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return handleSync()
}

export async function POST() {
  return handleSync()
}
