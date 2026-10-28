'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import posthog from 'posthog-js'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

// Extend window type for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

// Mirror every event into PostHog. No-op until NEXT_PUBLIC_POSTHOG_KEY is set.
function ph(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return
  posthog.capture(event, properties)
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID && !POSTHOG_KEY) return

    // Identify user on auth state change
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        window.gtag?.('set', 'user_id', user.id)
        if (POSTHOG_KEY) posthog.identify(user.id, { email: user.email })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        window.gtag?.('set', 'user_id', session.user.id)
        window.gtag?.('event', 'login', { method: 'magic_link' })
        if (POSTHOG_KEY) {
          posthog.identify(session.user.id, { email: session.user.email })
          posthog.capture('login', { method: 'magic_link' })
        }
      } else if (event === 'SIGNED_OUT') {
        window.gtag?.('set', 'user_id', null)
        if (POSTHOG_KEY) posthog.reset()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (!GA_MEASUREMENT_ID) {
    return <>{children}</>
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      {children}
    </>
  )
}

// Custom event tracking functions. Each call fires to GA4 and PostHog.
export const trackEvent = {
  // Job interactions
  jobView: (jobId: string, jobTitle: string, company: string) => {
    window.gtag?.('event', 'view_item', {
      item_id: jobId,
      item_name: jobTitle,
      item_brand: company,
      item_category: 'job',
    })
    ph('job_viewed', { job_id: jobId, job_title: jobTitle, company })
  },

  jobSave: (jobId: string, jobTitle: string, saved: boolean) => {
    window.gtag?.('event', saved ? 'add_to_wishlist' : 'remove_from_wishlist', {
      item_id: jobId,
      item_name: jobTitle,
    })
    ph(saved ? 'job_saved' : 'job_unsaved', { job_id: jobId, job_title: jobTitle })
  },

  // Fires for every click, including non-subscribers who get sent to /membership,
  // so is_subscribed separates real applications from paywall hits.
  applyClick: (
    jobId: string,
    jobTitle: string,
    company: string,
    applyUrl: string,
    isSubscribed: boolean,
    location: 'job_detail' | 'job_card'
  ) => {
    window.gtag?.('event', 'select_content', {
      content_type: 'job_application',
      item_id: jobId,
      item_name: jobTitle,
      item_brand: company,
      is_subscribed: isSubscribed,
      location,
    })
    ph('apply_clicked', {
      job_id: jobId,
      job_title: jobTitle,
      company,
      apply_url: applyUrl,
      is_subscribed: isSubscribed,
      location,
    })
  },

  // Search and filtering
  search: (query: string, resultsCount: number) => {
    window.gtag?.('event', 'search', {
      search_term: query,
      results_count: resultsCount,
    })
    ph('search', { search_term: query, results_count: resultsCount })
  },

  filterApplied: (filterType: string, filterValue: string) => {
    window.gtag?.('event', 'filter_applied', {
      filter_type: filterType,
      filter_value: filterValue,
    })
    ph('filter_applied', { filter_type: filterType, filter_value: filterValue })
  },

  // Auth events
  signUp: (method: string) => {
    window.gtag?.('event', 'sign_up', { method })
    ph('sign_up', { method })
  },

  login: (method: string) => {
    window.gtag?.('event', 'login', { method })
    ph('login', { method })
  },

  logout: () => {
    window.gtag?.('event', 'logout')
    ph('logout')
  },

  // Subscription events
  subscriptionStarted: (plan: string, price: number) => {
    window.gtag?.('event', 'purchase', {
      transaction_id: `sub_${Date.now()}`,
      value: price,
      currency: 'USD',
      items: [{ item_id: plan, item_name: `${plan} subscription`, price }],
    })
    ph('subscription_started', { plan, price, currency: 'USD' })
  },

  subscriptionCancelled: (plan: string) => {
    window.gtag?.('event', 'refund', {
      items: [{ item_id: plan, item_name: `${plan} subscription` }],
    })
    ph('subscription_cancelled', { plan })
  },

  // Job posting events
  jobPostStarted: () => {
    window.gtag?.('event', 'begin_checkout', { item_category: 'job_posting' })
    ph('job_post_started')
  },

  jobPostCompleted: (jobId: string, options: { featured?: boolean; sticky?: boolean; rainbow?: boolean }) => {
    window.gtag?.('event', 'job_post_completed', {
      job_id: jobId,
      ...options,
    })
    ph('job_post_completed', { job_id: jobId, ...options })
  },

  jobPostPaymentStarted: (amount: number) => {
    window.gtag?.('event', 'add_payment_info', {
      value: amount,
      currency: 'USD',
    })
    ph('job_post_payment_started', { amount, currency: 'USD' })
  },

  // User identification
  identify: (userId: string, traits?: Record<string, unknown>) => {
    window.gtag?.('set', 'user_id', userId)
    if (traits) {
      window.gtag?.('set', 'user_properties', traits)
    }
    if (POSTHOG_KEY) posthog.identify(userId, traits)
  },

  // Newsletter signup
  newsletterSignup: (location: string) => {
    window.gtag?.('event', 'newsletter_signup', {
      location,
      email_domain: 'unknown', // Privacy: don't track actual email
    })
    ph('newsletter_signup', { location })
  },

  // Job alert events
  jobAlertCreated: (keywords: string[], frequency: string) => {
    window.gtag?.('event', 'job_alert_created', {
      keywords: keywords.join(','),
      frequency,
    })
    ph('job_alert_created', { keywords, frequency })
  },

  jobAlertDeleted: (alertId: string) => {
    window.gtag?.('event', 'job_alert_deleted', {
      alert_id: alertId,
    })
    ph('job_alert_deleted', { alert_id: alertId })
  },

  // Billing portal opened
  billingPortalOpened: (plan: string) => {
    window.gtag?.('event', 'billing_portal_opened', {
      plan,
    })
    ph('billing_portal_opened', { plan })
  },

  // Share job
  shareJob: (jobId: string, jobTitle: string, method: string) => {
    window.gtag?.('event', 'share_job', {
      job_id: jobId,
      job_title: jobTitle,
      share_method: method,
    })
    ph('job_shared', { job_id: jobId, job_title: jobTitle, share_method: method })
  },

  // Scroll depth tracking
  scrollDepth: (percent: number, pageType: string) => {
    window.gtag?.('event', 'scroll_depth', {
      percent,
      page_type: pageType,
    })
    ph('scroll_depth', { percent, page_type: pageType })
  },

  // Job impression (card viewed in viewport)
  jobImpression: (jobId: string, position: number, pageType: string) => {
    window.gtag?.('event', 'job_impression', {
      job_id: jobId,
      position,
      page_type: pageType,
    })
    ph('job_impression', { job_id: jobId, position, page_type: pageType })
  },

  // Outbound click tracking
  outboundClick: (url: string, linkText: string, context: string) => {
    window.gtag?.('event', 'outbound_click', {
      url,
      link_text: linkText,
      context,
    })
    ph('outbound_click', { url, link_text: linkText, context })
  },

  // Resume builder
  resumeBuilderPromoClick: () => {
    window.gtag?.('event', 'resume_builder_promo_click', {
      location: 'homepage_sidebar',
    })
    ph('resume_builder_promo_click', { location: 'homepage_sidebar' })
  },
  resumeBuilderView: () => {
    window.gtag?.('event', 'resume_builder_view')
    ph('resume_builder_view')
  },
  resumeBuilderExport: (template: string) => {
    window.gtag?.('event', 'resume_builder_export', {
      template,
    })
    ph('resume_builder_export', { template })
  },
  resumeBuilderTemplateChange: (template: string) => {
    window.gtag?.('event', 'resume_builder_template_change', {
      template,
    })
    ph('resume_builder_template_change', { template })
  },
}
