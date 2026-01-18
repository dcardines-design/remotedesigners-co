import { NextResponse } from 'next/server'
import { createAuthSupabaseClient } from '@/lib/supabase-server'
import { createPortalSession } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createAuthSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL))
    }

    // Get the user's Stripe customer ID from subscriptions table
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_customer_id) {
      // No subscription found, redirect to membership page
      return NextResponse.redirect(new URL('/membership', process.env.NEXT_PUBLIC_APP_URL))
    }

    // Create a portal session
    const portalSession = await createPortalSession(
      subscription.stripe_customer_id,
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    )

    // Redirect to Stripe portal
    return NextResponse.redirect(portalSession.url)
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.redirect(new URL('/?error=billing', process.env.NEXT_PUBLIC_APP_URL))
  }
}
