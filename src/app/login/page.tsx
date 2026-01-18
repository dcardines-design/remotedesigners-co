'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { Input, Button } from '@/components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const supabase = createBrowserSupabaseClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setIsLoading(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({
        type: 'success',
        text: 'Check your email for the magic link to sign in.',
      })
      setEmail('')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-start justify-center pt-12 pb-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-neutral-900 tracking-tight">Welcome back</h1>
          <p className="mt-2 text-neutral-500">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-neutral-200 p-8 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
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

            <Button type="submit" disabled={isLoading} fullWidth>
              {isLoading ? 'Sending magic link...' : 'Send magic link'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
            We'll send you a magic link to sign in instantly. No password needed.
          </p>
        </div>

        <p className="mt-6 text-center text-neutral-500">
          Don't have an account?{' '}
          <Link href="/signup" className="text-neutral-900 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
