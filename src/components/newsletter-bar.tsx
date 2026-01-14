'use client'

import { useState } from 'react'

export function NewsletterBar() {
  const [show, setShow] = useState(true)
  const [email, setEmail] = useState('')

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 border-t border-neutral-800">
      <div className="max-w-6xl mx-auto px-8 py-3 flex items-center justify-center gap-8">
        <p className="text-sm text-neutral-300 flex-1">
          Don't miss out. Get the latest remote design jobs delivered to your inbox weekly.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-60 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm text-white placeholder:text-neutral-500 hover:border-neutral-600 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.2)] transition-all focus:outline-none focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600"
          />
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-900 border border-white/10 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all bg-white hover:bg-neutral-100"
          >
            Subscribe
          </button>
        </div>
        <button
          onClick={() => setShow(false)}
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
