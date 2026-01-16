import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { type } = await request.json()

    if (!type || !['view', 'click'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // Get current stats
    const { data: job } = await supabase
      .from('jobs')
      .select('views, clicks')
      .eq('id', id)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Increment the appropriate counter
    const updateData = type === 'view'
      ? { views: (job.views || 0) + 1 }
      : { clicks: (job.clicks || 0) + 1 }

    await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Track error:', error)
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 })
  }
}
