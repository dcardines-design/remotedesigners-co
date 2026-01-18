import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { generateJobSlug } from '@/lib/slug'

const sesClient = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  ? new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
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
  preferences?: {
    jobTypes?: string[]
    locations?: string[]
  }
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

function generateEmailHTML(jobs: Job[], unsubscribeToken: string, isPersonalized: boolean): string {
  const jobsHTML = jobs.slice(0, 10).map(job => {
    const salary = formatSalary(job)
    const jobUrl = `https://remotedesigners.co/jobs/${generateJobSlug(job.title, job.company, job.id)}`

    return `
      <tr>
        <td style="padding: 20px 0; border-bottom: 1px solid #e5e5e5;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="50" valign="top">
                ${job.company_logo
                  ? `<img src="${job.company_logo}" alt="${job.company}" width="44" height="44" style="border-radius: 8px; object-fit: contain;" />`
                  : `<div style="width: 44px; height: 44px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; text-align: center; line-height: 44px; color: white; font-weight: 600;">${job.company.charAt(0)}</div>`
                }
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

  const introText = isPersonalized
    ? `Here are the latest remote design jobs matching your preferences. We found <strong>${jobs.length} new opportunities</strong> for you!`
    : `Here are the latest remote design jobs posted in the last 24 hours. We found <strong>${jobs.length} new opportunities</strong> for you!`

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
                  <p style="margin: 8px 0 0; color: #a3a3a3; font-size: 14px;">${isPersonalized ? 'Your Personalized Job Alerts' : 'Your Daily Remote Design Jobs'}</p>
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

  // Skip auth check in test mode
  if (!testEmail) {
    // Verify this is a legitimate cron request
    if (process.env.CRON_SECRET && !verifyCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const supabase = createServerSupabaseClient()

    // Get jobs from the last 24 hours
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, company, company_logo, location, salary_min, salary_max, salary_text, job_type, posted_at')
      .gte('posted_at', yesterday.toISOString())
      .eq('is_active', true)
      .order('posted_at', { ascending: false })
      .limit(50)

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
    }

    if (!jobs || jobs.length === 0) {
      // In test mode, get recent jobs instead
      if (testEmail) {
        const { data: recentJobs } = await supabase
          .from('jobs')
          .select('id, title, company, company_logo, location, salary_min, salary_max, salary_text, job_type, posted_at')
          .eq('is_active', true)
          .order('posted_at', { ascending: false })
          .limit(10)

        if (recentJobs && recentJobs.length > 0) {
          if (!sesClient) {
            return NextResponse.json({ error: 'AWS SES not configured' }, { status: 500 })
          }
          const fromEmail = process.env.SES_FROM_EMAIL || 'hello@remotedesigners.co'
          const command = new SendEmailCommand({
            Source: `RemoteDesigners.co <${fromEmail}>`,
            Destination: { ToAddresses: [testEmail] },
            Message: {
              Subject: { Data: `[TEST] ${recentJobs.length} Remote Design Jobs 🎨`, Charset: 'UTF-8' },
              Body: { Html: { Data: generateEmailHTML(recentJobs as Job[], 'test-token', false), Charset: 'UTF-8' } },
            },
          })
          await sesClient.send(command)
          return NextResponse.json({ success: true, message: `Test email sent to ${testEmail}`, jobs: recentJobs.length })
        }
      }
      return NextResponse.json({ message: 'No new jobs to send', sent: 0 })
    }

    // In test mode, just send to the test email
    if (testEmail) {
      if (!sesClient) {
        return NextResponse.json({ error: 'AWS SES not configured' }, { status: 500 })
      }
      const fromEmail = process.env.SES_FROM_EMAIL || 'hello@remotedesigners.co'
      const command = new SendEmailCommand({
        Source: `RemoteDesigners.co <${fromEmail}>`,
        Destination: { ToAddresses: [testEmail] },
        Message: {
          Subject: { Data: `[TEST] ${jobs.length} Remote Design Jobs 🎨`, Charset: 'UTF-8' },
          Body: { Html: { Data: generateEmailHTML(jobs as Job[], 'test-token', false), Charset: 'UTF-8' } },
        },
      })
      await sesClient.send(command)
      return NextResponse.json({ success: true, message: `Test email sent to ${testEmail}`, jobs: jobs.length })
    }

    // Get active subscribers from the subscribers table
    const { data: subscribers, error: subError } = await supabase
      .from('subscribers')
      .select('id, email, unsubscribe_token, preferences')
      .eq('is_active', true)

    if (subError) {
      console.error('Error fetching subscribers:', subError)
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No active subscribers', sent: 0 })
    }

    // Check if SES is configured
    if (!sesClient) {
      console.error('AWS SES not configured')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const fromEmail = process.env.SES_FROM_EMAIL || 'hello@remotedesigners.co'

    // Send emails
    let sent = 0
    let failed = 0
    let skipped = 0

    for (const subscriber of subscribers) {
      try {
        // Filter jobs based on subscriber preferences
        const hasPreferences = subscriber.preferences?.jobTypes?.length || subscriber.preferences?.locations?.length
        const filteredJobs = jobs.filter(job => jobMatchesPreferences(job as Job, subscriber.preferences))

        // Skip if no matching jobs for subscribers with preferences
        if (hasPreferences && filteredJobs.length === 0) {
          skipped++
          continue
        }

        const jobsToSend = filteredJobs.length > 0 ? filteredJobs : jobs

        const command = new SendEmailCommand({
          Source: `RemoteDesigners.co <${fromEmail}>`,
          Destination: {
            ToAddresses: [subscriber.email],
          },
          Message: {
            Subject: {
              Data: hasPreferences
                ? `${jobsToSend.length} Jobs Matching Your Preferences 🎯`
                : `${jobsToSend.length} New Remote Design Jobs Today 🎨`,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: generateEmailHTML(jobsToSend as Job[], subscriber.unsubscribe_token, !!hasPreferences),
                Charset: 'UTF-8',
              },
            },
          },
        })

        await sesClient.send(command)

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
      jobs: jobs.length,
      subscribers: subscribers.length,
      sent,
      failed,
      skipped,
    })
  } catch (error) {
    console.error('Daily digest error:', error)
    return NextResponse.json({ error: 'Failed to send daily digest' }, { status: 500 })
  }
}
