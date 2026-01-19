import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Resend } from 'resend'
import { generateJobSlug } from '@/lib/slug'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return false
  }
  return true
}

interface Job {
  id: string
  title: string
  company: string
  company_logo?: string
  location: string
  salary_min?: number
  salary_max?: number
  salary_text?: string
  job_type: string
  posted_at: string
}

interface Subscriber {
  id: string
  email: string
  unsubscribe_token: string
  last_email_sent_at?: string
  preferences?: {
    jobTypes?: string[]
    locations?: string[]
  }
}

interface SubscriberWithTier extends Subscriber {
  isPaidUser: boolean
}

// Get subscribers with their tier (paid vs free) based on subscription status
async function getSubscribersWithTier(supabase: ReturnType<typeof createServerSupabaseClient>): Promise<SubscriberWithTier[]> {
  // Get all active subscribers
  const { data: subscribers, error: subError } = await supabase
    .from('subscribers')
    .select('id, email, unsubscribe_token, preferences, last_email_sent_at')
    .eq('is_active', true)

  if (subError || !subscribers) {
    console.error('Error fetching subscribers:', subError)
    return []
  }

  // Get paid users' emails (users with active subscriptions)
  const { data: paidUsers } = await supabase
    .from('profiles')
    .select('email, subscriptions!inner(status)')
    .eq('subscriptions.status', 'active')

  const paidEmails = new Set(paidUsers?.map(p => p.email.toLowerCase()) || [])

  return subscribers.map(sub => ({
    ...sub,
    isPaidUser: paidEmails.has(sub.email.toLowerCase())
  }))
}

// Check if we should send to a subscriber based on their tier and last email time
function shouldSendToSubscriber(subscriber: SubscriberWithTier, now: Date): boolean {
  // Paid users: always send (daily)
  if (subscriber.isPaidUser) return true

  // Free users: weekly (167+ hours since last email to allow for cron timing variance)
  if (!subscriber.last_email_sent_at) return true

  const lastSent = new Date(subscriber.last_email_sent_at)
  const hoursSince = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60)
  return hoursSince >= 167
}

// Job type keyword mapping for filtering
const JOB_TYPE_KEYWORDS: Record<string, string[]> = {
  'product-design': ['product design', 'product designer'],
  'ux-design': ['ux design', 'ux designer', 'user experience'],
  'ui-design': ['ui design', 'ui designer', 'user interface'],
  'visual-design': ['visual design', 'visual designer'],
  'brand-design': ['brand design', 'brand designer', 'branding'],
  'graphic-design': ['graphic design', 'graphic designer'],
  'motion-design': ['motion design', 'motion designer', 'motion graphics', 'animator'],
  'interaction-design': ['interaction design', 'interaction designer', 'ixd'],
  'web-design': ['web design', 'web designer'],
  'design-systems': ['design system', 'design ops'],
  'design-lead': ['design lead', 'design director', 'head of design', 'design manager', 'vp design'],
  'user-research': ['user research', 'ux research', 'researcher'],
}

// Location keyword mapping for filtering
const LOCATION_KEYWORDS: Record<string, string[]> = {
  'worldwide': ['remote', 'worldwide', 'anywhere', 'global'],
  'usa': ['usa', 'united states', 'us', 'america', 'new york', 'san francisco', 'los angeles', 'seattle', 'austin', 'boston', 'chicago'],
  'europe': ['europe', 'eu', 'european'],
  'uk': ['uk', 'united kingdom', 'london', 'england', 'britain'],
  'canada': ['canada', 'toronto', 'vancouver', 'montreal'],
  'germany': ['germany', 'berlin', 'munich', 'german'],
  'north-america': ['north america', 'usa', 'canada', 'us'],
  'latin-america': ['latin america', 'latam', 'south america', 'brazil', 'mexico', 'argentina'],
  'asia': ['asia', 'singapore', 'japan', 'india', 'china', 'hong kong', 'korea'],
  'australia': ['australia', 'sydney', 'melbourne', 'oceania', 'new zealand'],
  'middle-east': ['middle east', 'uae', 'dubai', 'israel', 'saudi'],
  'africa': ['africa', 'south africa', 'nigeria', 'kenya'],
}

