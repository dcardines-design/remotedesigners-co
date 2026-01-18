import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function syncStripeSubscription(email: string) {
  console.log(`\nSyncing subscription for ${email}...`)

  // Check if tables exist first
  const { error: subsError } = await supabase.from('subscriptions').select('id').limit(1)
  if (subsError) {
    console.log('❌ Subscriptions table does not exist!')
    console.log('\n1. Go to: https://supabase.com/dashboard/project/urbmvgfxqygrxomcirub/sql/new')
    console.log('2. Copy the contents from: supabase/migrations/20260118_fix_subscriptions.sql')
    console.log('3. Click "Run" to execute the migration')
    console.log('4. Run this script again')
    return
  }

  // Find customer in Stripe
  const customers = await stripe.customers.list({ email, limit: 1 })
  if (!customers.data.length) {
    console.log('❌ No Stripe customer found for this email')
    return
  }

  const customer = customers.data[0]
  console.log(`Found customer: ${customer.id}`)

  // Get active subscription
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'active',
    limit: 1
  })

  if (!subscriptions.data.length) {
    console.log('❌ No active subscription found')
    return
  }

  const subscription = subscriptions.data[0]
  console.log(`Found subscription: ${subscription.id} (${subscription.status})`)

  // Find user in Supabase auth
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const user = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

  if (!user) {
    console.log('❌ No Supabase user found for this email')
    return
  }

  console.log(`Found user: ${user.id}`)

  // Insert/update subscription in database
  const subscriptionData = {
    user_id: user.id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customer.id,
    plan: subscription.items.data[0]?.price?.lookup_key || 'monthly',
    status: subscription.status,
    current_period_start: subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : null,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' })

  if (error) {
    console.log('❌ Failed to upsert subscription:', error.message)
    return
  }

  console.log('✓ Subscription synced successfully!')
  console.log(subscriptionData)
}

const email = process.argv[2] || 'dcardinesiii@gmail.com'
syncStripeSubscription(email).catch(console.error)
