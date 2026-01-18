import { NextRequest, NextResponse } from 'next/server'
import { JobPostingData, calculateTotal, PRICING, createJobCheckout } from '@/lib/stripe'
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

    // Production: Create Stripe checkout session
    const session = await createJobCheckout(data)

    if (!session.url) {
      throw new Error('Failed to create checkout session URL')
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
