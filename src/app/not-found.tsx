'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'

export default function NotFound() {
  // Add class to body so navbar knows to be transparent
  useEffect(() => {
    document.body.classList.add('transparent-navbar-page')
    return () => {
      document.body.classList.remove('transparent-navbar-page')
    }
  }, [])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 relative overflow-visible">
      {/* Background image - Mobile */}
      <div className="md:hidden absolute left-0 right-0 pointer-events-none" style={{ top: '-64px', height: '80vh' }}>
        <img
          src="/404-bg.png"
          alt=""
          className="w-full h-full object-cover object-top"
          style={{ opacity: 0.2 }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0) 40%, rgba(250,250,250,1) 100%)' }}
        />
      </div>
      {/* Background image - Desktop */}
      <div className="hidden md:block absolute left-0 right-0 pointer-events-none" style={{ top: '-64px', height: '80vh' }}>
        <img
          src="/404-bg.png"
          alt=""
          className="w-full h-full object-cover object-top"
          style={{ opacity: 0.2 }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0) 60%, rgba(250,250,250,1) 100%)' }}
        />
      </div>

      <div className="max-w-md w-full text-center relative z-10">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#525252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Page not found</h1>
        <p className="text-neutral-500 mb-8">Sorry, we couldn't find the page you're looking for.</p>
        <Link href="/">
          <Button variant="primary" size="lg">
            Back to Homepage
          </Button>
        </Link>
      </div>
    </div>
  )
}
