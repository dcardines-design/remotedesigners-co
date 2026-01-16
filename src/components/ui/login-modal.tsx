'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { Input, RainbowButton } from '@/components/ui'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignup: () => void
}

export function LoginModal({ isOpen, onClose, onSwitchToSignup }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)
    setEmailError(null)

    const supabase = createBrowserSupabaseClient()

    // First check if user exists by trying to sign in with OTP
    // If signups are disabled for OTP, Supabase returns an error for non-existent users
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false, // Don't create new user, just sign in existing
      },
    })

    setIsLoading(false)

    if (error) {
      // Check if it's a "user not found" type error
      if (error.message.toLowerCase().includes('signup') ||
          error.message.toLowerCase().includes('not found') ||
          error.message.toLowerCase().includes('no user')) {
        setEmailError('No account found with this email. Please sign up first.')
      } else {
        setMessage({ type: 'error', text: error.message })
      }
    } else {
      setMessage({
        type: 'success',
        text: 'Check your email for the magic link to sign in.',
      })
      setEmail('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-medium text-neutral-900 tracking-tight">
            Welcome back <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
          </h2>
          <p className="mt-2 text-neutral-500">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailError(null) // Clear error when typing
            }}
            placeholder="you@example.com"
            required
            error={emailError || undefined}
          />

          {message && (
            <div
              className={`px-4 py-2.5 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <RainbowButton type="submit" disabled={isLoading} fullWidth>
            {isLoading ? 'Sending magic link...' : 'Send magic link'}
          </RainbowButton>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          We'll send you a magic link to sign in instantly. No password needed.
        </p>

        <div className="mt-6 pt-6 border-t border-neutral-200">
          <p className="text-xs text-neutral-400 text-center">
            By signing in, you agree to our<br />
            <Link href="/terms" className="text-neutral-600 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-neutral-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-neutral-500 text-sm">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            className="text-neutral-900 font-medium hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}