function jobMatchesPreferences(job: Job, preferences?: Subscriber['preferences']): boolean {
  // If no preferences, include all jobs
  if (!preferences || (!preferences.jobTypes?.length && !preferences.locations?.length)) {
    return true
  }

  const titleLower = job.title.toLowerCase()
  const locationLower = job.location.toLowerCase()

  // Check job type match
  let jobTypeMatch = !preferences.jobTypes?.length // If no job types specified, match all
  if (preferences.jobTypes?.length) {
    for (const jobType of preferences.jobTypes) {
      const keywords = JOB_TYPE_KEYWORDS[jobType] || []
      if (keywords.some(kw => titleLower.includes(kw))) {
        jobTypeMatch = true
        break
      }
    }
  }

  // Check location match
  let locationMatch = !preferences.locations?.length // If no locations specified, match all
  if (preferences.locations?.length) {
    for (const loc of preferences.locations) {
      const keywords = LOCATION_KEYWORDS[loc] || []
      if (keywords.some(kw => locationLower.includes(kw))) {
        locationMatch = true
        break
      }
    }
  }

  return jobTypeMatch && locationMatch
}

function formatSalary(job: Job): string | null {
  if (job.salary_text) return job.salary_text
  if (job.salary_min && job.salary_max) {
    return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
  }
  if (job.salary_min) return `$${job.salary_min.toLocaleString()}+`
  return null
}

