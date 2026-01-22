'use client'

import { useState } from 'react'

// Get company initials (first 2 letters)
const getInitials = (company: string) => company.substring(0, 2).toUpperCase()

// Clearbit logo URL (works great for known companies)
const getClearbitLogoUrl = (company: string): string => {
  const cleanName = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
  return `https://logo.clearbit.com/${cleanName}.com`
}

// Icon Horse favicon - reliable favicon service
const getFaviconUrl = (company: string): string => {
  const cleanName = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
  return `https://icon.horse/icon/${cleanName}.com`
}

// Source-specific favicons (e.g., Dribbble jobs show Dribbble logo)
const getSourceFavicon = (source: string): string | null => {
  if (source === 'dribbble') return 'https://www.google.com/s2/favicons?domain=dribbble.com&sz=256'
  return null
}

interface CompanyAvatarProps {
  company: string
  logo?: string | null
  source?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * CompanyAvatar - Displays company logo with smart fallbacks
 *
 * Matches homepage logic:
 * 1. Source favicon OR company_logo OR Clearbit (initial)
 * 2. Icon Horse favicon (1st fallback)
 * 3. Initials (final fallback)
 */
export function CompanyAvatar({
  company,
  logo,
  source = '',
  size = 'md',
  className = ''
}: CompanyAvatarProps) {
  const [triedFallback, setTriedFallback] = useState(false)
  const [showInitials, setShowInitials] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 md:w-12 md:h-12 text-sm',
    lg: 'w-12 h-12 md:w-16 md:h-16 text-xl'
  }

  // Initial src: source favicon OR company_logo OR Clearbit
  const primarySrc = getSourceFavicon(source) || logo || getClearbitLogoUrl(company)

  const handleError = () => {
    if (!triedFallback) {
      setTriedFallback(true)
    } else {
      setShowInitials(true)
    }
  }

  // Show initials
  if (showInitials) {
    return (
      <div className={`rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}>
        <span className="font-medium text-neutral-400">{getInitials(company)}</span>
      </div>
    )
  }

  // Show Icon Horse (after first error)
  if (triedFallback) {
    return (
      <div className={`rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}>
        <img
          src={getFaviconUrl(company)}
          alt={company}
          className="w-full h-full object-contain"
          onError={handleError}
        />
      </div>
    )
  }

  // Show primary (source favicon OR company_logo OR Clearbit)
  return (
    <div className={`rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}>
      <img
        src={primarySrc}
        alt={company}
        className="w-full h-full object-contain"
        onError={handleError}
      />
    </div>
  )
}
