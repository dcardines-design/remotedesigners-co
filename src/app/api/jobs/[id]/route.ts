import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { extractIdFromSlug } from '@/lib/slug'

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
