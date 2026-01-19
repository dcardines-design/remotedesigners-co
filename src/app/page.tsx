'use client'

import { useState, useEffect, useCallback, useMemo, Suspense, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { generateJobSlug } from '@/lib/slug'
import { HeroBackground } from '@/components/hero-background'
import { SocialProof, RainbowButton, SubscribeModal, SuccessIcon } from '@/components/ui'
import { useSignupModal } from '@/context/signup-modal-context'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'
import { FREE_JOBS_LIMIT } from '@/lib/stripe'
import { isCompMember } from '@/lib/admin'

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Animated gradient text component with fabric-like flowing effect
function AnimatedGradientText({ children }: { children: React.ReactNode }) {
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let animationId: number
    const startTime = Date.now()

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000

      // Use multiple sine waves at different frequencies for organic motion
      const x = 50 + Math.sin(elapsed * 0.5) * 30 + Math.sin(elapsed * 0.3) * 20
      const y = 50 + Math.cos(elapsed * 0.4) * 30 + Math.cos(elapsed * 0.6) * 20
      const angle = 135 + Math.sin(elapsed * 0.2) * 45

      if (spanRef.current) {
        spanRef.current.style.backgroundPosition = `${x}% ${y}%`
        spanRef.current.style.backgroundImage = `linear-gradient(${angle}deg, #0D9488 0%, #0891B2 15%, #2563EB 30%, #7C3AED 45%, #EC4899 60%, #F97316 75%, #EAB308 90%, #10B981 100%)`
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <span
      ref={spanRef}
      className="bg-clip-text text-transparent"
      style={{
        backgroundSize: '300% 300%',
        backgroundImage: 'linear-gradient(135deg, #0D9488 0%, #0891B2 15%, #2563EB 30%, #7C3AED 45%, #EC4899 60%, #F97316 75%, #EAB308 90%, #10B981 100%)'
      }}
    >
      {children}
    </span>
  )
}

// Filter state interface
interface FilterState {
  search: string
  categories: string[]
  locations: string[]
  jobTypes: string[]
  experience: string
  salaryMin: string
  salaryMax: string
  datePosted: string
  remoteType: string
  skills: string[]
  featuredOnly: boolean
  newOnly: boolean
}

// Skills are now fetched dynamically from the database

const LOCATION_OPTIONS = [
  { value: 'worldwide', label: 'Anywhere in the World', emoji: '🌍' },
  { value: 'usa', label: 'United States', emoji: '🇺🇸' },
  { value: 'europe', label: 'Europe', emoji: '🇪🇺' },
  { value: 'north-america', label: 'North America', emoji: '🏈' },
  { value: 'latin-america', label: 'Latin America', emoji: '💃' },
  { value: 'asia', label: 'Asia', emoji: '⛩️' },
  { value: 'africa', label: 'Africa', emoji: '🌍' },
  { value: 'oceania', label: 'Oceania', emoji: '🌊' },
  { value: 'middle-east', label: 'Middle East', emoji: '🏜️' },
  { value: 'uk', label: 'United Kingdom', emoji: '🇬🇧' },
  { value: 'canada', label: 'Canada', emoji: '🇨🇦' },
  { value: 'germany', label: 'Germany', emoji: '🇩🇪' },
]

// Design category options for filtering
const JOB_CATEGORY_OPTIONS = [
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

const SALARY_OPTIONS = [
  { value: '50000', label: '$50k - $75k USD' },
  { value: '75000', label: '$75k - $100k USD' },
  { value: '100000', label: '$100k - $125k USD' },
  { value: '125000', label: '$125k - $150k USD' },
  { value: '150000', label: '$150k - $200k USD' },
  { value: '200000', label: '$200k - $250k USD' },
  { value: '250000', label: '$250k+ USD' },
]

// Salary dropdown component
function SalaryDropdown({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = SALARY_OPTIONS.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm text-left hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-neutral-900' : 'text-neutral-400'}>
          {selectedOption ? selectedOption.label : 'Select salary (USD)...'}
        </span>
        <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] max-h-60 overflow-y-auto">
          <button
            onClick={() => { onChange(''); setIsOpen(false) }}
            className={`w-full px-3 py-2 text-sm text-left hover:bg-neutral-50 transition-colors ${!value ? 'bg-neutral-50 text-neutral-900' : 'text-neutral-700'}`}
          >
            Any salary
          </button>
          {SALARY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false) }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-neutral-50 transition-colors ${value === opt.value ? 'bg-neutral-50 text-neutral-900' : 'text-neutral-700'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Location search dropdown component
function LocationSearchDropdown({ locations, onToggle }: { locations: string[], onToggle: (loc: string) => void }) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredOptions = LOCATION_OPTIONS.filter(opt =>
    !locations.includes(opt.value) &&
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
      <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
        Location{locations.length > 0 && ` (${locations.length})`}
      </span>
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search regions..."
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
      {locations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {locations.map(loc => {
            const option = LOCATION_OPTIONS.find(o => o.value === loc)
            return (
              <button
                key={loc}
                onClick={() => onToggle(loc)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-neutral-800 text-white rounded-md border border-neutral-800 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[1px] active:shadow-none active:translate-y-[2px] transition-all"
              >
                {option?.emoji} {option?.label || loc}
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

// Category search dropdown component for design disciplines
function CategorySearchDropdown({ categories, onToggle }: { categories: string[], onToggle: (cat: string) => void }) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredOptions = JOB_CATEGORY_OPTIONS.filter(opt =>
    !categories.includes(opt.value) &&
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
      <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
        Specialty{categories.length > 0 && ` (${categories.length})`}
      </span>
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search jobs..."
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
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map(cat => {
            const option = JOB_CATEGORY_OPTIONS.find(o => o.value === cat)
            return (
              <button
                key={cat}
                onClick={() => onToggle(cat)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-neutral-800 text-white rounded-md border border-neutral-800 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.3)] hover:translate-y-[1px] active:shadow-none active:translate-y-[2px] transition-all"
              >
                {option?.emoji} {option?.label || cat}
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

interface NormalizedJob {
  id: string
  source: string
  title: string
  company: string
  company_logo?: string
  location: string
  salary_min?: number
  salary_max?: number
  salary_text?: string
  description?: string
  job_type: string
  experience_level?: string
  skills?: string[]
  posted_at: string
  apply_url: string
  is_featured: boolean
  is_sticky?: boolean
  sticky_until?: string
  is_rainbow?: boolean
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

// Helper functions
const getInitials = (company: string) => company.substring(0, 2).toUpperCase()

// Generate company logo URL using Clearbit
const getCompanyLogoUrl = (company: string): string => {
  // Clean company name and create domain guess
  const cleanName = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')  // Remove special chars
    .replace(/\s+/g, '')        // Remove spaces
  return `https://logo.clearbit.com/${cleanName}.com`
}

// Google Favicon fallback for when Clearbit fails
const getGoogleFaviconUrl = (company: string): string => {
  const cleanName = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
  return `https://www.google.com/s2/favicons?domain=${cleanName}.com&sz=128`
}

// For certain sources, use the source's favicon instead of company logo
const getSourceFavicon = (source: string): string | null => {
  if (source === 'dribbble') return 'https://www.google.com/s2/favicons?domain=dribbble.com&sz=128'
  return null
}

const toTitleCase = (str: string) =>
  str.toLowerCase().replace(/(?:^|[\s-])\w/g, match => match.toUpperCase())

// Extract a simple region label for the chip (first city/country or "Remote")
const getRegionChip = (location: string): { label: string; value: string } | null => {
  if (!location) return null
  const loc = location.toLowerCase()

  // Check for specific regions first
  if (loc.includes('usa') || loc.includes('united states')) return { label: 'USA', value: 'usa' }
  if (loc.includes('europe')) return { label: 'Europe', value: 'europe' }
  if (loc.includes('uk') || loc.includes('united kingdom')) return { label: 'UK', value: 'uk' }
  if (loc.includes('canada')) return { label: 'Canada', value: 'canada' }
  if (loc.includes('germany')) return { label: 'Germany', value: 'germany' }
  if (loc.includes('worldwide') || loc.includes('anywhere')) return { label: 'Worldwide', value: 'worldwide' }

  // Extract first location part (city or country)
  const parts = location.split(/[,;·]/).map(p => p.trim().replace(/\s*\(Remote\)/gi, ''))
  const firstPart = parts[0]
  if (firstPart && firstPart.length > 0 && firstPart.length <= 20 && !firstPart.toLowerCase().includes('remote')) {
    return { label: firstPart, value: firstPart.toLowerCase() }
  }

  return null
}

const cleanJobTitle = (title: string): string => {
  // Remove "for a position of" prefix
  let cleaned = title.replace(/^for a position of\s+/i, '')

  // Remove location suffix like "in Nashville, TN" or "in New York"
  cleaned = cleaned.replace(/\s+in\s+[A-Za-z\s,]+(?:,\s*[A-Z]{2})?$/i, '')

  // Remove other common prefixes
  cleaned = cleaned.replace(/^looking for\s+(?:a\s+)?/i, '')
  cleaned = cleaned.replace(/^hiring\s+(?:a\s+)?/i, '')
  cleaned = cleaned.replace(/^seeking\s+(?:a\s+)?/i, '')

  return cleaned.trim()
}

const getDaysAgo = (posted_at: string) => {
  const diff = Date.now() - new Date(posted_at).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const isNewJob = (posted_at: string) => getDaysAgo(posted_at) <= 2

const formatSalary = (job: NormalizedJob): string | null => {
  if (job.salary_text) return job.salary_text
  if (job.salary_min && job.salary_max) {
    return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
  }
  if (job.salary_min) return `$${job.salary_min.toLocaleString()}+`
  if (job.salary_max) return `Up to $${job.salary_max.toLocaleString()}`
  return null
}

const isRemoteJob = (location: string) => location.toLowerCase().includes('remote')

const formatLocation = (location: string): string => {
  // If short enough, return as-is
  if (location.length <= 40) return location

  const isRemote = location.toLowerCase().includes('remote')

  // Handle "City, ST" patterns (US format) - split by ", or" or "; "
  if (location.includes(', or ') || location.includes(' or Remote')) {
    const beforeOr = location.split(/,?\s+or\s+/i)[0]
    // Count US-style locations (City, ST)
    const usCities = beforeOr.match(/[A-Za-z\s]+,\s*[A-Z]{2}/g) || []
    if (usCities.length > 0) {
      if (usCities.length === 1) {
        return isRemote ? `${usCities[0]} · Remote` : usCities[0]
      }
      return isRemote
        ? `${usCities[0]} +${usCities.length - 1} more · Remote`
        : `${usCities[0]} +${usCities.length - 1} more`
    }
  }

  // Handle semicolon-separated locations like "Ireland (Remote); Netherlands (Remote)"
  if (location.includes(';')) {
    const parts = location.split(';').map(p => p.trim()).filter(Boolean)
    const allRemote = parts.every(p => p.toLowerCase().includes('remote'))
    const countries = parts.map(p => p.replace(/\s*\(Remote\)/gi, '').trim())

    if (countries.length <= 2) {
      return allRemote ? `${countries.join(', ')} · Remote` : countries.join(', ')
    }

    const displayed = countries.slice(0, 2).join(', ')
    const remaining = countries.length - 2
    return allRemote
      ? `${displayed} +${remaining} more · Remote`
      : `${displayed} +${remaining} more`
  }

  // Fallback: truncate long strings
  if (location.length > 50) {
    const truncated = location.substring(0, 40).replace(/,?\s*$/, '')
    return isRemote ? `${truncated}... · Remote` : `${truncated}...`
  }

  return location
}

const formatTimeAgo = (posted_at: string): string => {
  const diff = Date.now() - new Date(posted_at).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

// Encouraging messages for job seekers
const ENCOURAGEMENT_MESSAGES = [
  "Your dream design role is out there waiting for you. Let's find it together!",
  "Every great designer's journey includes this moment. You've got this!",
  "The perfect opportunity often comes when you least expect it. Stay ready!",
  "Your portfolio + your skills + a little persistence = unstoppable.",
  "Today could be the day you find your next adventure. Let's go!",
  "Remember: every 'no' brings you closer to the perfect 'yes'.",
  "Great things take time. Your breakthrough is coming!",
  "You're not just looking for a job—you're finding your next creative home.",
]

// Welcome Modal Component with confetti and animations
function WelcomeModal({ isOpen, onClose, isLoggedIn }: { isOpen: boolean; onClose: () => void; isLoggedIn: boolean }) {
  const [encouragement] = useState(() =>
    ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)]
  )

  // Trigger continuous confetti while modal is open
  useEffect(() => {
    if (!isOpen) return

    let mounted = true
    let intervalId: NodeJS.Timeout | null = null

    // Dynamically import confetti to avoid SSR issues
    import('canvas-confetti').then((confettiModule) => {
      if (!mounted) return

      const confetti = confettiModule.default
      const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 100 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      // Continuous confetti while modal is open
      intervalId = setInterval(() => {
        if (!mounted) {
          if (intervalId) clearInterval(intervalId)
          return
        }

        // Confetti from both sides with reduced particle count for continuous effect
        confetti({
          ...defaults,
          particleCount: 15,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'],
        })
        confetti({
          ...defaults,
          particleCount: 15,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'],
        })
      }, 400)
    }).catch(() => {
      // Ignore import errors
    })

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 overflow-hidden">
        {/* Gradient overlay - behind content, bottom up */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48 opacity-20 pointer-events-none z-0"
          style={{
            background: 'linear-gradient(135deg, #0D9488 0%, #0891B2 15%, #2563EB 30%, #7C3AED 45%, #EC4899 60%, #F97316 75%, #EAB308 90%, #10B981 100%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-0"
          style={{
            background: 'linear-gradient(to top, transparent 0%, white 100%)',
          }}
        />

        {/* Content wrapper - above gradient */}
        <div className="relative z-10">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <SuccessIcon size="sm" className="mx-auto mb-4" />
            <h2 className="text-2xl font-medium text-neutral-900 tracking-tight">
              {isLoggedIn ? 'Subscription Activated!' : 'Welcome to Remote Designers!'}
            </h2>
            <p className="mt-2 text-neutral-500">
              {isLoggedIn
                ? 'You now have full access to all jobs and premium features.'
                : 'Your account has been created with full access to all jobs.'}
            </p>
          </div>

          {/* Email notice for new users */}
          {!isLoggedIn && (
            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-900">Check your email</p>
                  <p className="text-sm text-amber-700">We sent you a magic link to log in.</p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits list */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            {[
              { emoji: '⚡', text: 'First to Apply', subtext: 'See jobs before LinkedIn', delay: '0s' },
              { emoji: '✨', text: 'Verified & Fresh', subtext: 'No expired posts or scams', delay: '0.5s' },
              { emoji: '🔓', text: 'Unlimited Access', subtext: 'Browse all jobs', delay: '1s' },
              { emoji: '📬', text: 'Daily Job Alerts', subtext: 'Delivered to your inbox', delay: '1.5s' },
            ].map((benefit) => (
              <div
                key={benefit.text}
                className="flex flex-col items-start gap-1 p-4 bg-white rounded-xl border border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)]"
              >
                <span className="text-2xl">{benefit.emoji}</span>
                <span className="text-base font-medium text-neutral-700">{benefit.text}</span>
                <span className="text-xs text-neutral-500">{benefit.subtext}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <RainbowButton onClick={onClose} fullWidth>
            Start Exploring Jobs
          </RainbowButton>
        </div>
      </div>
    </div>
  )
}

// Inner component that uses useSearchParams
function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [jobs, setJobs] = useState<NormalizedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [totalPlatformJobs, setTotalPlatformJobs] = useState<number>(0)
  const [availableSkills, setAvailableSkills] = useState<{ skill: string; count: number }[]>([])
  const [newsletterVisible, setNewsletterVisible] = useState(true)
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [savingJobId, setSavingJobId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [selectedLockedJob, setSelectedLockedJob] = useState<{ title: string; company: string } | null>(null)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const { openSignupModal } = useSignupModal()

  // Check for welcome param (new subscriber from Lemon Squeezy)
  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
      setShowWelcomeModal(true)
      // Clean up URL
      const url = new URL(window.location.href)
      url.searchParams.delete('welcome')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  // Track newsletter bar visibility (respects 24h dismissal)
  useEffect(() => {
    const dismissedAt = localStorage.getItem('newsletter-dismissed-at')
    if (dismissedAt) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60)
      setNewsletterVisible(hoursSinceDismissed >= 24)
    }

    const handleVisibilityChange = (e: CustomEvent) => {
      setNewsletterVisible(e.detail.visible)
    }

    window.addEventListener('newsletter-visibility', handleVisibilityChange as EventListener)
    return () => window.removeEventListener('newsletter-visibility', handleVisibilityChange as EventListener)
  }, [])

  // Check auth status, subscription, and load saved jobs
  useEffect(() => {
    const checkAuthAndSavedJobs = async () => {
      const supabase = createBrowserSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)
        setUserEmail(user.email || null)

        // Comp member bypass - auto-subscribe complimentary members
        if (isCompMember(user.email)) {
          setIsSubscribed(true)
        } else {
          // Check subscription status
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()

          setIsSubscribed(!!subscription)
        }

        // Load saved jobs
        const { data } = await supabase
          .from('saved_jobs')
          .select('job_id')
          .eq('user_id', user.id)

        if (data) {
          setSavedJobIds(new Set(data.map(d => d.job_id)))
        }
      }
    }
    checkAuthAndSavedJobs()
  }, [])

  // Handle save/unsave job
  const handleSaveJob = async (e: React.MouseEvent, jobId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      openSignupModal()
      return
    }

    setSavingJobId(jobId)
    const supabase = createBrowserSupabaseClient()
    const isSaved = savedJobIds.has(jobId)

    try {
      if (isSaved) {
        await supabase
          .from('saved_jobs')
          .delete()
          .eq('user_id', userId)
          .eq('job_id', jobId)
        setSavedJobIds(prev => {
          const next = new Set(prev)
          next.delete(jobId)
          return next
        })
        toast.success('Job removed from saved')
        window.dispatchEvent(new Event('saved-jobs-changed'))
      } else {
        await supabase
          .from('saved_jobs')
          .insert({ user_id: userId, job_id: jobId })
        setSavedJobIds(prev => new Set(prev).add(jobId))
        toast.success('Job saved! 🔖')
        window.dispatchEvent(new Event('saved-jobs-changed'))
      }
    } catch (err) {
      console.error('Failed to save job:', err)
      toast.error('Failed to save job')
    } finally {
      setSavingJobId(null)
    }
  }

  // Initialize filters from URL
  // Collapsible filter sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    quickFilters: true,
    jobType: true,
    workType: true,
    experience: false,
    datePosted: false,
    salary: false,
    skills: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const [filters, setFilters] = useState<FilterState>(() => ({
    search: searchParams.get('search') || '',
    categories: searchParams.getAll('category'),
    locations: searchParams.getAll('location'),
    jobTypes: searchParams.getAll('type'),
    experience: searchParams.get('experience') || '',
    salaryMin: searchParams.get('salary_min') || '',
    salaryMax: searchParams.get('salary_max') || '',
    datePosted: searchParams.get('date_posted') || 'all',
    remoteType: searchParams.get('remote_type') || '',
    skills: searchParams.getAll('skill'),
    featuredOnly: searchParams.get('featured') === 'true',
    newOnly: searchParams.get('new') === 'true',
  }))

  // Debounce filters for API calls
  const debouncedFilters = useDebounce(filters, 300)

  // Sync filters to URL
  const updateURL = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams()

    if (newFilters.search) params.set('search', newFilters.search)
    newFilters.categories.forEach(c => params.append('category', c))
    newFilters.locations.forEach(l => params.append('location', l))
    newFilters.jobTypes.forEach(t => params.append('type', t))
    if (newFilters.experience) params.set('experience', newFilters.experience)
    if (newFilters.salaryMin) params.set('salary_min', newFilters.salaryMin)
    if (newFilters.salaryMax) params.set('salary_max', newFilters.salaryMax)
    if (newFilters.datePosted && newFilters.datePosted !== 'all') params.set('date_posted', newFilters.datePosted)
    if (newFilters.remoteType) params.set('remote_type', newFilters.remoteType)
    newFilters.skills.forEach(s => params.append('skill', s))
    if (newFilters.featuredOnly) params.set('featured', 'true')
    if (newFilters.newOnly) params.set('new', 'true')

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }, [router, pathname])

  const fetchJobs = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)

      const params = new URLSearchParams()
      if (debouncedFilters.search) params.set('search', debouncedFilters.search)
      if (debouncedFilters.categories.length) params.set('category', debouncedFilters.categories.join(','))
      if (debouncedFilters.locations.length) params.set('location', debouncedFilters.locations.join(','))
      if (debouncedFilters.jobTypes.length === 1) params.set('type', debouncedFilters.jobTypes[0])
      if (debouncedFilters.experience) params.set('experience', debouncedFilters.experience)
      if (debouncedFilters.salaryMin) params.set('salary_min', debouncedFilters.salaryMin)
      if (debouncedFilters.salaryMax) params.set('salary_max', debouncedFilters.salaryMax)
      if (debouncedFilters.datePosted && debouncedFilters.datePosted !== 'all') params.set('date_posted', debouncedFilters.datePosted)
      if (debouncedFilters.remoteType) params.set('remote_type', debouncedFilters.remoteType)
      if (debouncedFilters.skills.length) params.set('skills', debouncedFilters.skills.join(','))
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/jobs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch jobs')

      const data = await res.json()

      let filteredJobs = data.jobs as NormalizedJob[]

      // Client-side filters
      if (debouncedFilters.newOnly) {
        filteredJobs = filteredJobs.filter(job => isNewJob(job.posted_at))
      }
      if (debouncedFilters.featuredOnly) {
        filteredJobs = filteredJobs.filter(job => job.is_featured)
      }
      // Client-side category filtering (matches job title)
      if (debouncedFilters.categories.length) {
        filteredJobs = filteredJobs.filter(job => {
          const titleLower = job.title.toLowerCase()
          return debouncedFilters.categories.some(cat => {
            const option = JOB_CATEGORY_OPTIONS.find(o => o.value === cat)
            if (!option) return false
            // Match either the value or label in the job title
            return titleLower.includes(cat.replace(/-/g, ' ')) ||
                   titleLower.includes(option.label.toLowerCase())
          })
        })
      }

      setJobs(prev => append ? [...prev, ...filteredJobs] : filteredJobs)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [debouncedFilters])

  // Fetch when debounced filters change
  useEffect(() => {
    fetchJobs(1, false)
    updateURL(filters)
  }, [debouncedFilters])

  // Fetch available skills on mount
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await fetch('/api/skills')
        if (res.ok) {
          const data = await res.json()
          setAvailableSkills(data.skills || [])
        }
      } catch (err) {
        console.error('Failed to fetch skills:', err)
      }
    }
    fetchSkills()
  }, [])

  // Fetch total platform jobs count on mount (unfiltered)
  useEffect(() => {
    const fetchTotalJobs = async () => {
      try {
        const res = await fetch('/api/jobs?page=1&limit=1')
        if (res.ok) {
          const data = await res.json()
          setTotalPlatformJobs(data.pagination?.total || 0)
        }
      } catch (err) {
        console.error('Failed to fetch total jobs:', err)
      }
    }
    fetchTotalJobs()
  }, [])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.categories.length) count++
    if (filters.locations.length) count++
    if (filters.jobTypes.length) count++
    if (filters.experience) count++
    if (filters.salaryMin) count++
    if (filters.datePosted && filters.datePosted !== 'all') count++
    if (filters.remoteType) count++
    if (filters.skills.length) count++
    if (filters.featuredOnly) count++
    if (filters.newOnly) count++
    return count
  }, [filters])

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleJobType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter(t => t !== type)
        : [...prev.jobTypes, type]
    }))
  }

  const toggleLocation = (location: string) => {
    setFilters(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    }))
  }

  const toggleSkill = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      categories: [],
      locations: [],
      jobTypes: [],
      experience: '',
      salaryMin: '',
      salaryMax: '',
      datePosted: 'all',
      remoteType: '',
      skills: [],
      featuredOnly: false,
      newOnly: false,
    })
  }

  const loadMore = () => {
    if (pagination && pagination.hasMore) {
      fetchJobs(pagination.page + 1, true)
    }
  }

  const newJobsCount = jobs.filter(j => isNewJob(j.posted_at)).length

  return (
    <>
    <div className="bg-neutral-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Hero Section */}
        <div className="mb-16 relative">
          <HeroBackground
            imageSrc="/hero-bg.png"
            opacity={0.15}
            maxHeight="880px"
            offsetTop="-350px"
          />

          <div className="max-w-2xl mx-auto text-center relative z-10">
            <div
              className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-neutral-200/60 opacity-0"
              style={{ animation: 'hero-fade-in 0.2s ease-out 0s forwards' }}
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-glow" />
              <span className="text-sm text-neutral-500">
                {totalPlatformJobs} designer jobs posted
              </span>
            </div>

            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-medium text-neutral-900 leading-tight mb-4 sm:mb-6 font-display tracking-tight opacity-0"
              style={{ animation: 'hero-fade-in 0.2s ease-out 0.05s forwards' }}
            >
              The{' '}
              <AnimatedGradientText><span className="font-ivy-display">Best</span></AnimatedGradientText>
              {' '}and{' '}
              <AnimatedGradientText><span className="font-ivy-display">Latest</span></AnimatedGradientText>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              Remote Design Jobs
            </h1>

            <p
              className="text-base sm:text-lg text-neutral-600 mb-8 sm:mb-10 leading-relaxed opacity-0"
              style={{ animation: 'hero-fade-in 0.2s ease-out 0.1s forwards' }}
            >
              Browse thousands of remote design jobs sourced directly from company career pages, YC startups, and top remote job boards. No middlemen, just verified opportunities updated every hour with the freshest opportunities in UI, UX, product design, graphic design, and more.
            </p>

            <div className="opacity-0" style={{ animation: 'hero-fade-in 0.2s ease-out 0.15s forwards' }}>
              <RainbowButton href="/post-job" size="md">
                Post a job for $99
              </RainbowButton>
            </div>

            {/* Social Proof */}
            <div className="opacity-0" style={{ animation: 'hero-fade-in 0.2s ease-out 0.2s forwards' }}>
              <SocialProof className="mt-10 justify-center" />
            </div>

          </div>
        </div>

        {/* Job Count */}
        <div className="flex items-center gap-2 mb-6 text-base">
          <span className="text-neutral-900">{pagination?.total || 0} designer jobs</span>
          <span className="text-neutral-500">·</span>
          <span className="text-neutral-500">{newJobsCount} new</span>
        </div>

        {/* Main Content - Jobs + Filters */}
        <div className="flex gap-8">
          {/* Job Listings */}
          <div className="flex-1 space-y-4">
            {/* Post a Job Card */}
            <Link href="/post-job" className="block border border-neutral-200 rounded-xl bg-neutral-50/20 p-8 hover:border-neutral-300 hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08),0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-all duration-200 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-400/40 rounded-l-lg" />
              <div className="text-center text-neutral-500">
                <p className="text-2xl mb-1">+</p>
                <p className="text-base">Post a job</p>
              </div>
            </Link>

            {/* Loading State */}
            {loading && (
              <>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="border border-neutral-200 rounded-lg bg-white/10 p-5 relative overflow-hidden animate-pulse">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-200 rounded-l-lg" />
                    <div className="flex gap-4 pl-4">
                      <div className="w-12 h-12 rounded-full bg-neutral-200" />
                      <div className="flex-1">
                        <div className="h-5 bg-neutral-200 rounded w-3/4 mb-3" />
                        <div className="h-4 bg-neutral-200 rounded w-1/2 mb-3" />
                        <div className="flex gap-2">
                          <div className="h-6 bg-neutral-200 rounded w-20" />
                          <div className="h-6 bg-neutral-200 rounded w-24" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="border border-red-200 rounded-lg bg-red-50 p-8 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => fetchJobs(1, false)}
                  className="text-red-600 underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* No Results */}
            {!loading && !error && jobs.length === 0 && (
              <div className="border border-neutral-200 rounded-lg bg-white p-8 text-center">
                <p className="text-neutral-500">No jobs found matching your criteria</p>
              </div>
            )}

            {/* Job Cards */}
            {!loading && jobs.map((job, index) => {
              const isLocked = !isSubscribed && index >= FREE_JOBS_LIMIT
              const isNew = isNewJob(job.posted_at)
              const salary = formatSalary(job)
              const remote = isRemoteJob(job.location)
              const timeAgo = formatTimeAgo(job.posted_at)
              // Determine sticky type: 24h = blue, 7d = purple
              // Determine sticky type: 24h = blue, 7d = purple
              const is7DaySticky = job.is_sticky && job.sticky_until && job.posted_at
                ? (new Date(job.sticky_until).getTime() - new Date(job.posted_at).getTime()) > 2 * 24 * 60 * 60 * 1000
                : false
              const stickyPinColor = is7DaySticky ? 'text-purple-500' : 'text-blue-500'

              // Animation delay - cap at 10 items so later cards don't wait too long
              const animationDelay = Math.min(index, 10) * 0.03

              // For locked jobs, show a blurred card with subscribe overlay
              if (isLocked) {
                return (
                  <div
                    key={job.id}
                    onClick={() => {
                      router.push(`/membership?skip_url=${encodeURIComponent(window.location.href)}`)
                    }}
                    className="block border rounded-xl p-5 relative cursor-pointer bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08),0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-all duration-200 opacity-0"
                    style={{ animation: `job-fade-in 0.2s ease-out ${animationDelay}s forwards` }}
                  >
                    {/* Left border indicator */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-neutral-200" />

                    {/* 10% visible, rest blurred with gradient fade */}
                    <div className="relative flex gap-4 pl-3 select-none pointer-events-none">
                      {/* Company Avatar - blurred */}
                      <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden blur-[3px]">
                        <img
                          src={getSourceFavicon(job.source) || job.company_logo || getCompanyLogoUrl(job.company)}
                          alt={job.company}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            if (!target.dataset.triedFallback) {
                              target.dataset.triedFallback = 'true'
                              target.src = getGoogleFaviconUrl(job.company)
                            } else {
                              target.style.display = 'none'
                              target.parentElement!.innerHTML = `<span class="text-sm font-medium text-neutral-400">${getInitials(job.company)}</span>`
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <h3 className="text-lg font-normal text-neutral-900">{cleanJobTitle(job.title)}</h3>
                          <span className="text-sm text-neutral-400">{timeAgo}</span>
                        </div>
                        <p className="text-sm text-neutral-500 mb-3">{job.company} · {formatLocation(job.location)}</p>
                        <div className="flex gap-2">
                          <span className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200">
                            {toTitleCase(job.job_type)}
                          </span>
                          {salary && (
                            <span className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200">
                              {salary}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* White gradient overlay - 0% to 100% white */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)'
                        }}
                      />
                    </div>

                    {/* Lock overlay */}
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-t from-white/90 via-white/60 to-transparent">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-neutral-200 shadow-sm">
                        <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-sm font-medium text-neutral-900">Subscribe to view</span>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <Link
                  key={job.id}
                  href={`/jobs/${generateJobSlug(job.title, job.company, job.id)}`}
                  className={`block border rounded-xl p-5 relative hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08),0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-all duration-200 cursor-pointer opacity-0 ${
                    job.is_featured
                      ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                      : 'bg-white border-neutral-200 hover:border-neutral-300'
                  }`}
                  style={{ animation: `job-fade-in 0.2s ease-out ${animationDelay}s forwards` }}
                >
                  {/* Left border indicator */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                      job.is_rainbow
                        ? ''
                        : job.is_featured
                          ? 'bg-amber-400'
                          : isNew
                            ? 'bg-green-500'
                            : 'bg-neutral-200'
                    }`}
                    style={job.is_rainbow ? {
                      background: 'linear-gradient(180deg, #ec4899 0%, #8b5cf6 20%, #3b82f6 40%, #10b981 60%, #eab308 80%, #ec4899 100%)',
                      backgroundSize: '100% 300%',
                      animation: 'rainbowFlow 2s linear infinite'
                    } : {}}
                  />

                  <div className="flex gap-4 pl-3">
                    {/* Company Avatar */}
                    <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img
                        src={getSourceFavicon(job.source) || job.company_logo || getCompanyLogoUrl(job.company)}
                        alt={job.company}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          // Try Google Favicon as fallback before showing initials
                          if (!target.dataset.triedFallback) {
                            target.dataset.triedFallback = 'true'
                            target.src = getGoogleFaviconUrl(job.company)
                          } else {
                            // Both Clearbit and Google failed, show initials
                            target.style.display = 'none'
                            target.parentElement!.innerHTML = `<span class="text-sm font-medium text-neutral-400">${getInitials(job.company)}</span>`
                          }
                        }}
                      />
                    </div>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className="text-lg font-normal text-neutral-900">{cleanJobTitle(job.title)}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {job.is_sticky && (
                            <span className={`${stickyPinColor} flex items-center`}>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 4l4 4-1.5 1.5-1-1L14 12l1 5-3 3-2.5-5L5 19.5 4.5 19l4.5-4.5-5-2.5 3-3 5 1 3.5-3.5-1-1L16 4z"/>
                              </svg>
                            </span>
                          )}
                          {isNew && (
                            <a
                              href="/?new=true"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-green-500 text-white text-[10px] font-medium tracking-wider px-2 py-0.5 rounded hover:shadow-[0px_2px_0px_0px_rgba(34,197,94,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                            >
                              NEW
                            </a>
                          )}
                          <span className="text-sm text-neutral-400">{timeAgo}</span>
                        </div>
                      </div>

                      <p className="text-sm text-neutral-500 mb-3">
                        {job.company} · {formatLocation(job.location)}
                      </p>

                      <div className="flex items-end justify-between gap-4">
                        {(() => {
                          const MAX_CHIPS = 5
                          const regionChip = getRegionChip(job.location)

                          // Build array of all chips
                          const allChips: { key: string; element: React.ReactNode }[] = []

                          if (job.is_featured) {
                            allChips.push({
                              key: 'featured',
                              element: (
                                <a
                                  href="/?featured=true"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-yellow-400 text-neutral-900 text-xs font-medium px-2.5 py-1 rounded border border-yellow-500 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                                >
                                  Featured
                                </a>
                              )
                            })
                          }

                          if (job.job_type) {
                            allChips.push({
                              key: 'job_type',
                              element: (
                                <a
                                  href={`/?type=${job.job_type.toLowerCase()}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                                >
                                  {toTitleCase(job.job_type)}
                                </a>
                              )
                            })
                          }

                          if (job.experience_level) {
                            allChips.push({
                              key: 'experience',
                              element: (
                                <a
                                  href={`/?experience=${job.experience_level.toLowerCase()}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                                >
                                  {toTitleCase(job.experience_level)}
                                </a>
                              )
                            })
                          }

                          if (regionChip) {
                            allChips.push({
                              key: 'region',
                              element: (
                                <a
                                  href={`/?location=${encodeURIComponent(regionChip.value)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                                >
                                  {regionChip.label}
                                </a>
                              )
                            })
                          }

                          if (salary) {
                            allChips.push({
                              key: 'salary',
                              element: (
                                <span className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 cursor-default">
                                  {salary}
                                </span>
                              )
                            })
                          }

                          if (remote) {
                            allChips.push({
                              key: 'remote',
                              element: (
                                <a
                                  href="/?remote_type=remote"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                                >
                                  Remote
                                </a>
                              )
                            })
                          }

                          if (job.skills) {
                            job.skills.forEach((skill, index) => {
                              allChips.push({
                                key: `skill-${index}`,
                                element: (
                                  <a
                                    href={`/?skill=${encodeURIComponent(skill)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                                  >
                                    {toTitleCase(skill)}
                                  </a>
                                )
                              })
                            })
                          }

                          const visibleChips = allChips.slice(0, MAX_CHIPS)
                          const hiddenChips = allChips.slice(MAX_CHIPS)
                          const remainingCount = hiddenChips.length

                          return (
                            <div className="flex flex-wrap gap-2 max-w-[70%]">
                              {visibleChips.map(chip => (
                                <span key={chip.key}>{chip.element}</span>
                              ))}
                              {remainingCount > 0 && (
                                <div className="relative group/chips">
                                  <span className="bg-white text-neutral-400 text-xs px-2.5 py-1 rounded border border-neutral-200 cursor-default group-hover/chips:border-neutral-300 group-hover/chips:text-neutral-500 transition-all">
                                    +{remainingCount}
                                  </span>
                                  <div className="absolute left-0 bottom-full mb-1.5 z-20 opacity-0 invisible group-hover/chips:opacity-100 group-hover/chips:visible transition-all duration-150">
                                    <div className="bg-neutral-100 border border-neutral-200 rounded-lg shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] p-2 flex flex-wrap gap-2 min-w-[280px] max-w-[400px]">
                                      {hiddenChips.map(chip => (
                                        <span key={chip.key}>{chip.element}</span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleSaveJob(e, job.id)}
                            disabled={savingJobId === job.id}
                            className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded border transition-all ${
                              savedJobIds.has(job.id)
                                ? 'bg-white border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)]'
                                : 'bg-white border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)]'
                            } ${savingJobId === job.id ? 'opacity-50' : ''}`}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill={savedJobIds.has(job.id) ? '#ef4444' : 'none'}
                              stroke={savedJobIds.has(job.id) ? '#ef4444' : '#737373'}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            </svg>
                          </button>
                          {isSubscribed ? (
                            <a
                              href={job.apply_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation()
                                fetch(`/api/jobs/${job.id}/track`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ type: 'click' })
                                }).catch(() => {})
                              }}
                              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-800 rounded shadow-[0px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all"
                            >
                              Apply
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                              </svg>
                            </a>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                router.push(`/membership?skip_url=${encodeURIComponent(window.location.href)}`)
                              }}
                              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-800 rounded shadow-[0px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all"
                            >
                              Apply
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Load More Button */}
            {!loading && jobs.length > 0 && pagination?.hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full border border-neutral-200 rounded-lg bg-white p-4 text-center text-neutral-900 font-medium shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:bg-neutral-50 hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? 'Loading...' : 'Load more jobs'}
              </button>
            )}
          </div>

          {/* Filters Sidebar */}
          <div className="w-72 flex-shrink-0 hidden md:block">
            <div className={`sticky top-24 bg-neutral-100 border border-neutral-200 rounded-lg flex flex-col transition-all duration-300 ${newsletterVisible ? 'max-h-[calc(100vh-12rem)]' : 'max-h-[calc(100vh-8rem)]'}`}>
              {/* Filter Header - Fixed */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
                <span className="text-sm font-medium text-neutral-900">Filter jobs</span>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                    >
                      Clear ({activeFilterCount})
                    </button>
                  )}
                  <div className="flex items-center">
                    <button
                      onClick={() => setExpandedSections({
                        quickFilters: true,
                        jobType: true,
                        workType: true,
                        experience: true,
                        datePosted: true,
                        salary: true,
                        skills: true,
                      })}
                      className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                      title="Expand all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setExpandedSections({
                        quickFilters: false,
                        jobType: false,
                        workType: false,
                        experience: false,
                        datePosted: false,
                        salary: false,
                        skills: false,
                      })}
                      className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                      title="Collapse all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M15 15v4.5m0-4.5h4.5m-4.5 0 5.25 5.25" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Filter Content */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {/* Design Category Search */}
              <CategorySearchDropdown
                categories={filters.categories}
                onToggle={toggleCategory}
              />

              {/* Location */}
              <LocationSearchDropdown
                locations={filters.locations}
                onToggle={toggleLocation}
              />

              {/* Quick Filters */}
              <div>
                <button
                  onClick={() => toggleSection('quickFilters')}
                  className="flex items-center justify-between w-full py-1 group"
                >
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600">
                    Quick Filters{(filters.featuredOnly || filters.newOnly) && ` (${(filters.featuredOnly ? 1 : 0) + (filters.newOnly ? 1 : 0)})`}
                  </span>
                  <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expandedSections.quickFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.quickFilters && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => handleFilterChange('featuredOnly', !filters.featuredOnly)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                        filters.featuredOnly
                          ? 'bg-neutral-800 text-white border-neutral-800'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                      }`}
                    >
                      Featured
                    </button>
                    <button
                      onClick={() => handleFilterChange('newOnly', !filters.newOnly)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                        filters.newOnly
                          ? 'bg-neutral-800 text-white border-neutral-800'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                      }`}
                    >
                      New
                    </button>
                  </div>
                )}
              </div>

              {/* Job Type */}
              <div>
                <button
                  onClick={() => toggleSection('jobType')}
                  className="flex items-center justify-between w-full py-1 group"
                >
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600">
                    Job Type{filters.jobTypes.length > 0 && ` (${filters.jobTypes.length})`}
                  </span>
                  <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expandedSections.jobType ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.jobType && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {['full-time', 'contract', 'part-time', 'freelance', 'internship'].map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleJobType(type)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-all capitalize ${
                          filters.jobTypes.includes(type)
                            ? 'bg-neutral-800 text-white border-neutral-800'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                        }`}
                      >
                        {type.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Type */}
              <div>
                <button
                  onClick={() => toggleSection('workType')}
                  className="flex items-center justify-between w-full py-1 group"
                >
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600">
                    Work Type{filters.remoteType && ` (1)`}
                  </span>
                  <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expandedSections.workType ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.workType && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      { value: '', label: 'All' },
                      { value: 'remote', label: 'Remote' },
                      { value: 'hybrid', label: 'Hybrid' },
                      { value: 'onsite', label: 'On-site' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange('remoteType', filters.remoteType === option.value ? '' : option.value)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                          filters.remoteType === option.value
                            ? 'bg-neutral-800 text-white border-neutral-800'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Experience Level */}
              <div>
                <button
                  onClick={() => toggleSection('experience')}
                  className="flex items-center justify-between w-full py-1 group"
                >
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600">
                    Experience{filters.experience && ` (1)`}
                  </span>
                  <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expandedSections.experience ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.experience && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      { value: '', label: 'All' },
                      { value: 'entry', label: 'Entry' },
                      { value: 'mid', label: 'Mid' },
                      { value: 'senior', label: 'Senior' },
                      { value: 'lead', label: 'Lead' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange('experience', filters.experience === option.value ? '' : option.value)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                          filters.experience === option.value
                            ? 'bg-neutral-800 text-white border-neutral-800'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Posted */}
              <div>
                <button
                  onClick={() => toggleSection('datePosted')}
                  className="flex items-center justify-between w-full py-1 group"
                >
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600">
                    Date Posted{filters.datePosted && filters.datePosted !== 'all' && ` (1)`}
                  </span>
                  <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expandedSections.datePosted ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.datePosted && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      { value: 'all', label: 'Any time' },
                      { value: '1d', label: '24h' },
                      { value: '7d', label: '7 days' },
                      { value: '30d', label: '30 days' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange('datePosted', option.value)}
                        className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                          filters.datePosted === option.value
                            ? 'bg-neutral-800 text-white border-neutral-800'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Salary Range */}
              <div className="space-y-2">
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
                  Salary{filters.salaryMin && ' (1)'}
                </span>
                <SalaryDropdown
                  value={filters.salaryMin}
                  onChange={(val) => handleFilterChange('salaryMin', val)}
                />
              </div>

              {/* Skills */}
              <div>
                <button
                  onClick={() => toggleSection('skills')}
                  className="flex items-center justify-between w-full py-1 group"
                >
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600">
                    Skills{filters.skills.length > 0 && ` (${filters.skills.length})`}
                  </span>
                  <svg className={`w-4 h-4 text-neutral-400 transition-transform ${expandedSections.skills ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.skills && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {availableSkills.length === 0 ? (
                      <span className="text-xs text-neutral-400">Loading skills...</span>
                    ) : (
                      availableSkills.map(({ skill, count }) => (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                            filters.skills.includes(skill)
                              ? 'bg-neutral-800 text-white border-neutral-800'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                          }`}
                          title={`${count} jobs`}
                        >
                          {toTitleCase(skill)}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Subscribe Modal */}
    <SubscribeModal
      isOpen={showSubscribeModal}
      onClose={() => {
        setShowSubscribeModal(false)
        setSelectedLockedJob(null)
      }}
      jobTeaser={selectedLockedJob || undefined}
      userEmail={userEmail}
      isLoggedIn={!!userId}
    />

    {/* Welcome Modal - shown after successful payment */}
    {showWelcomeModal && (
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        isLoggedIn={!!userId}
      />
    )}
    </>
  )
}

// Main export with Suspense wrapper for useSearchParams
export default function Home() {
  return (
    <Suspense fallback={
      <div className="bg-neutral-50 min-h-screen flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
