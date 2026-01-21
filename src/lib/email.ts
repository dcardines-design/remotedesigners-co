import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.FROM_EMAIL || 'hello@remotedesigners.co'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://remotedesigners.co'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
  if (!resend) {
    console.log('[Email] Resend not configured, skipping email to:', to)
    return false
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    })
    console.log('[Email] Sent to:', to)
    return true
  } catch (error) {
    console.error('[Email] Failed to send:', error)
    return false
  }
}

interface JobReceiptData {
  title: string
  company: string
  location: string
  poster_email: string
  job_id: string
  is_featured: boolean
  sticky_24h: boolean
  sticky_7d: boolean
  rainbow_border: boolean
  extended_duration: boolean
  total: number
}

export async function sendJobPostingReceipt(data: JobReceiptData): Promise<boolean> {
  const jobUrl = `${BASE_URL}/jobs/${data.job_id}`
  const postedJobsUrl = `${BASE_URL}/posted-jobs`

  // Build add-ons list
  const addOns: string[] = []
  if (data.is_featured) addOns.push('Featured Listing - $50')
  if (data.sticky_24h) addOns.push('Sticky Post 24h - $79')
  if (data.sticky_7d) addOns.push('Sticky Post 7 Days - $149')
  if (data.rainbow_border) addOns.push('Rainbow Border - $39')
  if (data.extended_duration) addOns.push('+30 Days Extended - $49')

  const addOnsHtml = addOns.length > 0
    ? addOns.map(a => `<tr><td style="padding: 8px 0; color: #525252;">${a}</td></tr>`).join('')
    : ''

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fafafa;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 500px;">
              <!-- Header -->
              <tr>
                <td style="padding-bottom: 32px;">
                  <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #171717;">remotedesigners.co</h1>
                </td>
              </tr>

              <!-- Main Card -->
              <tr>
                <td style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e5e5e5;">
                  <!-- Success Icon -->
                  <div style="width: 48px; height: 48px; background: #dcfce7; border-radius: 50%; margin: 0 auto 24px; text-align: center; line-height: 48px;">
                    <span style="color: #16a34a; font-size: 24px;">✓</span>
                  </div>

                  <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #171717; text-align: center;">Your job is live!</h2>
                  <p style="margin: 0 0 32px; font-size: 15px; color: #525252; text-align: center;">Thanks for posting on Remote Designers</p>

                  <!-- Job Details -->
                  <div style="background: #fafafa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <h3 style="margin: 0 0 4px; font-size: 18px; font-weight: 600; color: #171717;">${data.title}</h3>
                    <p style="margin: 0; font-size: 14px; color: #525252;">${data.company} · ${data.location}</p>
                  </div>

                  <!-- Order Summary -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 8px 0; color: #525252; border-bottom: 1px solid #e5e5e5;">Job Posting (30 days)</td>
                      <td style="padding: 8px 0; color: #171717; text-align: right; border-bottom: 1px solid #e5e5e5;">$99</td>
                    </tr>
                    ${addOns.map(a => {
                      const [name, price] = a.split(' - ')
                      return `<tr><td style="padding: 8px 0; color: #525252; border-bottom: 1px solid #e5e5e5;">${name}</td><td style="padding: 8px 0; color: #171717; text-align: right; border-bottom: 1px solid #e5e5e5;">${price}</td></tr>`
                    }).join('')}
                    <tr>
                      <td style="padding: 12px 0; font-weight: 600; color: #171717;">Total</td>
                      <td style="padding: 12px 0; font-weight: 600; color: #171717; text-align: right;">$${data.total}</td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <a href="${jobUrl}" style="display: block; width: 100%; padding: 14px 0; background: #171717; color: white; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 500; text-align: center;">View your job posting</a>

                  <p style="margin: 16px 0 0; font-size: 13px; color: #a3a3a3; text-align: center;">
                    <a href="${postedJobsUrl}" style="color: #525252;">Manage all your postings →</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 32px 0; text-align: center;">
                  <p style="margin: 0; font-size: 13px; color: #a3a3a3;">
                    Questions? Reply to this email or contact us at<br/>
                    <a href="mailto:hello@remotedesigners.co" style="color: #525252;">hello@remotedesigners.co</a>
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

  const text = `
Your job is live on Remote Designers!

${data.title}
${data.company} · ${data.location}

Order Summary:
- Job Posting (30 days): $99
${addOns.map(a => `- ${a}`).join('\n')}
Total: $${data.total}

View your job posting: ${jobUrl}
Manage all your postings: ${postedJobsUrl}

Questions? Contact us at hello@remotedesigners.co
  `

  return sendEmail({
    to: data.poster_email,
    subject: `Your job "${data.title}" is now live!`,
    html,
    text,
  })
}

interface WelcomeEmailData {
  email: string
  magicLink: string
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fafafa;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 500px;">
              <!-- Header -->
              <tr>
                <td style="padding-bottom: 32px;">
                  <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #171717;">remotedesigners.co</h1>
                </td>
              </tr>

