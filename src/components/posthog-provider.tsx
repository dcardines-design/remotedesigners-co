'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            // Disable in development if needed
            // posthog.opt_out_capturing()
          }
        },
      })

      // Identify user on auth state change
      const supabase = createBrowserSupabaseClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          posthog.identify(user.id, { email: user.email })
        }
      })

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          posthog.identify(session.user.id, { email: session.user.email })
          posthog.capture('user_logged_in', { method: 'magic_link' })
        } else if (event === 'SIGNED_OUT') {
          posthog.reset()
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [])

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>
  }

  return <PHProvider client={posthog}>{children}</PHProvider>
}

// Custom event tracking functions
export const trackEvent = {
  // Job interactions
  jobView: (jobId: string, jobTitle: string, company: string) => {
    posthog.capture('job_viewed', { job_id: jobId, job_title: jobTitle, company })
  },

  jobSave: (jobId: string, jobTitle: string, saved: boolean) => {
    posthog.capture(saved ? 'job_saved' : 'job_unsaved', { job_id: jobId, job_title: jobTitle })
  },

  applyClick: (jobId: string, jobTitle: string, company: string, applyUrl: string) => {
    posthog.capture('apply_clicked', { job_id: jobId, job_title: jobTitle, company, apply_url: applyUrl })
  },

  // Search and filtering
  search: (query: string, resultsCount: number) => {
    posthog.capture('search_performed', { query, results_count: resultsCount })
  },

  filterApplied: (filterType: string, filterValue: string) => {
    posthog.capture('filter_applied', { filter_type: filterType, filter_value: filterValue })
  },

  // Auth events
  signUp: (method: string) => {
    posthog.capture('user_signed_up', { method })
  },

  login: (method: string) => {
    posthog.capture('user_logged_in', { method })
  },

  logout: () => {
    posthog.capture('user_logged_out')
    posthog.reset()
  },

  // Subscription events
  subscriptionStarted: (plan: string, price: number) => {
    posthog.capture('subscription_started', { plan, price })
  },

  subscriptionCancelled: (plan: string) => {
    posthog.capture('subscription_cancelled', { plan })
  },

  // Job posting events
  jobPostStarted: () => {
    posthog.capture('job_post_started')
  },

  jobPostCompleted: (jobId: string, options: { featured?: boolean; sticky?: boolean; rainbow?: boolean }) => {
    posthog.capture('job_post_completed', { job_id: jobId, ...options })
  },

  jobPostPaymentStarted: (amount: number) => {
    posthog.capture('job_post_payment_started', { amount })
  },

  // User identification
  identify: (userId: string, traits?: Record<string, unknown>) => {
    posthog.identify(userId, traits)
  },
}
