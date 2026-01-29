// Clean up duplicate Wantedly jobs
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://urbmvgfxqygrxomcirub.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanup() {
  console.log('Fetching all Wantedly jobs...')

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, company, apply_url, posted_at')
    .eq('source', 'wantedly')
    .order('posted_at', { ascending: true })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log(`Found ${jobs?.length || 0} Wantedly jobs`)

  // Group by apply_url
  const byUrl = new Map<string, typeof jobs>()
  for (const job of jobs || []) {
    const existing = byUrl.get(job.apply_url) || []
    existing.push(job)
    byUrl.set(job.apply_url, existing)
  }

  // Find duplicates
  const toDelete: string[] = []
  for (const [url, jobList] of byUrl) {
    if (jobList.length > 1) {
      // Keep the first (oldest), delete the rest
      const duplicates = jobList.slice(1)
      for (const dup of duplicates) {
        toDelete.push(dup.id)
      }
      console.log(`"${jobList[0].title.slice(0, 40)}..." has ${jobList.length} copies, deleting ${duplicates.length}`)
    }
  }

  console.log(`\nDeleting ${toDelete.length} duplicate jobs...`)

  // Delete in batches
  const batchSize = 50
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize)
    const { error: delError } = await supabase
      .from('jobs')
      .delete()
      .in('id', batch)

    if (delError) {
      console.error('Delete error:', delError.message)
    } else {
      console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toDelete.length / batchSize)}`)
    }
  }

  console.log('\nDone!')
}

cleanup().catch(console.error)
