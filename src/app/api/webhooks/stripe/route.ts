import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe, PRICING } from '@/lib/stripe'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { postJobToTwitter } from '@/lib/twitter-service'
import { sendJobPostingReceipt } from '@/lib/email'

// Stripe webhook handler
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event | null = null
  const stripe = getStripe()

  // Try both test and live webhook secrets
  const secrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_TEST,
    process.env.STRIPE_WEBHOOK_SECRET_LIVE,
  ].filter(Boolean) as string[]

  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret)
      break
    } catch {
      // Try next secret
    }
  }

  if (!event) {
    console.error('Webhook signature verification failed with all secrets')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()

  try {
    switch (event.type) {
      // Job posting payment completed
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Only handle one-time payments for job postings (mode === 'payment')
        if (session.mode === 'payment') {
          await handleJobPaymentCompleted(session, supabase)
        }

        // Handle subscription checkout completion
        if (session.mode === 'subscription') {
          await handleSubscriptionCheckoutCompleted(session, supabase)
        }

        break
      }

      // Subscription created
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(subscription, supabase)
        break
      }

      // Subscription updated (plan change, renewal, etc.)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription, supabase)
        break
      }

      // Subscription deleted/cancelled
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription, supabase)
        break
      }

      // Invoice paid (subscription renewal or new subscription)
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null }
        if (invoice.subscription && invoice.customer_email) {
          console.log(`Invoice paid for subscription ${invoice.subscription}`)

          // Send confirmation email
          const { sendSubscriptionConfirmation } = await import('@/lib/email')
          await sendSubscriptionConfirmation({
            email: invoice.customer_email,
            plan: invoice.lines?.data?.[0]?.description || 'Subscription',
            amount: (invoice.amount_paid || 0) / 100,
          })
        }
        break
      }

      // Invoice payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`Payment failed for invoice ${invoice.id}`)

        // Send failure notification email
        if (invoice.customer_email) {
          const { sendPaymentFailedEmail } = await import('@/lib/email')
          await sendPaymentFailedEmail({
            email: invoice.customer_email,
            reason: invoice.last_finalization_error?.message,
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Handle job posting payment
async function handleJobPaymentCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createAdminSupabaseClient>
) {
  const metadata = session.metadata || {}

  // Reconstruct description from parts
  const description = [
    metadata.description_1 || '',
    metadata.description_2 || '',
    metadata.description_3 || '',
    metadata.description_4 || '',
  ].join('')

  // Calculate sticky expiration if purchased
  const now = new Date()
  let stickyUntil = null
  if (metadata.sticky_7d === 'true') {
    stickyUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  } else if (metadata.sticky_24h === 'true') {
    stickyUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  }

  // Parse skills if present
  let skills: string[] = []
  try {
    skills = metadata.skills ? JSON.parse(metadata.skills) : []
  } catch {
    skills = []
  }

  const jobData = {
    title: metadata.title,
    company: metadata.company,
    company_logo: metadata.company_logo || null,
    location: metadata.location || 'Remote',
    salary_min: metadata.salary_min ? parseInt(metadata.salary_min) : null,
    salary_max: metadata.salary_max ? parseInt(metadata.salary_max) : null,
    salary_text: null,
    description: description || null,
    job_type: metadata.job_type || 'full-time',
    experience_level: metadata.experience_level || null,
    skills,
    apply_url: metadata.apply_url,
    source: 'posted',
    external_id: `stripe_${session.id}`, // Stripe session ID
    is_featured: metadata.is_featured === 'true',
    is_sticky: stickyUntil !== null,
    sticky_until: stickyUntil,
    is_rainbow: metadata.rainbow_border === 'true',
    is_active: true,
    posted_at: new Date().toISOString(),
    expires_at: metadata.extended_duration === 'true'
      ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    posted_by: metadata.user_id || null,
    poster_email: metadata.poster_email?.toLowerCase() || null,
  }

  // Check if job already exists (idempotency check for webhook retries)
  const { data: existingJob } = await supabase
    .from('jobs')
    .select('id')
    .eq('external_id', jobData.external_id)
    .single()

  if (existingJob) {
    console.log(`Job already exists for session ${session.id}, skipping duplicate`)
    return
  }

  // Insert job into database
  const { data: job, error } = await supabase
    .from('jobs')
    .insert(jobData)
    .select('id, title, company, location, salary_min, salary_max, salary_text')
    .single()

  if (error) {
    // Handle race condition where job was inserted between check and insert
    if (error.code === '23505') { // Unique constraint violation
      console.log(`Job already exists (race condition) for session ${session.id}`)
      return
    }
    console.error('Failed to insert job:', error)
    throw error
  }

  console.log(`Job posted: ${jobData.title} at ${jobData.company}`)

  // Send receipt email
  if (jobData.poster_email && job) {
    const isFeatured = metadata.is_featured === 'true'
    const sticky24h = metadata.sticky_24h === 'true'
    const sticky7d = metadata.sticky_7d === 'true'
    const rainbowBorder = metadata.rainbow_border === 'true'
    const extendedDuration = metadata.extended_duration === 'true'

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
  if (metadata.is_featured === 'true' && job) {
    try {
      await postJobToTwitter(job)
      console.log(`Tweeted featured job: ${job.title}`)
    } catch (e) {
      console.error('Failed to tweet job:', e)
    }
  }
}

// Handle subscription checkout completed
async function handleSubscriptionCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createAdminSupabaseClient>
) {
  const metadata = session.metadata || {}
  const userId = metadata.user_id
  const customerEmail = session.customer_email || session.customer_details?.email

  if (!customerEmail) {
    console.error('No customer email in session')
    return
  }

  // Find or create user
  let finalUserId = userId

  if (!finalUserId) {
    // Try to find user by email
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingUser = authUsers?.users?.find(
      u => u.email?.toLowerCase() === customerEmail.toLowerCase()
    )

    if (existingUser) {
      finalUserId = existingUser.id
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: customerEmail.toLowerCase(),
        email_confirm: true,
      })

      if (createError || !newUser.user) {
        console.error('Failed to create user:', createError)
        return
      }

      finalUserId = newUser.user.id
      console.log(`Created new user ${finalUserId} for email ${customerEmail}`)
      // Magic link email is sent in handleSubscriptionCreated
    }
  }

  console.log(`Subscription checkout completed for user ${finalUserId}`)
}

