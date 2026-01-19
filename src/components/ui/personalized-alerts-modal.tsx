'use client'

import { useState, useEffect, useRef } from 'react'
import { Input, RainbowButton } from '@/components/ui'
import { toast } from 'sonner'

// Job type options with emojis
const JOB_TYPE_OPTIONS = [
  { value: 'product-design', label: 'Product Design', emoji: '🎯' },
  { value: 'ux-design', label: 'UX Design', emoji: '🔬' },
  { value: 'ui-design', label: 'UI Design', emoji: '🎨' },
  { value: 'visual-design', label: 'Visual Design', emoji: '👁️' },
  { value: 'brand-design', label: 'Brand Design', emoji: '✨' },
  { value: 'graphic-design', label: 'Graphic Design', emoji: '🖼️' },
  { value: 'motion-design', label: 'Motion Design', emoji: '🎬' },
  { value: 'interaction-design', label: 'Interaction Design', emoji: '👆' },
  { value: 'web-design', label: 'Web Design', emoji: '🌐' },
  { value: 'design-systems', label: 'Design Systems', emoji: '📐' },
  { value: 'design-lead', label: 'Design Lead/Director', emoji: '👑' },
  { value: 'user-research', label: 'User Research', emoji: '🔍' },
]

// Location options with emojis
const LOCATION_OPTIONS = [
  { value: 'worldwide', label: 'Anywhere in the World', emoji: '🌍' },
  { value: 'usa', label: 'United States', emoji: '🇺🇸' },
  { value: 'europe', label: 'Europe', emoji: '🇪🇺' },
  { value: 'uk', label: 'United Kingdom', emoji: '🇬🇧' },
  { value: 'canada', label: 'Canada', emoji: '🇨🇦' },
  { value: 'germany', label: 'Germany', emoji: '🇩🇪' },
  { value: 'north-america', label: 'North America', emoji: '🏈' },
  { value: 'latin-america', label: 'Latin America', emoji: '💃' },
  { value: 'asia', label: 'Asia', emoji: '⛩️' },
  { value: 'oceania', label: 'Oceania', emoji: '🌊' },
  { value: 'middle-east', label: 'Middle East', emoji: '🏜️' },
  { value: 'africa', label: 'Africa', emoji: '🌍' },
]

// Searchable combobox component
function SearchableCombobox({
  label,
  placeholder,
  options,
  selected,
  onToggle,
}: {
  label: string
  placeholder: string
  options: { value: string; label: string; emoji: string }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter(opt =>
    !selected.includes(opt.value) &&
    (opt.label.toLowerCase().includes(search.toLowerCase()) ||
     opt.value.toLowerCase().includes(search.toLowerCase()))
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (value: string) => {
    onToggle(value)
    setSearch('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-neutral-700">
        {label}{selected.length > 0 && ` (${selected.length})`}
      </span>
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2.5 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
          />
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] max-h-48 overflow-y-auto">
            {filteredOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selected.map(val => {
            const option = options.find(o => o.value === val)
            return (
              <button
                key={val}
                onClick={() => onToggle(val)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-neutral-800 text-white rounded-md border border-neutral-800 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[1px] active:shadow-none active:translate-y-[2px] transition-all"
              >
                {option?.emoji} {option?.label || val}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface PersonalizedAlertsModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string | null
  existingPreferences?: {
    jobTypes?: string[]
    locations?: string[]
  }
  isMember?: boolean
}

export function PersonalizedAlertsModal({
  isOpen,
  onClose,
  userEmail,
  existingPreferences,
  isMember = false
}: PersonalizedAlertsModalProps) {
  const [email, setEmail] = useState(userEmail || '')
  const [jobTypes, setJobTypes] = useState<string[]>(existingPreferences?.jobTypes || [])
  const [locations, setLocations] = useState<string[]>(existingPreferences?.locations || [])
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const isUpdate = !!(existingPreferences?.jobTypes?.length || existingPreferences?.locations?.length)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(userEmail || '')
      setJobTypes(existingPreferences?.jobTypes || [])
      setLocations(existingPreferences?.locations || [])
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

  const toggleJobType = (value: string) => {
    setJobTypes(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

  const toggleLocation = (value: string) => {
    setLocations(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

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
      const response = await fetch('/api/subscribe/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          preferences: {
            jobTypes,
            locations,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences')
      }

      // Success!
      toast(isUpdate ? 'Job alert updated!' : 'Job alert created!', {
        icon: (
          <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ),
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
            {isUpdate ? (
              'Update Job Alert'
            ) : (
              <>
                Create{' '}
                <span
                  className="font-ivy-display bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg, #0D9488 0%, #0891B2 15%, #2563EB 30%, #7C3AED 45%, #EC4899 60%, #F97316 75%, #EAB308 90%, #10B981 100%)',
                  }}
                >
                  {isMember ? 'Daily' : 'Weekly'}
                </span>{' '}
                Job Alert
              </>
            )}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {isUpdate
              ? 'Update your job alert preferences'
              : isMember
                ? 'Get daily emails for jobs that match your preferences'
                : 'Get weekly emails for jobs that match your preferences'}
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          <SearchableCombobox
            label="Job Types"
            placeholder="Search job types..."
            options={JOB_TYPE_OPTIONS}
            selected={jobTypes}
            onToggle={toggleJobType}
          />

          <SearchableCombobox
            label="Locations"
            placeholder="Search locations..."
            options={LOCATION_OPTIONS}
            selected={locations}
            onToggle={toggleLocation}
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
        <div className="px-6 pt-2 pb-6">
          <RainbowButton
            onClick={handleCreateAlert}
            disabled={isLoading || !email}
            fullWidth
          >
            {isLoading ? (isUpdate ? 'Updating...' : 'Creating...') : (isUpdate ? '🔔 Update Alert' : '🔔 Create Alert')}
          </RainbowButton>
        </div>
      </div>
    </div>
  )
}
