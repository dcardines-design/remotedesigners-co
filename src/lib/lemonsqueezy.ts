import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js'

// Initialize Lemon Squeezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
})

// Pricing - variant IDs from Lemon Squeezy dashboard
export const VARIANTS = {
  BASE_POSTING: process.env.LEMONSQUEEZY_VARIANT_BASE!, // $99 - 30 days
  FEATURED: process.env.LEMONSQUEEZY_VARIANT_FEATURED!, // $50 add-on
  SOCIAL_BOOST: process.env.LEMONSQUEEZY_VARIANT_SOCIAL!, // $29 add-on
  EXTENDED: process.env.LEMONSQUEEZY_VARIANT_EXTENDED!, // $49 add-on
}

export const PRICING = {
  BASE_POSTING: 99,
  FEATURED: 50,
  SOCIAL_BOOST: 29,
  EXTENDED_DURATION: 49,
}

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
  is_featured: boolean
  social_boost: boolean
  extended_duration: boolean
}

export function calculateTotal(data: JobPostingData): number {
  let total = PRICING.BASE_POSTING
  if (data.is_featured) total += PRICING.FEATURED
  if (data.social_boost) total += PRICING.SOCIAL_BOOST
  if (data.extended_duration) total += PRICING.EXTENDED_DURATION
  return total
}

export async function createJobCheckout(data: JobPostingData, storeId: string) {
  // Calculate total in cents
  const totalCents = calculateTotal(data) * 100

  // Create checkout with custom price
  const checkout = await createCheckout(storeId, VARIANTS.BASE_POSTING, {
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
        social_boost: data.social_boost ? 'true' : 'false',
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