// Handle subscription created
async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createAdminSupabaseClient>
) {
  const metadata = subscription.metadata || {}
  let userId: string | undefined = metadata.user_id
  let wasLoggedIn = Boolean(userId) // Track if user was logged in when subscribing

  // Get customer email from Stripe
  const stripe = getStripe()
  const customer = await stripe.customers.retrieve(subscription.customer as string)
  if (customer.deleted || !('email' in customer) || !customer.email) {
    console.error('Cannot find customer email for subscription', subscription.id)
    return
  }
  const customerEmail = customer.email.toLowerCase()

  // If we have a user_id in metadata, verify it exists
  if (userId) {
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const userExists = authUsers?.users?.find(u => u.id === userId)

    if (!userExists) {
      console.log(`User ${userId} from metadata doesn't exist, will find/create by email`)
      userId = undefined
      wasLoggedIn = false
    }
  }

  // If no valid userId, find or create user by email
  if (!userId) {
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingUser = authUsers?.users?.find(
      u => u.email?.toLowerCase() === customerEmail
    )

    if (existingUser) {
      userId = existingUser.id
      console.log(`Found existing user ${userId} for email ${customerEmail}`)
    } else {
      // Create new user first (so subscription can be tied to them immediately)
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: customerEmail,
        email_confirm: true,
      })

      if (createError || !newUser.user) {
        console.error('Failed to create user:', createError)
        return
      }

      userId = newUser.user.id
      console.log(`Created new user ${userId} for email ${customerEmail}`)
    }
  }

  // Create subscription tied to user
  await upsertSubscription(subscription, userId, supabase)

  // Note: Auto-login is handled by /api/auth/post-checkout endpoint
  // No magic link email needed - user is redirected and logged in automatically
  console.log(`Subscription created for user ${userId} (wasLoggedIn: ${wasLoggedIn})`)
}

// Handle subscription updated
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createAdminSupabaseClient>
) {
  // Find subscription by Stripe ID
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (existingSub) {
    await upsertSubscription(subscription, existingSub.user_id, supabase)
  } else {
    // Subscription doesn't exist in DB - treat it like a new subscription
    console.log(`No existing subscription found for ${subscription.id}, creating it`)
    await handleSubscriptionCreated(subscription, supabase)
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createAdminSupabaseClient>
) {
  // Get the user_id before updating
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Failed to cancel subscription:', error)
    throw error
  }

  // Update profile's is_subscribed flag to false
  if (existingSub?.user_id) {
    await supabase
      .from('profiles')
      .update({ is_subscribed: false })
      .eq('id', existingSub.user_id)
  }

  console.log(`Subscription ${subscription.id} cancelled`)
}

// Extended Subscription type for properties that exist in the API but may not be in SDK types
interface SubscriptionWithPeriods extends Stripe.Subscription {
  current_period_start?: number
  current_period_end?: number
}

// Upsert subscription data
async function upsertSubscription(
  subscription: Stripe.Subscription,
  userId: string,
  supabase: ReturnType<typeof createAdminSupabaseClient>
) {
  const sub = subscription as SubscriptionWithPeriods

  // Map Stripe status to our status
  let status = 'active'
  if (sub.status === 'canceled') status = 'cancelled'
  else if (sub.status === 'paused') status = 'paused'
  else if (sub.status === 'past_due') status = 'past_due'
  else if (sub.status === 'unpaid') status = 'expired'
  else if (sub.status === 'incomplete') status = 'incomplete'
  else if (sub.status === 'incomplete_expired') status = 'expired'
  else if (sub.status === 'trialing') status = 'trialing'
  else if (sub.status === 'active') status = 'active'

  const plan = sub.metadata?.plan || 'monthly'

  // Get period timestamps (may be on subscription or first item)
  const periodStart = sub.current_period_start
    ? new Date(sub.current_period_start * 1000).toISOString()
    : null
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null

  const subscriptionData = {
    user_id: userId,
    stripe_subscription_id: sub.id,
    stripe_customer_id: sub.customer as string,
    plan,
    status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'user_id',
    })

  if (error) {
    console.error('Failed to upsert subscription:', error)
    throw error
  }

  // Update profile's is_subscribed flag
  const isActive = ['active', 'trialing'].includes(status)
  await supabase
    .from('profiles')
    .update({ is_subscribed: isActive })
    .eq('id', userId)

  console.log(`Subscription ${status} for user ${userId}, is_subscribed: ${isActive}`)
}
