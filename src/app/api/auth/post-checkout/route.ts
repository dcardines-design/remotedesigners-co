import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    const stripe = getStripe()

    // Verify the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      console.error('Session not paid:', session.id)
      return NextResponse.redirect(new URL('/', request.url))
    }

    // If user was already logged in (user_id in metadata), show welcome modal
    const userId = session.metadata?.user_id
    if (userId) {
      console.log(`User ${userId} was logged in, showing welcome modal`)
      return NextResponse.redirect(new URL('/?welcome=true', request.url))
    }

    const email = session.customer_email || session.customer_details?.email
    if (!email) {
      console.error('No email in session:', session.id)
      return NextResponse.redirect(new URL('/?welcome=true', request.url))
    }

    const supabase = createAdminSupabaseClient()
    const normalizedEmail = email.toLowerCase()

    // Check if user exists, create if not
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingUser = authUsers?.users?.find(
      u => u.email?.toLowerCase() === normalizedEmail
    )

    if (!existingUser) {
      // Create new user
      const { error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
      })

      if (createError) {
        console.error('Failed to create user:', createError)
        return NextResponse.redirect(new URL('/?welcome=true', request.url))
      }
      console.log(`Created new user for ${normalizedEmail}`)
    }

    // Generate magic link without sending email
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: {
        redirectTo: process.env.NEXT_PUBLIC_SITE_URL || 'https://remotedesigners.co',
      },
    })

    if (error || !data.properties?.action_link) {
      console.error('Failed to generate link:', error)
      return NextResponse.redirect(new URL('/?welcome=true', request.url))
    }

    // Redirect to the magic link (auto-login)
    return NextResponse.redirect(data.properties.action_link)

  } catch (error) {
    console.error('Post-checkout auth error:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}
