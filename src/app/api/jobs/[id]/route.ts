import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient, createAuthSupabaseClient } from '@/lib/supabase-server'
import { extractIdFromSlug } from '@/lib/slug'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const idOrSlug = params.id

    // Extract UUID from slug or use directly if it's already a UUID
    const uuid = extractIdFromSlug(idOrSlug)

    if (!uuid) {
      return NextResponse.json(
        { error: 'Invalid job ID or slug' },
        { status: 400 }
      )
    }

    // Direct UUID lookup
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', uuid)
      .single()

    if (error || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get the authenticated user
    const supabase = await createAuthSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First verify the user owns this job
    const { data: job, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('id, poster_email, posted_by')
      .eq('id', id)
      .single()

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check ownership - user must be the poster (by email or user_id)
    const isOwner =
      job.poster_email?.toLowerCase() === user.email?.toLowerCase() ||
      job.posted_by === user.id

    if (!isOwner) {
      return NextResponse.json({ error: 'Not authorized to delete this job' }, { status: 403 })
    }

    // Delete the job using admin client
    const { error: deleteError } = await supabaseAdmin
      .from('jobs')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting job:', deleteError)
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
