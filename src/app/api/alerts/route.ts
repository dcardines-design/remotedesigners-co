import { NextRequest, NextResponse } from 'next/server'
import { createAuthSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/alerts - Get logged-in user's job alert preferences
export async function GET() {
  try {
    const supabase = await createAuthSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get subscriber record matching user's email
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('id, email, is_active, frequency, preferences, last_email_sent_at, created_at')
      .eq('email', user.email?.toLowerCase())
      .single()

    if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching subscriber:', subError)
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      )
    }

    // Check if user has an active paid subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const isPaidUser = !!subscription

    if (!subscriber) {
      return NextResponse.json({
        hasAlerts: false,
        alert: null,
        isPaidUser
      })
    }

    return NextResponse.json({
      hasAlerts: true,
      alert: {
        id: subscriber.id,
        email: subscriber.email,
        isActive: subscriber.is_active,
        frequency: subscriber.frequency,
        preferences: subscriber.preferences || { jobTypes: [], locations: [] },
        lastEmailSentAt: subscriber.last_email_sent_at,
        createdAt: subscriber.created_at
      },
      isPaidUser
    })
  } catch (error) {
    console.error('Get alerts error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// PATCH /api/alerts - Update user's job alert (pause/resume)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createAuthSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { isActive, preferences } = await request.json()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (typeof isActive === 'boolean') {
      updateData.is_active = isActive
    }

    if (preferences) {
      updateData.preferences = {
        jobTypes: preferences.jobTypes || [],
        locations: preferences.locations || []
      }
    }

    const { error } = await supabase
      .from('subscribers')
      .update(updateData)
      .eq('email', user.email?.toLowerCase())

    if (error) {
      console.error('Update alert error:', error)
      return NextResponse.json(
        { error: 'Failed to update alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Patch alerts error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// DELETE /api/alerts - Delete user's job alert subscription
export async function DELETE() {
  try {
    const supabase = await createAuthSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Soft delete - just deactivate
    const { error } = await supabase
      .from('subscribers')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('email', user.email?.toLowerCase())

    if (error) {
      console.error('Delete alert error:', error)
      return NextResponse.json(
        { error: 'Failed to delete alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete alerts error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
