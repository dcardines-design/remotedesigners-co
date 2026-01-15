import { NextRequest, NextResponse } from 'next/server'
import { JobPostingData, calculateTotal, PRICING } from '@/lib/lemonsqueezy'

export async function POST(request: NextRequest) {
  try {
    const data: JobPostingData = await request.json()

    // Validate required fields
    if (!data.title || !data.company || !data.description || !data.apply_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const storeId = process.env.LEMONSQUEEZY_STORE_ID!
    const variantId = process.env.LEMONSQUEEZY_VARIANT_ID!

    // Build line items description
    const items: string[] = ['Job Posting (30 days) - $99']
    if (data.is_featured) items.push('Featured Listing - $50')
    if (data.social_boost) items.push('Social Boost - $29')
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
                social_boost: data.social_boost ? 'true' : 'false',
                extended_duration: data.extended_duration ? 'true' : 'false',
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
