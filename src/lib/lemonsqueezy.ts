import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js'

// Initialize Lemon Squeezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
})

// Single variant ID - pricing is calculated dynamically
export const BASE_VARIANT_ID = process.env.LEMONSQUEEZY_VARIANT_ID!

// Subscription variant IDs
export const SUBSCRIPTION_VARIANTS = {
  MONTHLY: process.env.LEMONSQUEEZY_VARIANT_MONTHLY!,
  QUARTERLY: process.env.LEMONSQUEEZY_VARIANT_QUARTERLY!,
  ANNUAL: process.env.LEMONSQUEEZY_VARIANT_ANNUAL!,
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

export async function createJobCheckout(data: JobPostingData, storeId: string) {
  // Calculate total in cents
  const totalCents = calculateTotal(data) * 100

  // Create checkout with custom price
  const checkout = await createCheckout(storeId, BASE_VARIANT_ID, {
    checkoutOptions: {
      embed: false,
      media: false,
    },
    checkoutData: {
      custom: {
        // Store job data in custom fields
        title: data.title,
        company: data.company,
        company_logo: data.company_logo || '',
        location: data.location,
        salary_min: data.salary_min?.toString() || '',
        salary_max: data.salary_max?.toString() || '',
        description: data.description.slice(0, 2000), // Lemon Squeezy has limits
        job_type: data.job_type,
        experience_level: data.experience_level,
        skills: JSON.stringify(data.skills),
        apply_url: data.apply_url,
        is_featured: data.is_featured ? 'true' : 'false',
        sticky_24h: data.sticky_24h ? 'true' : 'false',
        sticky_7d: data.sticky_7d ? 'true' : 'false',
        rainbow_border: data.rainbow_border ? 'true' : 'false',
        extended_duration: data.extended_duration ? 'true' : 'false',
      },
    },
    productOptions: {
      name: 'Job Posting',
      description: `Post a job on Remote Designers${data.is_featured ? ' (Featured)' : ''}`,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/post-job/success`,
    },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
  })

  return checkout
}

export async function createSubscriptionCheckout(
  plan: SubscriptionPlan,
  email: string,
  userId?: string,
  storeId?: string
) {
  const variantId = SUBSCRIPTION_VARIANTS[plan.toUpperCase() as keyof typeof SUBSCRIPTION_VARIANTS]
  const store = storeId || process.env.LEMONSQUEEZY_STORE_ID!

  const checkout = await createCheckout(store, variantId, {
    checkoutOptions: {
      embed: true, // Overlay checkout
      media: false,
    },
    checkoutData: {
      email,
      custom: {
        user_id: userId || '',
        plan,
      },
    },
    productOptions: {
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/?subscribed=true`,
    },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
  })

  return checkout
}
