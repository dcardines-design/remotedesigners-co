import { NextResponse } from 'next/server'
// import {
//   fetchGlintsJobs,           // Disabled: Cloudflare blocked
//   fetchMyCareersFutureSGJobs, // Disabled: No direct apply links
//   fetchTokyoDevJobs,         // Disabled: Returns 406 - blocked
//   fetchNodeFlairJobs,        // Disabled: Returns 403 - blocked
//   fetchJoobleJobs,           // Disabled: Returns 403 - blocked
// } from '@/lib/job-apis'
// import { syncJobs } from '@/lib/sync-jobs'

// Asia Part 1: ALL SOURCES DISABLED as of Jan 2026
// - Glints: Cloudflare blocked
// - MyCareersFuture: No direct apply links (links to MCF page)
// - TokyoDev: 406 blocked
// - NodeFlair: 403 blocked
// - Jooble: 403 blocked
async function handleSync() {
  // No working Asia sources with direct apply links
  const results: { sourceName: string; message: string }[] = []

  // All sources disabled - see comments above
  const sources: { name: string; fn: () => Promise<unknown[]> }[] = [
    // { name: 'glints', fn: fetchGlintsJobs },
    // { name: 'mycareersfuture', fn: fetchMyCareersFutureSGJobs },
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
    console.error('Asia sync error:', error)
    return NextResponse.json({ error: 'Failed to sync', details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return handleSync()
}

export async function POST() {
  return handleSync()
}
