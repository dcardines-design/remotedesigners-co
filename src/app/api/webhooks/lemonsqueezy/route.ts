import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { postJobToTwitter } from '@/lib/twitter-service'
import { sendJobPostingReceipt } from '@/lib/email'
import { PRICING } from '@/lib/lemonsqueezy'

// Verify webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

// Handle subscription created/updated
async function handleSubscriptionEvent(event: Record<string, unknown>) {
  const supabase = createAdminSupabaseClient()
  const data = event.data as Record<string, unknown>
  const attributes = data.attributes as Record<string, unknown>
  const customData = (event.meta as Record<string, unknown>).custom_data as Record<string, string> || {}

  const userId = customData.user_id
  const plan = customData.plan || 'monthly'

  // Get user email from Lemon Squeezy
  const userEmail = attributes.user_email as string

  // Map status
  let status = 'active'
  const lsStatus = attributes.status as string
  if (lsStatus === 'cancelled') status = 'cancelled'
  else if (lsStatus === 'paused') status = 'paused'
  else if (lsStatus === 'expired') status = 'expired'
  else if (lsStatus === 'past_due') status = 'past_due'

  const subscriptionData = {
    lemon_squeezy_subscription_id: String(data.id),
    lemon_squeezy_customer_id: String(attributes.customer_id),
    lemon_squeezy_order_id: String(attributes.order_id),
    lemon_squeezy_variant_id: String(attributes.variant_id),
    plan,
    status,
    current_period_start: attributes.renews_at ? new Date(attributes.renews_at as string).toISOString() : null,
    current_period_end: attributes.ends_at ? new Date(attributes.ends_at as string).toISOString() : null,
    cancel_at_period_end: attributes.cancelled as boolean || false,
    customer_portal_url: (attributes.urls as Record<string, string>)?.customer_portal || null,
    update_payment_url: (attributes.urls as Record<string, string>)?.update_payment_method || null,
    updated_at: new Date().toISOString(),
  }

  // If we have a user_id, upsert by user_id
  if (userId) {
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        ...subscriptionData,
      }, {
        onConflict: 'user_id',
      })

    if (error) {
      console.error('Failed to upsert subscription:', error)
      throw error
    }
    console.log(`Subscription ${status} for user ${userId}`)
  } else if (userEmail) {
    // Find user by email and create subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail.toLowerCase())
      .single()

    if (profile) {
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: profile.id,
          ...subscriptionData,
        }, {
          onConflict: 'user_id',
        })

      if (error) {
        console.error('Failed to upsert subscription:', error)
        throw error
      }
      console.log(`Subscription ${status} for user ${profile.id}`)
    } else {
      console.log(`No user found for email ${userEmail}, subscription will be linked on next login`)
    }
  }
}

// Handle subscription cancellation/expiration
async function handleSubscriptionCancellation(event: Record<string, unknown>) {
  const supabase = createAdminSupabaseClient()
  const data = event.data as Record<string, unknown>
  const lsSubscriptionId = String(data.id)

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('lemon_squeezy_subscription_id', lsSubscriptionId)

  if (error) {
    console.error('Failed to cancel subscription:', error)
    throw error
  }

  console.log(`Subscription ${lsSubscriptionId} cancelled`)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature')

    // Verify webhook signature
    if (!signature || !verifySignature(body, signature, process.env.LEMONSQUEEZY_WEBHOOK_SECRET!)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const eventName = event.meta.event_name

    // Handle order_created event (payment completed)
    if (eventName === 'order_created') {
      const customData = event.meta.custom_data || {}

      // Reconstruct description from parts
      const description = [
        customData.description_1 || '',
        customData.description_2 || '',
        customData.description_3 || '',
        customData.description_4 || '',
      ].join('')

      // Calculate sticky expiration if purchased
      const now = new Date()
      let stickyUntil = null
      if (customData.sticky_7d === 'true') {
        stickyUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      } else if (customData.sticky_24h === 'true') {
        stickyUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }

      // Parse job data from custom data
      const jobData = {
        title: customData.title,
        company: customData.company,
        company_logo: customData.company_logo || null,
        location: customData.location || 'Remote',
        salary_min: customData.salary_min ? parseInt(customData.salary_min) : null,
        salary_max: customData.salary_max ? parseInt(customData.salary_max) : null,
        salary_text: null,
        description: description || null,
        job_type: customData.job_type || 'full-time',
        experience_level: customData.experience_level || null,
        skills: customData.skills ? JSON.parse(customData.skills) : [],
        apply_url: customData.apply_url,
        source: 'posted',
        external_id: `ls_${event.data.id}`, // Lemon Squeezy order ID
        is_featured: customData.is_featured === 'true',
        is_sticky: stickyUntil !== null,
        sticky_until: stickyUntil,
        is_rainbow: customData.rainbow_border === 'true',
        is_active: true,
        posted_at: new Date().toISOString(),
        // Set expiration based on extended duration
        expires_at: customData.extended_duration === 'true'
          ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        posted_by: customData.user_id || null,
        poster_email: customData.poster_email?.toLowerCase() || null,
      }

      // Insert job into database
      const supabase = createAdminSupabaseClient()
      const { data: job, error } = await supabase
        .from('jobs')
        .insert(jobData)
        .select('id, title, company, location, salary_min, salary_max, salary_text')
        .single()

      if (error) {
        console.error('Failed to insert job:', error)
        return NextResponse.json({ error: 'Failed to insert job' }, { status: 500 })
      }

      console.log(`Job posted: ${jobData.title} at ${jobData.company}`)

      // Send receipt email
      if (jobData.poster_email && job) {
        const isFeatured = customData.is_featured === 'true'
        const sticky24h = customData.sticky_24h === 'true'
        const sticky7d = customData.sticky_7d === 'true'
        const rainbowBorder = customData.rainbow_border === 'true'
        const extendedDuration = customData.extended_duration === 'true'

        let total = PRICING.BASE_POSTING
        if (isFeatured) total += PRICING.FEATURED
        if (sticky24h) total += PRICING.STICKY_24H
        if (sticky7d) total += PRICING.STICKY_7D
        if (rainbowBorder) total += PRICING.RAINBOW_BORDER
        if (extendedDuration) total += PRICING.EXTENDED_DURATION

        sendJobPostingReceipt({
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          poster_email: jobData.poster_email,
          job_id: job.id,
          is_featured: isFeatured,
          sticky_24h: sticky24h,
          sticky_7d: sticky7d,
          rainbow_border: rainbowBorder,
          extended_duration: extendedDuration,
          total,
        }).catch(err => console.error('Failed to send receipt:', err))
      }

      // Tweet featured jobs automatically
      if (customData.is_featured === 'true' && job) {
        try {
          await postJobToTwitter(job)
          console.log(`Tweeted featured job: ${job.title}`)
        } catch (e) {
          console.error('Failed to tweet job:', e)
        }
      }
    }

    // Handle subscription events
    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      await handleSubscriptionEvent(event)
    }

    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
      await handleSubscriptionCancellation(event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
