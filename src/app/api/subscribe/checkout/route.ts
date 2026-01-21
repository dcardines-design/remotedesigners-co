import { NextResponse } from 'next/server'
import { createAuthSupabaseClient } from '@/lib/supabase-server'
import { createSubscriptionCheckout, type SubscriptionPlan } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase'

// TEST MODE: Disabled - use Stripe test keys instead
const TEST_MODE = process.env.SKIP_PAYMENT === 'true'

export async function POST(request: Request) {
  try {
    const { plan, email } = await request.json()

    if (!plan || !['monthly', 'quarterly', 'annual'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Validate required environment variables for production
    if (!TEST_MODE) {
      const stripeKey = process.env.STRIPE_SECRET_KEY
      if (!stripeKey) {
        console.error('STRIPE_SECRET_KEY is not configured')
        return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
      }
      // Check key format
      if (!stripeKey.startsWith('sk_live_') && !stripeKey.startsWith('sk_test_')) {
        console.error('STRIPE_SECRET_KEY has invalid format, starts with:', stripeKey.substring(0, 10))
        return NextResponse.json({ error: `Invalid Stripe key format (starts with: ${stripeKey.substring(0, 8)}...)` }, { status: 500 })
      }
      if (!process.env.NEXT_PUBLIC_APP_URL) {
        console.error('NEXT_PUBLIC_APP_URL is not configured')
        return NextResponse.json({ error: 'App URL not configured' }, { status: 500 })
      }
    }

    // Check if user is logged in
    const supabase = await createAuthSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminSupabase = createServerSupabaseClient()

    // Check if user already has an active subscription
    if (user) {
      const { data: existingSub } = await adminSupabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (existingSub) {
        return NextResponse.json({
          error: 'You already have an active subscription',
          alreadySubscribed: true,
        }, { status: 400 })
      }
    } else if (email) {
      // Check by email for non-logged-in users
      const { data: authUsers } = await adminSupabase.auth.admin.listUsers()
      const existingUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

      if (existingUser) {
        const { data: existingSub } = await adminSupabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', existingUser.id)
          .eq('status', 'active')
          .single()

        if (existingSub) {
          return NextResponse.json({
            error: 'This email already has an active subscription. Please log in.',
            alreadySubscribed: true,
          }, { status: 400 })
        }
      }
    }

    // TEST MODE: Create subscription directly without Stripe
    if (TEST_MODE) {
      // If user is logged in, use their id
      if (user) {
        const { error } = await adminSupabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            status: 'active',
            plan,
            stripe_subscription_id: 'test_' + Date.now(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }, { onConflict: 'user_id' })

        if (error) {
          console.error('Test subscription error:', error)
          throw new Error('Failed to create test subscription')
        }

        return NextResponse.json({
          testMode: true,
          success: true,
          message: 'Test subscription created!',
        })
      }

      // Not logged in - check if they have an account
      if (!email) {
        return NextResponse.json({
          testMode: true,
          needsEmail: true,
          error: 'Please enter your email'
        }, { status: 400 })
      }

      // Check if user exists in auth by email
      const { data: authUsers } = await adminSupabase.auth.admin.listUsers()
      const existingAuthUser = authUsers?.users?.find(u => u.email === email)

      if (existingAuthUser) {
        // User exists in auth - create subscription for them
        const { error } = await adminSupabase
          .from('subscriptions')
          .upsert({
            user_id: existingAuthUser.id,
            status: 'active',
            plan,
            stripe_subscription_id: 'test_' + Date.now(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }, { onConflict: 'user_id' })

        if (error) {
          console.error('Subscription error:', error)
          throw new Error('Failed to create subscription')
        }

        return NextResponse.json({
          testMode: true,
          success: true,
          message: 'Subscription created! Please log in to access premium features.',
          redirectToLogin: true,
        })
      }

      // User doesn't exist - ask them to sign up first
      return NextResponse.json({
        testMode: true,
        needsSignup: true,
        error: 'Please sign up first, then come back to subscribe.'
      }, { status: 400 })
    }

    // PRODUCTION: Create Stripe checkout session
    const session = await createSubscriptionCheckout(
      plan as SubscriptionPlan,
      email || user?.email,
      user?.id
    )

    if (!session.url) {
      throw new Error('Failed to create checkout session')
    }

    return NextResponse.json({
      checkoutUrl: session.url,
    })
  } catch (error) {
    console.error('Subscription checkout error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to create checkout session: ${errorMessage}` },
      { status: 500 }
    )
  }
}
