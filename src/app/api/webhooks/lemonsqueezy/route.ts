import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { postJobToTwitter } from '@/lib/twitter-service'

// Verify webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
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
        is_active: true,
        posted_at: new Date().toISOString(),
        // Set expiration based on extended duration
        expires_at: customData.extended_duration === 'true'
          ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
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

      // If social boost was purchased, tweet the job
      if (customData.social_boost === 'true' && job) {
        try {
          await postJobToTwitter(job)
          console.log(`Tweeted job: ${job.title}`)
        } catch (e) {
          console.error('Failed to tweet job:', e)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