// Generate a consistent color based on company name
function getCompanyColor(company: string): string {
  const colors = ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
  let hash = 0
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

interface EmailOptions {
  isPaidUser: boolean
  isPersonalized: boolean
  jobTimeframe: '24h' | '7d'
}

function generateEmailHTML(jobs: Job[], unsubscribeToken: string, options: EmailOptions): string {
  const { isPaidUser, isPersonalized, jobTimeframe } = options

  const jobsHTML = jobs.slice(0, 10).map(job => {
    const salary = formatSalary(job)
    const jobUrl = `https://remotedesigners.co/jobs/${generateJobSlug(job.title, job.company, job.id)}`
    const color = getCompanyColor(job.company)

    // Always use letter avatar for email compatibility
    return `
      <tr>
        <td style="padding: 20px 0; border-bottom: 1px solid #e5e5e5;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="50" valign="top">
                <div style="width: 44px; height: 44px; background: ${color}; border-radius: 8px; text-align: center; line-height: 44px; color: white; font-weight: 600; font-size: 18px;">${job.company.charAt(0).toUpperCase()}</div>
              </td>
              <td style="padding-left: 16px;">
                <a href="${jobUrl}" style="font-size: 16px; font-weight: 600; color: #171717; text-decoration: none;">${job.title}</a>
                <p style="margin: 4px 0 0; font-size: 14px; color: #525252;">${job.company} · ${job.location}</p>
                ${salary ? `<p style="margin: 4px 0 0; font-size: 14px; color: #16a34a;">${salary}</p>` : ''}
              </td>
              <td width="100" valign="middle" align="right">
                <a href="${jobUrl}" style="display: inline-block; padding: 8px 16px; background: #171717; color: white; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500;">View</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
  }).join('')

  const timeframeText = jobTimeframe === '24h' ? 'last 24 hours' : 'last 7 days'

  let introText: string
  let headerSubtitle: string

  if (isPaidUser && isPersonalized) {
    introText = `Here are the latest remote design jobs matching your preferences. We found <strong>${jobs.length} new opportunities</strong> for you!`
    headerSubtitle = 'Your Personalized Job Alerts'
  } else if (isPaidUser) {
    introText = `Here are the latest remote design jobs from the ${timeframeText}. We found <strong>${jobs.length} new opportunities</strong> for you!`
    headerSubtitle = 'Your Daily Job Alerts'
  } else {
    introText = `Here are the latest remote design jobs from the ${timeframeText}. We found <strong>${jobs.length} new opportunities</strong> for you!`
    headerSubtitle = 'Remote Design Jobs'
  }

  // Upgrade CTA for free users
  const upgradeCTA = !isPaidUser ? `
              <!-- Upgrade CTA -->
              <tr>
                <td style="padding: 0 30px 20px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: white;">Get Daily Personalized Alerts</p>
                        <p style="margin: 0 0 12px; font-size: 13px; color: rgba(255,255,255,0.85);">Upgrade to receive daily job alerts tailored to your preferences.</p>
                        <a href="https://remotedesigners.co/membership" style="display: inline-block; padding: 8px 16px; background: white; color: #667eea; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">Upgrade Now</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
  ` : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: white; border-radius: 12px; overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="padding: 30px; background: #171717; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">RemoteDesigners.co</h1>
                  <p style="margin: 8px 0 0; color: #a3a3a3; font-size: 14px;">${headerSubtitle}</p>
                </td>
              </tr>

              <!-- Intro -->
              <tr>
                <td style="padding: 30px 30px 20px;">
                  <p style="margin: 0; font-size: 16px; color: #525252; line-height: 1.6;">
                    ${introText}
                  </p>
                </td>
              </tr>

              <!-- Jobs List -->
              <tr>
                <td style="padding: 0 30px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    ${jobsHTML}
                  </table>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding: 30px; text-align: center;">
                  <a href="https://remotedesigners.co" style="display: inline-block; padding: 14px 28px; background: #171717; color: white; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 500;">Browse All Jobs</a>
                </td>
              </tr>

${upgradeCTA}
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px; background: #fafafa; border-top: 1px solid #e5e5e5;">
                  <p style="margin: 0; font-size: 12px; color: #a3a3a3; text-align: center;">
                    You're receiving this because you subscribed to RemoteDesigners.co job alerts.<br>
                    <a href="https://remotedesigners.co/unsubscribe?token=${unsubscribeToken}" style="color: #a3a3a3;">Unsubscribe</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

export async function GET(request: NextRequest) {
  // Check for test mode - allows sending a test email without auth
  const testEmail = request.nextUrl.searchParams.get('test')
  const testTier = request.nextUrl.searchParams.get('tier') as 'free' | 'paid' | null

  // Skip auth check in test mode
  if (!testEmail) {
    // Verify this is a legitimate cron request
    if (process.env.CRON_SECRET && !verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const supabase = createServerSupabaseClient()
    const now = new Date()

    // Get jobs from the last 7 days (to cover both free and paid users)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const { data: allJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, company, company_logo, location, salary_min, salary_max, salary_text, job_type, posted_at')
      .gte('posted_at', sevenDaysAgo.toISOString())
      .eq('is_active', true)
      .order('posted_at', { ascending: false })
      .limit(100)

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    // Split jobs by timeframe
    const last24hJobs = (allJobs || []).filter(job => new Date(job.posted_at) >= oneDayAgo)
    const last7dJobs = allJobs || []

    if (!allJobs || allJobs.length === 0) {
      // In test mode, get recent jobs instead
      if (testEmail) {
        const { data: recentJobs } = await supabase
          .from('jobs')
          .select('id, title, company, company_logo, location, salary_min, salary_max, salary_text, job_type, posted_at')
          .eq('is_active', true)
          .order('posted_at', { ascending: false })
          .limit(10)

        if (recentJobs && recentJobs.length > 0) {
          if (!resend) {
            return NextResponse.json({ error: 'Resend not configured' }, { status: 500 })
          }
          const isPaidTest = testTier === 'paid'

          const { error: sendError } = await resend.emails.send({
            from: 'RemoteDesigners.co <hello@remotedesigners.co>',
            to: testEmail,
            subject: isPaidTest
              ? `[TEST] ${recentJobs.length} Jobs Matching Your Preferences`
              : `[TEST] ${recentJobs.length} New Remote Design Jobs`,
            html: generateEmailHTML(recentJobs as Job[], 'test-token', {
              isPaidUser: isPaidTest,
              isPersonalized: isPaidTest,
              jobTimeframe: isPaidTest ? '24h' : '7d'
            }),
          })

          if (sendError) {
            console.error('Failed to send test email:', sendError)
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
          }

          return NextResponse.json({ success: true, message: `Test email sent to ${testEmail} (tier: ${testTier || 'free'})`, jobs: recentJobs.length })
        }
      }
      return NextResponse.json({ message: 'No new jobs to send', sent: 0 })
    }

    // In test mode, just send to the test email
    if (testEmail) {
      if (!resend) {
        return NextResponse.json({ error: 'Resend not configured' }, { status: 500 })
      }
      const isPaidTest = testTier === 'paid'
      const jobsForTest = isPaidTest ? last24hJobs : last7dJobs

      const { error: sendError } = await resend.emails.send({
        from: 'RemoteDesigners.co <hello@remotedesigners.co>',
        to: testEmail,
        subject: isPaidTest
          ? `[TEST] ${jobsForTest.length} Jobs Matching Your Preferences`
          : `[TEST] ${jobsForTest.length} New Remote Design Jobs`,
        html: generateEmailHTML(jobsForTest as Job[], 'test-token', {
          isPaidUser: isPaidTest,
          isPersonalized: isPaidTest,
          jobTimeframe: isPaidTest ? '24h' : '7d'
        }),
      })

      if (sendError) {
        console.error('Failed to send test email:', sendError)
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Test email sent to ${testEmail} (tier: ${testTier || 'free'})`,
        jobs: jobsForTest.length,
        last24hCount: last24hJobs.length,
        last7dCount: last7dJobs.length
      })
    }

    // Get active subscribers with their tier information
    const subscribers = await getSubscribersWithTier(supabase)

    if (subscribers.length === 0) {
      return NextResponse.json({ message: 'No active subscribers', sent: 0 })
    }

    // Check if Resend is configured
    if (!resend) {
      console.error('Resend not configured')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // Send emails
    let sent = 0
    let failed = 0
    let skipped = 0
    let skippedFrequency = 0

    for (const subscriber of subscribers) {
      try {
        // Check if we should send based on tier and frequency
        if (!shouldSendToSubscriber(subscriber, now)) {
          skippedFrequency++
          continue
        }

        // Determine which jobs to use based on tier
        const baseJobs = subscriber.isPaidUser ? last24hJobs : last7dJobs

        // Apply preference filtering for all users
        const hasPreferences = subscriber.preferences?.jobTypes?.length || subscriber.preferences?.locations?.length
        let jobsToSend: typeof baseJobs

        if (hasPreferences) {
          // Filter jobs by preferences
          const filteredJobs = baseJobs.filter(job => jobMatchesPreferences(job as Job, subscriber.preferences))

          // Skip if no matching jobs
          if (filteredJobs.length === 0) {
            skipped++
            continue
          }
          jobsToSend = filteredJobs
        } else {
          // No preferences: all jobs
          jobsToSend = baseJobs
        }

        // Skip if no jobs to send
        if (jobsToSend.length === 0) {
          skipped++
          continue
        }

        // Determine email content based on tier
        const isPersonalized = subscriber.isPaidUser && !!hasPreferences
        const subject = subscriber.isPaidUser
          ? isPersonalized
            ? `${jobsToSend.length} Jobs Matching Your Preferences`
            : `${jobsToSend.length} New Remote Design Jobs`
          : `${jobsToSend.length} New Remote Design Jobs`

        const { error: sendError } = await resend.emails.send({
          from: 'RemoteDesigners.co <hello@remotedesigners.co>',
          to: subscriber.email,
          subject,
          html: generateEmailHTML(jobsToSend as Job[], subscriber.unsubscribe_token, {
            isPaidUser: subscriber.isPaidUser,
            isPersonalized,
            jobTimeframe: subscriber.isPaidUser ? '24h' : '7d'
          }),
        })

        if (sendError) {
          console.error(`Failed to send to ${subscriber.email}:`, sendError)
          failed++
          continue
        }

        // Update last_email_sent_at
        await supabase
          .from('subscribers')
          .update({ last_email_sent_at: new Date().toISOString() })
          .eq('id', subscriber.id)

        sent++
      } catch (emailError) {
        console.error(`Failed to send to ${subscriber.email}:`, emailError)
        failed++
      }

      // Rate limiting - wait 100ms between emails
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      message: 'Daily digest sent',
      jobs: {
        last24h: last24hJobs.length,
        last7d: last7dJobs.length,
      },
      subscribers: subscribers.length,
      paidSubscribers: subscribers.filter(s => s.isPaidUser).length,
      freeSubscribers: subscribers.filter(s => !s.isPaidUser).length,
      sent,
      failed,
      skipped,
      skippedFrequency,
    })
  } catch (error) {
    console.error('Daily digest error:', error)
    return NextResponse.json({ error: 'Failed to send daily digest' }, { status: 500 })
  }
}
