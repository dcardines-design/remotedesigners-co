import { NextRequest, NextResponse } from 'next/server'
import { JobPostingData, calculateTotal, PRICING } from '@/lib/lemonsqueezy'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { sendJobPostingReceipt } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const data: JobPostingData = await request.json()

    // Validate required fields
    const missing = []
    if (!data.title) missing.push('title')
    if (!data.company) missing.push('company')
    if (!data.description) missing.push('description')
    if (!data.apply_url) missing.push('apply_url')
    if (!data.poster_email) missing.push('poster_email')

    if (missing.length > 0) {
      console.error('Missing fields:', missing)
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    // Test mode: bypass payment and insert job directly
    console.log('NODE_ENV:', process.env.NODE_ENV)
    if (process.env.SKIP_PAYMENT === 'true' || process.env.NODE_ENV !== 'production') {
      const now = new Date()
      let stickyUntil = null
      if (data.sticky_7d) {
        stickyUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      } else if (data.sticky_24h) {
        stickyUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      }

      const jobData = {
        title: data.title,
        company: data.company,
        company_logo: data.company_logo || null,
        location: data.location || 'Remote',
        salary_min: data.salary_min || null,
        salary_max: data.salary_max || null,
        salary_text: null,
        description: data.description || null,
        job_type: data.job_type || 'full-time',
        experience_level: data.experience_level || null,
        skills: data.skills || [],
        apply_url: data.apply_url,
        source: 'posted',
        external_id: `test_${Date.now()}`,
        is_featured: data.is_featured || false,
        is_sticky: stickyUntil !== null,
        sticky_until: stickyUntil,
        is_rainbow: data.rainbow_border || false,
        is_active: true,
        posted_at: new Date().toISOString(),
        expires_at: data.extended_duration
          ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        posted_by: data.user_id || null,
        poster_email: data.poster_email.toLowerCase(),
      }

      const supabase = createAdminSupabaseClient()
      const { data: job, error } = await supabase
        .from('jobs')
        .insert(jobData)
        .select('id')
        .single()

      if (error) {
        console.error('Failed to insert job:', JSON.stringify(error, null, 2))
        return NextResponse.json({ error: `Failed to insert job: ${error.message}` }, { status: 500 })
      }

      console.log(`[TEST MODE] Job posted: ${jobData.title} at ${jobData.company}`)

      // Send receipt email
      const total = calculateTotal(data)
      sendJobPostingReceipt({
        title: data.title,
        company: data.company,
        location: data.location || 'Remote',
        poster_email: data.poster_email,
        job_id: job.id,
        is_featured: data.is_featured || false,
        sticky_24h: data.sticky_24h || false,
        sticky_7d: data.sticky_7d || false,
        rainbow_border: data.rainbow_border || false,
        extended_duration: data.extended_duration || false,
        total,
      }).catch(err => console.error('Failed to send receipt:', err))
      return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_APP_URL}/post-job/success?job_id=${job.id}` })
    }

    const storeId = process.env.LEMONSQUEEZY_STORE_ID!
    const variantId = process.env.LEMONSQUEEZY_VARIANT_BASE!

    // Build line items description
    const items: string[] = ['Job Posting (30 days) - $99']
    if (data.is_featured) items.push('Featured Listing - $50')
    if (data.sticky_24h) items.push('Sticky Post 24h - $79')
    if (data.sticky_7d) items.push('Sticky Post 7 Days - $149')
    if (data.rainbow_border) items.push('Rainbow Border - $39')
    if (data.extended_duration) items.push('Extended Duration - $49')

    // Create Lemon Squeezy checkout
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              custom: {
                title: data.title,
                company: data.company,
                company_logo: data.company_logo || '',
                location: data.location,
                salary_min: data.salary_min?.toString() || '',
                salary_max: data.salary_max?.toString() || '',
                description_1: data.description.slice(0, 500),
                description_2: data.description.slice(500, 1000),
                description_3: data.description.slice(1000, 1500),
                description_4: data.description.slice(1500, 2000),
                job_type: data.job_type,
                experience_level: data.experience_level,
                skills: JSON.stringify(data.skills),
                apply_url: data.apply_url,
                is_featured: data.is_featured ? 'true' : 'false',
                sticky_24h: data.sticky_24h ? 'true' : 'false',
                sticky_7d: data.sticky_7d ? 'true' : 'false',
                rainbow_border: data.rainbow_border ? 'true' : 'false',
                extended_duration: data.extended_duration ? 'true' : 'false',
                user_id: data.user_id || '',
                poster_email: data.poster_email.toLowerCase(),
              },
            },
            product_options: {
              name: `Job Posting${data.is_featured ? ' (Featured)' : ''}`,
              description: items.join('\n'),
              redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/post-job/success`,
            },
            checkout_options: {
              embed: false,
              media: false,
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId,
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId,
              },
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Lemon Squeezy error:', error)
      return NextResponse.json(
        { error: 'Failed to create checkout' },
        { status: 500 }
      )
    }

    const checkout = await response.json()
    return NextResponse.json({ url: checkout.data.attributes.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
