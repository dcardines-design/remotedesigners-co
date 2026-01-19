'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

// Extend window type for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return

    // Identify user on auth state change
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        window.gtag?.('set', 'user_id', user.id)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        window.gtag?.('set', 'user_id', session.user.id)
        window.gtag?.('event', 'login', { method: 'magic_link' })
      } else if (event === 'SIGNED_OUT') {
        window.gtag?.('set', 'user_id', null)
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

// Custom event tracking functions (mirrors PostHog API)
export const trackEvent = {
  // Job interactions
  jobView: (jobId: string, jobTitle: string, company: string) => {
    window.gtag?.('event', 'view_item', {
      item_id: jobId,
      item_name: jobTitle,
      item_brand: company,
      item_category: 'job',
    })
  },

  jobSave: (jobId: string, jobTitle: string, saved: boolean) => {
    window.gtag?.('event', saved ? 'add_to_wishlist' : 'remove_from_wishlist', {
      item_id: jobId,
      item_name: jobTitle,
    })
  },

  applyClick: (jobId: string, jobTitle: string, company: string, applyUrl: string) => {
    window.gtag?.('event', 'select_content', {
      content_type: 'job_application',
      item_id: jobId,
      item_name: jobTitle,
      item_brand: company,
    })
  },

  // Search and filtering
  search: (query: string, resultsCount: number) => {
    window.gtag?.('event', 'search', {
      search_term: query,
      results_count: resultsCount,
    })
  },

  filterApplied: (filterType: string, filterValue: string) => {
    window.gtag?.('event', 'filter_applied', {
      filter_type: filterType,
      filter_value: filterValue,
    })
  },

  // Auth events
  signUp: (method: string) => {
    window.gtag?.('event', 'sign_up', { method })
  },

  login: (method: string) => {
    window.gtag?.('event', 'login', { method })
  },

  logout: () => {
    window.gtag?.('event', 'logout')
  },

  // Subscription events
  subscriptionStarted: (plan: string, price: number) => {
    window.gtag?.('event', 'purchase', {
      transaction_id: `sub_${Date.now()}`,
      value: price,
      currency: 'USD',
      items: [{ item_id: plan, item_name: `${plan} subscription`, price }],
    })
  },

  subscriptionCancelled: (plan: string) => {
    window.gtag?.('event', 'refund', {
      items: [{ item_id: plan, item_name: `${plan} subscription` }],
    })
  },

  // Job posting events
  jobPostStarted: () => {
    window.gtag?.('event', 'begin_checkout', { item_category: 'job_posting' })
  },

  jobPostCompleted: (jobId: string, options: { featured?: boolean; sticky?: boolean; rainbow?: boolean }) => {
    window.gtag?.('event', 'job_post_completed', {
      job_id: jobId,
      ...options,
    })
  },

  jobPostPaymentStarted: (amount: number) => {
    window.gtag?.('event', 'add_payment_info', {
      value: amount,
      currency: 'USD',
    })
  },

  // User identification (no-op for GA4, handled via user_id)
  identify: (userId: string, traits?: Record<string, unknown>) => {
    window.gtag?.('set', 'user_id', userId)
    if (traits) {
      window.gtag?.('set', 'user_properties', traits)
    }
  },
}
