'use client'

import { useState } from 'react'

// Sample job data for preview
const sampleJobs = [
  {
    id: '1',
    title: 'Senior Product Designer',
    company: 'Stripe',
    company_logo: 'https://logo.clearbit.com/stripe.com',
    location: 'Remote (US)',
    salary_min: 180000,
    salary_max: 250000,
    job_type: 'Full-time',
    posted_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'UI/UX Designer',
    company: 'Figma',
    company_logo: 'https://logo.clearbit.com/figma.com',
    location: 'Remote (Worldwide)',
    salary_min: 140000,
    salary_max: 180000,
    job_type: 'Full-time',
    posted_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Design Systems Lead',
    company: 'Notion',
    company_logo: 'https://logo.clearbit.com/notion.so',
    location: 'Remote (US/EU)',
    salary_min: 200000,
    salary_max: 280000,
    job_type: 'Full-time',
    posted_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Brand Designer',
    company: 'Linear',
    company_logo: null,
    location: 'Remote',
    salary_min: 120000,
    salary_max: 160000,
    job_type: 'Full-time',
    posted_at: new Date().toISOString(),
  },
]

function formatSalary(job: typeof sampleJobs[0]): string | null {
  if (job.salary_min && job.salary_max) {
    return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
  }
  if (job.salary_min) return `$${job.salary_min.toLocaleString()}+`
  return null
}

function generateWelcomeEmailHTML(): string {
  return `
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
  `
}

function generateDailyDigestHTML(jobs: typeof sampleJobs): string {
  const jobsHTML = jobs.map(job => {
    const salary = formatSalary(job)
    const jobUrl = `https://remotedesigners.co/jobs/example-job`

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
                    You're receiving this because you subscribed to RemoteDesigners.co job alerts.<br>
                    <a href="https://remotedesigners.co/unsubscribe?token=preview" style="color: #a3a3a3;">Unsubscribe</a>
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

export default function EmailPreviewPage() {
  const [activeTemplate, setActiveTemplate] = useState<'welcome' | 'digest'>('digest')

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-neutral-900">Email Template Preview</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTemplate('welcome')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTemplate === 'welcome'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Welcome Email
              </button>
              <button
                onClick={() => setActiveTemplate('digest')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTemplate === 'digest'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Daily Digest
              </button>
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-2">
            Edit templates in: <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-xs">
              {activeTemplate === 'welcome'
                ? 'src/app/api/subscribe/route.ts'
                : 'src/app/api/cron/daily-digest/route.ts'}
            </code>
          </p>
        </div>
      </div>

      {/* Email Preview */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          {/* Email Header Bar */}
          <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-sm text-neutral-500">
                  {activeTemplate === 'welcome'
                    ? 'Welcome to RemoteDesigners.co! 🎨'
                    : `${sampleJobs.length} New Remote Design Jobs Today 🎨`}
                </span>
              </div>
            </div>
          </div>

          {/* Email Content */}
          <iframe
            srcDoc={activeTemplate === 'welcome' ? generateWelcomeEmailHTML() : generateDailyDigestHTML(sampleJobs)}
            className="w-full border-0"
            style={{ height: activeTemplate === 'welcome' ? '400px' : '800px' }}
            title="Email Preview"
          />
        </div>
      </div>
    </div>
  )
}
