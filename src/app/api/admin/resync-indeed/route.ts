import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchIndeedJobs } from '@/lib/job-apis'
import { syncJobs } from '@/lib/sync-jobs'

export async function POST(request: Request) {
  // Only allow in development or with secret
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV !== 'development' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Delete existing Indeed jobs
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First count how many exist
    const { count: existingCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'indeed')

    console.log(`Found ${existingCount || 0} existing Indeed jobs`)

    // Delete them
    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('source', 'indeed')

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Delete failed', details: deleteError }, { status: 500 })
    }

    console.log(`Deleted Indeed jobs`)

    // Re-sync with fresh data
    const jobs = await fetchIndeedJobs()
    const result = await syncJobs(jobs, 'indeed')

    return NextResponse.json({
      success: true,
      deleted: existingCount || 0,
      ...result
    })
  } catch (error) {
    console.error('Resync error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
