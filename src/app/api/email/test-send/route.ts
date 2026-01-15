// Test endpoint for sending newsletter digest emails
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { generateJobSlug } from '@/lib/slug'

const sesClient = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  ? new SESClient({
      region: process.env.AWS_REGION || 'ap-southeast-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null

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

function formatSalary(job: Job): string | null {
  if (job.salary_text) return job.salary_text
  if (job.salary_min && job.salary_max) {
    return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
  }
  if (job.salary_min) return `$${job.salary_min.toLocaleString()}+`
  return null
}

function generateEmailHTML(jobs: Job[]): string {
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
                  <p style="margin: 8px 0 0; color: #a3a3a3; font-size: 14px;">Your Daily Remote Design Jobs</p>
                </td>
              </tr>

              <!-- Intro -->
              <tr>
                <td style="padding: 30px 30px 20px;">
                  <p style="margin: 0; font-size: 16px; color: #525252; line-height: 1.6;">
                    Here are the latest remote design jobs posted in the last 24 hours. We found <strong>${jobs.length} new opportunities</strong> for you!
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
                    This is a test email from RemoteDesigners.co
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
  const email = request.nextUrl.searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email parameter required. Usage: ?email=your@email.com' }, { status: 400 })
  }

  if (!sesClient) {
    return NextResponse.json({
      error: 'AWS SES not configured',
      hint: 'Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION env vars'
    }, { status: 500 })
  }

  try {
    const supabase = createServerSupabaseClient()

    // Get recent jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, company, company_logo, location, salary_min, salary_max, salary_text, job_type, posted_at')
      .order('posted_at', { ascending: false })
      .limit(10)

    if (jobsError) {
      return NextResponse.json({ error: 'Failed to fetch jobs', details: jobsError.message }, { status: 500 })
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ error: 'No jobs found in database' }, { status: 404 })
    }

    const fromEmail = process.env.SES_FROM_EMAIL || 'hello@remotedesigners.co'

    const command = new SendEmailCommand({
      Source: `RemoteDesigners.co <${fromEmail}>`,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: `[TEST] ${jobs.length} Remote Design Jobs 🎨`,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: generateEmailHTML(jobs as Job[]),
            Charset: 'UTF-8',
          },
        },
      },
    })

    await sesClient.send(command)

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
      jobsIncluded: jobs.length,
    })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({
      error: 'Failed to send email',
      details: String(error),
      hint: 'In sandbox mode, you can only send to verified emails'
    }, { status: 500 })
  }
}
