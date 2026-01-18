import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, preferences } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    if (!preferences || !preferences.jobTypes || !preferences.locations) {
      return NextResponse.json(
        { error: 'Job types and locations are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Check if subscriber exists
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, is_active')
      .eq('email', email.toLowerCase())
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'No subscription found for this email. Please subscribe first.' },
        { status: 404 }
      )
    }

    // Update preferences
    const { error } = await supabase
      .from('subscribers')
      .update({
        preferences: {
          jobTypes: preferences.jobTypes,
          locations: preferences.locations,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) {
      console.error('Preferences update error:', error)
      return NextResponse.json(
        { error: 'Failed to save preferences. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Preferences saved successfully!' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Preferences error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from('subscribers')
      .select('preferences')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !data) {
      return NextResponse.json(
        { preferences: null },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { preferences: data.preferences },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
