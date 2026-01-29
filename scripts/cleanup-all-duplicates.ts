// Clean up ALL duplicate jobs across all sources
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://urbmvgfxqygrxomcirub.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanup() {
  console.log('Fetching all jobs...')

  // Fetch all jobs (might need pagination for large datasets)
  let allJobs: any[] = []
  let offset = 0
  const limit = 1000

  while (true) {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, company, apply_url, source, posted_at')
      .order('posted_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error:', error.message)
      break
    }

    if (!jobs || jobs.length === 0) break

    allJobs = allJobs.concat(jobs)
    offset += limit

    if (jobs.length < limit) break
  }

  console.log(`Found ${allJobs.length} total jobs`)

  // Group by apply_url (primary duplicate indicator)
  const byUrl = new Map<string, typeof allJobs>()
  for (const job of allJobs) {
    if (!job.apply_url) continue
    const existing = byUrl.get(job.apply_url) || []
    existing.push(job)
    byUrl.set(job.apply_url, existing)
  }

  // Find all duplicates
  const toDelete: string[] = []
  const duplicateGroups: { title: string; count: number; source: string }[] = []

  for (const [url, jobList] of byUrl) {
    if (jobList.length > 1) {
      // Keep the first (oldest), delete the rest
      const duplicates = jobList.slice(1)
      for (const dup of duplicates) {
        toDelete.push(dup.id)
      }
      duplicateGroups.push({
        title: jobList[0].title.slice(0, 50),
        count: jobList.length,
        source: jobList[0].source
      })
    }
  }

  // Sort by count descending and show top duplicates
  duplicateGroups.sort((a, b) => b.count - a.count)
  console.log('\nTop duplicates:')
  for (const group of duplicateGroups.slice(0, 20)) {
    console.log(`  [${group.source}] "${group.title}..." x${group.count}`)
  }

  console.log(`\nTotal duplicate entries to delete: ${toDelete.length}`)

  if (toDelete.length === 0) {
    console.log('No duplicates found!')
    return
  }

  // Delete in batches
  console.log('Deleting duplicates...')
  const batchSize = 100
  let deleted = 0

  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize)
    const { error: delError } = await supabase
      .from('jobs')
      .delete()
      .in('id', batch)

    if (delError) {
      console.error('Delete error:', delError.message)
    } else {
      deleted += batch.length
      process.stdout.write(`\rDeleted ${deleted}/${toDelete.length}`)
    }
  }

  console.log('\n\nDone!')

  // Show final count
  const { count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })

  console.log(`Total jobs remaining: ${count}`)
}

cleanup().catch(console.error)