              <!-- Main Card -->
              <tr>
                <td style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e5e5e5;">
                  <!-- Success Icon -->
                  <div style="width: 48px; height: 48px; background: #f3e8ff; border-radius: 50%; margin: 0 auto 24px; text-align: center; line-height: 48px;">
                    <span style="color: #9333ea; font-size: 24px;">🎉</span>
                  </div>

                  <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #171717; text-align: center;">Welcome to Remote Designers!</h2>
                  <p style="margin: 0 0 24px; font-size: 15px; color: #525252; text-align: center;">Your account has been created and your subscription is active.</p>

                  <p style="margin: 0 0 24px; font-size: 15px; color: #525252; text-align: center;">Click the button below to log in and start browsing thousands of remote design jobs.</p>

                  <!-- CTA Button -->
                  <a href="${data.magicLink}" style="display: block; width: 100%; padding: 14px 0; background: #171717; color: white; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 500; text-align: center;">Log in to your account</a>

                  <p style="margin: 24px 0 0; font-size: 13px; color: #a3a3a3; text-align: center;">
                    This link expires in 24 hours. If it doesn't work, you can request a new one from the login page.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 32px 0; text-align: center;">
                  <p style="margin: 0; font-size: 13px; color: #a3a3a3;">
                    Questions? Reply to this email or contact us at<br/>
                    <a href="mailto:hello@remotedesigners.co" style="color: #525252;">hello@remotedesigners.co</a>
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

  const text = `
Welcome to Remote Designers!

Your account has been created and your subscription is active.

Click the link below to log in and start browsing thousands of remote design jobs:

${data.magicLink}

This link expires in 24 hours. If it doesn't work, you can request a new one from the login page.

Questions? Contact us at hello@remotedesigners.co
  `

  return sendEmail({
    to: data.email,
    subject: 'Welcome to Remote Designers! 🎉',
    html,
    text,
  })
}

interface SubscriptionConfirmationData {
  email: string
  plan: string
  amount: number
}

export async function sendSubscriptionConfirmation(data: SubscriptionConfirmationData): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fafafa;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 500px;">
              <tr>
                <td style="padding-bottom: 32px; text-align: center;">
                  <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #171717;">remotedesigners.co</h1>
                </td>
              </tr>
              <tr>
                <td style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e5e5e5;">
                  <div style="width: 48px; height: 48px; background: #dcfce7; border-radius: 50%; margin: 0 auto 24px; text-align: center; line-height: 48px;">
                    <span style="color: #16a34a; font-size: 24px;">✓</span>
                  </div>
                  <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #171717; text-align: center;">Payment confirmed!</h2>
                  <p style="margin: 0 0 24px; font-size: 15px; color: #525252; text-align: center;">Your ${data.plan} subscription is now active.</p>
                  <div style="background: #fafafa; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #525252;">Amount paid</p>
                    <p style="margin: 4px 0 0; font-size: 24px; font-weight: 600; color: #171717;">$${data.amount.toFixed(2)}</p>
                  </div>
                  <a href="${BASE_URL}" style="display: block; width: 100%; padding: 14px 0; background: #171717; color: white; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 500; text-align: center;">Browse jobs</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 0; text-align: center;">
                  <p style="margin: 0; font-size: 13px; color: #a3a3a3;">
                    Questions? Contact us at <a href="mailto:hello@remotedesigners.co" style="color: #525252;">hello@remotedesigners.co</a>
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

  return sendEmail({
    to: data.email,
    subject: "You're in! Welcome to the club 🎉",
    html,
  })
}

interface PaymentFailedData {
  email: string
  reason?: string
}

export async function sendPaymentFailedEmail(data: PaymentFailedData): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fafafa;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 500px;">
              <tr>
                <td style="padding-bottom: 32px; text-align: center;">
                  <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #171717;">remotedesigners.co</h1>
                </td>
              </tr>
              <tr>
                <td style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e5e5e5;">
                  <div style="width: 48px; height: 48px; background: #fee2e2; border-radius: 50%; margin: 0 auto 24px; text-align: center; line-height: 48px;">
                    <span style="color: #dc2626; font-size: 24px;">!</span>
                  </div>
                  <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #171717; text-align: center;">Payment failed</h2>
                  <p style="margin: 0 0 24px; font-size: 15px; color: #525252; text-align: center;">We couldn't process your subscription payment. ${data.reason ? `Reason: ${data.reason}` : 'Please update your payment method.'}</p>
                  <a href="${BASE_URL}/membership" style="display: block; width: 100%; padding: 14px 0; background: #171717; color: white; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 500; text-align: center;">Update payment method</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 0; text-align: center;">
                  <p style="margin: 0; font-size: 13px; color: #a3a3a3;">
                    Need help? Contact us at <a href="mailto:hello@remotedesigners.co" style="color: #525252;">hello@remotedesigners.co</a>
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

  return sendEmail({
    to: data.email,
    subject: 'Payment failed - Action required',
    html,
  })
}
