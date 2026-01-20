import { NextResponse } from 'next/server'
// import {
//   fetchJobStreetJobs, // Disabled: Returns 404 - API changed
//   fetchKalibrrJobs,   // Disabled: No direct apply links (links to Kalibrr page)
//   fetchInstahyreJobs, // Disabled: Returns 404 - API changed
//   fetchWantedlyJobs,  // Disabled: No direct apply links (links to Wantedly page)
// } from '@/lib/job-apis'
// import { syncJobs } from '@/lib/sync-jobs'

// Asia Part 2: ALL SOURCES DISABLED as of Jan 2026
// - JobStreet: 404 API changed
// - Instahyre: 404 API changed
// - Kalibrr: No direct apply links (links to Kalibrr page)
// - Wantedly: No direct apply links (links to Wantedly page)
async function handleSync() {
  // No working Asia sources with direct apply links
  const results: { sourceName: string; message: string }[] = []

  const sources: { name: string; fn: () => Promise<unknown[]> }[] = [
    // All disabled - no direct apply links:
    // { name: 'kalibrr', fn: fetchKalibrrJobs },
    // { name: 'wantedly', fn: fetchWantedlyJobs },
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
