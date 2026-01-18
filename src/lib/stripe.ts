import Stripe from 'stripe'

// Lazy initialization of Stripe client to avoid build-time errors
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}

// Export for backward compatibility (use getStripe() in API routes for better error handling)
export const stripe = {
  get checkout() { return getStripe().checkout },
  get customers() { return getStripe().customers },
  get subscriptions() { return getStripe().subscriptions },
  get billingPortal() { return getStripe().billingPortal },
  get webhooks() { return getStripe().webhooks },
}

// Pricing (in USD)
export const PRICING = {
  BASE_POSTING: 99,
  FEATURED: 50,
  STICKY_24H: 79,
  STICKY_7D: 149,
  RAINBOW_BORDER: 39,
  EXTENDED_DURATION: 49,
}

// Stripe Price IDs for Job Postings
export const JOB_POSTING_PRICES = {
  BASE_POSTING: process.env.STRIPE_PRICE_BASE_POSTING || '',
  FEATURED: process.env.STRIPE_PRICE_FEATURED || '',
  STICKY_24H: process.env.STRIPE_PRICE_STICKY_24H || '',
  STICKY_7D: process.env.STRIPE_PRICE_STICKY_7D || '',
  RAINBOW_BORDER: process.env.STRIPE_PRICE_RAINBOW_BORDER || '',
  EXTENDED_DURATION: process.env.STRIPE_PRICE_EXTENDED_DURATION || '',
}

// Subscription Pricing (in USD)
export const SUBSCRIPTION_PRICING = {
  MONTHLY: 12.99,
  QUARTERLY: 29, // ~$9.67/mo (25% off)
  ANNUAL: 49, // ~$4.08/mo (68% off)
}

export type SubscriptionPlan = 'monthly' | 'quarterly' | 'annual'

// Free tier limit
export const FREE_JOBS_LIMIT = 20

export interface JobPostingData {
  title: string
  company: string
  company_logo?: string
  location: string
  salary_min?: number
  salary_max?: number
  description: string
  job_type: string
  experience_level: string
  skills: string[]
  apply_url: string
  poster_email: string
  is_featured: boolean
  sticky_24h: boolean
  sticky_7d: boolean
  rainbow_border: boolean
  extended_duration: boolean
  user_id?: string
}

export function calculateTotal(data: JobPostingData): number {
  let total = PRICING.BASE_POSTING
  if (data.is_featured) total += PRICING.FEATURED
  if (data.sticky_24h) total += PRICING.STICKY_24H
  if (data.sticky_7d) total += PRICING.STICKY_7D
  if (data.rainbow_border) total += PRICING.RAINBOW_BORDER
  if (data.extended_duration) total += PRICING.EXTENDED_DURATION
  return total
}

// Build line items for job posting checkout using Stripe Price IDs
function buildLineItems(data: JobPostingData): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: JOB_POSTING_PRICES.BASE_POSTING,
      quantity: 1,
    },
  ]

  if (data.is_featured) {
    lineItems.push({
      price: JOB_POSTING_PRICES.FEATURED,
      quantity: 1,
    })
  }

  if (data.sticky_24h) {
    lineItems.push({
      price: JOB_POSTING_PRICES.STICKY_24H,
      quantity: 1,
    })
  }

  if (data.sticky_7d) {
    lineItems.push({
      price: JOB_POSTING_PRICES.STICKY_7D,
      quantity: 1,
    })
  }

  if (data.rainbow_border) {
    lineItems.push({
      price: JOB_POSTING_PRICES.RAINBOW_BORDER,
      quantity: 1,
    })
  }

  if (data.extended_duration) {
    lineItems.push({
      price: JOB_POSTING_PRICES.EXTENDED_DURATION,
      quantity: 1,
    })
  }

  return lineItems
}

export async function createJobCheckout(data: JobPostingData) {
  const lineItems = buildLineItems(data)

  // Store job data in metadata (Stripe has 500 char limit per value, 50 keys max)
  // We'll store essential data and use a simpler approach
  const metadata: Record<string, string> = {
    title: data.title.slice(0, 500),
    company: data.company.slice(0, 500),
    company_logo: (data.company_logo || '').slice(0, 500),
    location: data.location.slice(0, 500),
    salary_min: data.salary_min?.toString() || '',
    salary_max: data.salary_max?.toString() || '',
    job_type: data.job_type,
    experience_level: data.experience_level || '',
    skills: JSON.stringify(data.skills).slice(0, 500),
    apply_url: data.apply_url.slice(0, 500),
    poster_email: data.poster_email.toLowerCase(),
    is_featured: data.is_featured ? 'true' : 'false',
    sticky_24h: data.sticky_24h ? 'true' : 'false',
    sticky_7d: data.sticky_7d ? 'true' : 'false',
    rainbow_border: data.rainbow_border ? 'true' : 'false',
    extended_duration: data.extended_duration ? 'true' : 'false',
    user_id: data.user_id || '',
    // Store description in chunks (Stripe metadata value limit is 500 chars)
    description_1: data.description.slice(0, 500),
    description_2: data.description.slice(500, 1000),
    description_3: data.description.slice(1000, 1500),
    description_4: data.description.slice(1500, 2000),
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/post-job/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/post-job`,
    customer_email: data.poster_email.toLowerCase(),
    metadata,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  })

  return session
}

export async function createSubscriptionCheckout(
  plan: SubscriptionPlan,
  email?: string,
  userId?: string,
  customerId?: string
) {
  const priceAmount = SUBSCRIPTION_PRICING[plan.toUpperCase() as keyof typeof SUBSCRIPTION_PRICING]

  // Determine billing interval
  let interval: 'month' | 'year' = 'month'
  let intervalCount = 1

  if (plan === 'quarterly') {
    interval = 'month'
    intervalCount = 3
  } else if (plan === 'annual') {
    interval = 'year'
    intervalCount = 1
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Remote Designers ${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`,
            description: 'Unlimited saved jobs and premium features',
          },
          unit_amount: Math.round(priceAmount * 100), // Convert to cents
          recurring: {
            interval,
            interval_count: intervalCount,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?welcome=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/membership`,
    metadata: {
      user_id: userId || '',
      plan,
    },
    subscription_data: {
      metadata: {
        user_id: userId || '',
        plan,
      },
    },
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  }

  // Add customer email or existing customer
  if (customerId) {
    sessionParams.customer = customerId
  } else if (email) {
    sessionParams.customer_email = email.toLowerCase()
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return session
}

// Helper to get or create a Stripe customer
export async function getOrCreateCustomer(email: string, name?: string): Promise<Stripe.Customer> {
  // Search for existing customer by email
  const existingCustomers = await stripe.customers.list({
    email: email.toLowerCase(),
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email: email.toLowerCase(),
    name: name || undefined,
  })

  return customer
}

// Create a customer portal session for managing subscriptions
export async function createPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string, atPeriodEnd = true) {
  if (atPeriodEnd) {
    // Cancel at end of billing period
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
    return subscription
  } else {
    // Cancel immediately
    const subscription = await stripe.subscriptions.cancel(subscriptionId)
    return subscription
  }
}

// Retrieve a checkout session with expanded data
export async function retrieveCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['customer', 'subscription', 'payment_intent'],
  })
  return session
}
