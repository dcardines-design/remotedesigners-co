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

    const supabase = createServerSupabaseClient()

    // Check if subscriber exists
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, is_active')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      // Update existing subscriber's preferences
      const { error } = await supabase
        .from('subscribers')
        .update({
          preferences: {
            jobTypes: preferences?.jobTypes || [],
            locations: preferences?.locations || [],
          },
          is_active: true,
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
    } else {
      // Create new subscriber with preferences
      const { error } = await supabase
        .from('subscribers')
        .insert({
          email: email.toLowerCase(),
          is_active: true,
          frequency: 'daily',
          preferences: {
            jobTypes: preferences?.jobTypes || [],
            locations: preferences?.locations || [],
          },
        })

      if (error) {
        console.error('Subscriber creation error:', error)
        return NextResponse.json(
          { error: 'Failed to create alert. Please try again.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { message: 'Job alert created successfully!' },
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
