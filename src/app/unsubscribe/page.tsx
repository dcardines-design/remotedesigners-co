'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading')

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }

    const unsubscribe = async () => {
      try {
        const res = await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (res.ok) {
          setStatus('success')
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    }

    unsubscribe()
  }, [token])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Unsubscribing...</h1>
            <p className="text-neutral-500">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">You've been unsubscribed</h1>
            <p className="text-neutral-500 mb-8">You won't receive any more emails from us. We're sorry to see you go!</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#2a2a2a] text-white rounded-lg font-medium hover:bg-[#3a3a3a] transition-colors"
            >
              Back to Homepage
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Something went wrong</h1>
            <p className="text-neutral-500 mb-8">We couldn't process your unsubscribe request. Please try again or contact support.</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#2a2a2a] text-white rounded-lg font-medium hover:bg-[#3a3a3a] transition-colors"
            >
              Back to Homepage
            </Link>
          </>
        )}

        {status === 'invalid' && (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Invalid Link</h1>
            <p className="text-neutral-500 mb-8">This unsubscribe link is invalid or has expired.</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#2a2a2a] text-white rounded-lg font-medium hover:bg-[#3a3a3a] transition-colors"
            >
              Back to Homepage
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Loading...</h1>
        </div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
