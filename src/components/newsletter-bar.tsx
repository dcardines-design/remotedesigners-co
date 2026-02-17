'use client'

import { useState, useEffect } from 'react'
import { trackEvent } from '@/components/analytics-provider'

// Export height constant for other components
export const NEWSLETTER_BAR_HEIGHT = 56

export function NewsletterBar() {
  const [show, setShow] = useState(true)

  // Check localStorage on mount - respect 24 hour dismissal
  useEffect(() => {
    const dismissedAt = localStorage.getItem('newsletter-dismissed-at')
    if (dismissedAt) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60)
      if (hoursSinceDismissed < 24) {
        setShow(false)
      } else {
        // 24 hours passed, clear the dismissal
        localStorage.removeItem('newsletter-dismissed-at')
      }
    }
  }, [])

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('newsletter-dismissed-at', Date.now().toString())
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('newsletter-visibility', { detail: { visible: false } }))
  }
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message || 'Successfully subscribed!')
        setEmail('')
        // Track newsletter signup
        trackEvent.newsletterSignup('footer')
        // Auto-hide after success
        setTimeout(() => handleDismiss(), 3000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to subscribe')
      }
    } catch (err) {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 border-t border-neutral-800">
      <div className={`max-w-6xl mx-auto px-8 flex items-center justify-center gap-8 ${status === 'error' ? 'py-3 pb-7' : 'py-3'}`}>
        {status === 'success' ? (
          <p className="text-sm text-green-400 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {message}
          </p>
        ) : (
          <>
            <p className="text-sm text-neutral-300 flex-1">
              Get the latest remote design jobs delivered to your inbox daily.
            </p>
            <form onSubmit={handleSubscribe} className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    if (status === 'error') setStatus('idle')
                  }}
                  disabled={status === 'loading'}
                  className={`w-60 bg-neutral-800 border rounded-lg px-4 py-2 text-sm text-white placeholder:text-neutral-500 hover:border-neutral-600 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.2)] transition-all focus:outline-none focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600 disabled:opacity-50 ${
                    status === 'error' ? 'border-red-500' : 'border-neutral-700'
                  }`}
                />
                {status === 'error' && (
                  <p className="absolute -bottom-5 left-0 text-xs text-red-400">{message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-900 border border-white/10 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all bg-white hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Subscribing...
                  </span>
                ) : (
                  'Subscribe'
                )}
              </button>
            </form>
          </>
        )}
        <button
          onClick={handleDismiss}
          className="text-neutral-500 hover:text-neutral-300 transition-colors p-1"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
