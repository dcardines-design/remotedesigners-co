import { NextResponse } from 'next/server'
import { createAuthSupabaseClient } from '@/lib/supabase-server'
import { createSubscriptionCheckout, type SubscriptionPlan } from '@/lib/lemonsqueezy'

export async function POST(request: Request) {
  try {
    const { plan, email } = await request.json()

    if (!plan || !['monthly', 'quarterly', 'annual'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user is logged in
    const supabase = await createAuthSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Create checkout session
    const checkout = await createSubscriptionCheckout(
      plan as SubscriptionPlan,
      email,
      user?.id
    )

    if (!checkout.data?.data?.attributes?.url) {
      throw new Error('Failed to create checkout session')
    }

    return NextResponse.json({
      checkoutUrl: checkout.data.data.attributes.url,
    })
  } catch (error) {
    console.error('Subscription checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
