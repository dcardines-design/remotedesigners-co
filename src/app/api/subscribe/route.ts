import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, is_active')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { message: 'You are already subscribed!' },
          { status: 200 }
        )
      } else {
        // Reactivate subscription
        await supabase
          .from('subscribers')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id)

        return NextResponse.json(
          { message: 'Welcome back! Your subscription has been reactivated.' },
          { status: 200 }
        )
      }
    }

    // Insert new subscriber
    const { error } = await supabase
      .from('subscribers')
      .insert({ email: email.toLowerCase() })

    if (error) {
      console.error('Subscription error:', error)
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      )
    }

    // Send welcome email
    if (resend) {
      try {
        await resend.emails.send({
          from: 'RemoteDesigners.co <hello@remotedesigners.co>',
          to: email,
          subject: 'Welcome to RemoteDesigners.co! 🎨',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="font-size: 24px; font-weight: 600; color: #171717; margin-bottom: 20px;">
                Welcome to RemoteDesigners.co!
              </h1>
              <p style="font-size: 16px; color: #525252; line-height: 1.6; margin-bottom: 20px;">
                You're now subscribed to receive the best remote design jobs delivered to your inbox daily.
              </p>
              <p style="font-size: 16px; color: #525252; line-height: 1.6; margin-bottom: 30px;">
                We'll send you a curated list of new opportunities in UI, UX, product design, and more.
              </p>
              <a href="https://remotedesigners.co" style="display: inline-block; background: #171717; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                Browse Jobs Now
              </a>
              <p style="font-size: 14px; color: #a3a3a3; margin-top: 40px;">
                You can unsubscribe at any time by clicking the link at the bottom of our emails.
              </p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error('Welcome email error:', emailError)
        // Don't fail the subscription if email fails
      }
    }

    return NextResponse.json(
      { message: 'Successfully subscribed! Check your inbox for a welcome email.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
