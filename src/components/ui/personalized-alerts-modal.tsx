'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Select, RainbowButton } from '@/components/ui'
import { toast } from 'sonner'

// Job type options
const JOB_TYPE_OPTIONS = [
  { value: 'all', label: 'All Design Jobs' },
  { value: 'product-design', label: 'Product Design' },
  { value: 'ux-design', label: 'UX Design' },
  { value: 'ui-design', label: 'UI Design' },
  { value: 'visual-design', label: 'Visual Design' },
  { value: 'brand-design', label: 'Brand Design' },
  { value: 'graphic-design', label: 'Graphic Design' },
  { value: 'motion-design', label: 'Motion Design' },
  { value: 'interaction-design', label: 'Interaction Design' },
  { value: 'web-design', label: 'Web Design' },
  { value: 'design-systems', label: 'Design Systems' },
  { value: 'design-lead', label: 'Design Lead/Director' },
  { value: 'user-research', label: 'User Research' },
]

// Location options
const LOCATION_OPTIONS = [
  { value: 'worldwide', label: 'Anywhere (Remote)' },
  { value: 'usa', label: 'United States' },
  { value: 'europe', label: 'Europe' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'canada', label: 'Canada' },
  { value: 'germany', label: 'Germany' },
  { value: 'north-america', label: 'North America' },
  { value: 'latin-america', label: 'Latin America' },
  { value: 'asia', label: 'Asia' },
  { value: 'australia', label: 'Australia' },
  { value: 'middle-east', label: 'Middle East' },
  { value: 'africa', label: 'Africa' },
]

interface PersonalizedAlertsModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string | null
  existingPreferences?: {
    jobTypes?: string[]
    locations?: string[]
  }
}

export function PersonalizedAlertsModal({
  isOpen,
  onClose,
  userEmail,
  existingPreferences
}: PersonalizedAlertsModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState(userEmail || '')
  const [jobType, setJobType] = useState(existingPreferences?.jobTypes?.[0] || 'all')
  const [location, setLocation] = useState(existingPreferences?.locations?.[0] || 'worldwide')
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(userEmail || '')
      setJobType(existingPreferences?.jobTypes?.[0] || 'all')
      setLocation(existingPreferences?.locations?.[0] || 'worldwide')
      setEmailError(null)
    }
  }, [isOpen, userEmail, existingPreferences])

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

  const validateEmail = (email: string) => {
    return email && email.includes('@') && email.includes('.')
  }

  const handleCreateAlert = async () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setEmailError(null)

    try {
      // First, try to save preferences (this will check if user is subscribed)
      const response = await fetch('/api/subscribe/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          preferences: {
            jobTypes: jobType === 'all' ? [] : [jobType],
            locations: location === 'worldwide' ? [] : [location],
          },
        }),
      })

      const data = await response.json()

      if (response.status === 404) {
        // User is not subscribed - store preferences in sessionStorage and redirect
        sessionStorage.setItem('pendingAlertPreferences', JSON.stringify({
          email: email.toLowerCase(),
          jobTypes: jobType === 'all' ? [] : [jobType],
          locations: location === 'worldwide' ? [] : [location],
        }))

        onClose()
        toast('Please subscribe to enable job alerts', {
          description: 'Your preferences have been saved. Complete your subscription to activate alerts.',
        })

        // Redirect to membership page with email pre-filled
        router.push(`/membership?email=${encodeURIComponent(email.toLowerCase())}&from=alerts`)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences')
      }

      // Success - user is subscribed and preferences were saved
      toast.success('Job alert created!', {
        description: 'You\'ll receive daily emails matching your preferences.',
      })
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-xl font-semibold text-neutral-900">
            Create Job Alert
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Get daily emails for jobs that match your preferences
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          <Select
            label="Job Type"
            value={jobType}
            onChange={setJobType}
            options={JOB_TYPE_OPTIONS}
            placeholder="Select job type..."
          />

          <Select
            label="Location"
            value={location}
            onChange={setLocation}
            options={LOCATION_OPTIONS}
            placeholder="Select location..."
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailError(null)
            }}
            placeholder="your@email.com"
            error={emailError || undefined}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              size="md"
              fullWidth
            >
              Cancel
            </Button>
            <RainbowButton
              onClick={handleCreateAlert}
              disabled={isLoading || !email}
              size="sm"
              className="flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Alert'}
            </RainbowButton>
          </div>
        </div>
      </div>
    </div>
  )
}
