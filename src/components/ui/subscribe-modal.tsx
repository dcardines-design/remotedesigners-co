'use client'

import { useState, useEffect } from 'react'
import { Input, RainbowButton } from '@/components/ui'
import { SUBSCRIPTION_PRICING, FREE_JOBS_LIMIT, type SubscriptionPlan } from '@/lib/stripe'

interface SubscribeModalProps {
  isOpen: boolean
  onClose: () => void
  jobTeaser?: {
    title: string
    company: string
  }
  userEmail?: string | null
  isLoggedIn?: boolean
}

const plans: { id: SubscriptionPlan; label: string; price: number; perMonth: string; badge?: string }[] = [
  { id: 'monthly', label: 'Monthly', price: SUBSCRIPTION_PRICING.MONTHLY, perMonth: '$12.99/mo' },
  { id: 'quarterly', label: 'Quarterly', price: SUBSCRIPTION_PRICING.QUARTERLY, perMonth: '$9.67/mo', badge: 'Save 25%' },
  { id: 'annual', label: 'Annual', price: SUBSCRIPTION_PRICING.ANNUAL, perMonth: '$4.08/mo', badge: 'Best Value' },
]

export function SubscribeModal({ isOpen, onClose, jobTeaser, userEmail, isLoggedIn }: SubscribeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual')
  const [email, setEmail] = useState(userEmail || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSubscribe = async () => {
    if (!isLoggedIn && !email) {
      setError('Please enter your email')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/subscribe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          email: isLoggedIn ? userEmail : email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan)!

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 animate-in fade-in zoom-in-95 duration-200">
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 mb-4">
            <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-medium text-neutral-900 tracking-tight">
            Unlock All Jobs
          </h2>
          <p className="mt-2 text-neutral-500">
            You've viewed {FREE_JOBS_LIMIT} free jobs. Subscribe to see everything.
          </p>
        </div>

        {/* Job teaser */}
        {jobTeaser && (
          <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">You're trying to view</p>
            <p className="font-medium text-neutral-900">{jobTeaser.title}</p>
            <p className="text-sm text-neutral-500">{jobTeaser.company}</p>
          </div>
        )}

        {/* Plan selector */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative p-3 rounded-xl border-2 transition-all text-center ${
                selectedPlan === plan.id
                  ? 'border-neutral-900 bg-neutral-50'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-medium px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full whitespace-nowrap">
                  {plan.badge}
                </span>
              )}
              <span className="block text-sm font-medium text-neutral-900">{plan.label}</span>
              <span className="block text-lg font-semibold text-neutral-900">${plan.price}</span>
              <span className="block text-xs text-neutral-500">{plan.perMonth}</span>
            </button>
          ))}
        </div>

        {/* Email input for non-logged in users */}
        {!isLoggedIn && (
          <div className="mb-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              placeholder="you@example.com"
              required
              error={error || undefined}
            />
          </div>
        )}

        {error && isLoggedIn && (
          <div className="mb-4 px-4 py-2.5 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">
            {error}
          </div>
        )}

        {/* Subscribe button */}
        <RainbowButton
          onClick={handleSubscribe}
          disabled={isLoading}
          fullWidth
        >
          {isLoading ? 'Loading...' : `Subscribe for $${selectedPlanData.price}`}
        </RainbowButton>

        {/* Benefits list */}
        <div className="mt-6 space-y-2">
          {[
            'Access to all job listings',
            'New jobs delivered daily',
            'Save & track your favorites',
            'Cancel anytime',
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-sm text-neutral-600">
              <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {benefit}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400 flex items-center justify-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 10h-1V7c0-3.3-2.7-6-6-6S6 3.7 6 7v3H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-9 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3-8H8V7c0-1.7 1.3-3 3-3s3 1.3 3 3v3z"/></svg>
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  )
}
