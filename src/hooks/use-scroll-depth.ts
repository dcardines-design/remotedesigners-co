'use client'

import { useEffect, useRef } from 'react'
import { trackEvent } from '@/components/analytics-provider'

export function useScrollDepth(pageType: string) {
  const tracked = useRef(new Set<number>())

  useEffect(() => {
    const thresholds = [25, 50, 75, 100]

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight <= 0) return

      const percent = Math.round((window.scrollY / scrollHeight) * 100)

      thresholds.forEach(threshold => {
        if (percent >= threshold && !tracked.current.has(threshold)) {
          tracked.current.add(threshold)
          trackEvent.scrollDepth(threshold, pageType)
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // Check initial scroll position (for pages that load scrolled)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [pageType])
}
