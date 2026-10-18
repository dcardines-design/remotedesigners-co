'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

// Events are sent through /ingest (see rewrites in next.config.js) so ad
// blockers don't drop them. ui_host only affects links back to the PostHog app.
const POSTHOG_UI_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_REGION === 'eu'
    ? 'https://eu.posthog.com'
    : 'https://us.posthog.com'

if (typeof window !== 'undefined' && POSTHOG_KEY && !posthog.__loaded) {
  posthog.init(POSTHOG_KEY, {
    api_host: '/ingest',
    ui_host: POSTHOG_UI_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false, // handled by PostHogPageview below
    capture_pageleave: true,
  })

  // Several apps share one PostHog project, so stamp every event with the app
  // name and filter insights by `app = remotedesigners`.
  posthog.register({ app: 'remotedesigners' })
}

function PostHogPageview() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!POSTHOG_KEY || !pathname) return

    const query = searchParams?.toString()
    posthog.capture('$pageview', {
      $current_url: `${window.location.origin}${pathname}${query ? `?${query}` : ''}`,
    })
  }, [pathname, searchParams])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!POSTHOG_KEY) return <>{children}</>

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      {children}
    </PHProvider>
  )
}
