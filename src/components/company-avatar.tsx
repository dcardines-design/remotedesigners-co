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
 * Fallback chain:
 * 1. Source favicon (e.g., Dribbble) - if source is provided
 * 2. Company logo from database
 * 3. Clearbit logo - dynamically generated, works for known companies
 * 4. Icon Horse favicon - reliable favicon service
 * 5. Initials - final fallback (e.g., "AP" for Apple)
 */
export function CompanyAvatar({
  company,
  logo,
  source = '',
  size = 'md',
  className = ''
}: CompanyAvatarProps) {
  const [fallbackLevel, setFallbackLevel] = useState(0)
  // 0 = primary (source favicon or company logo)
  // 1 = clearbit
  // 2 = icon horse favicon
  // 3 = initials

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 md:w-12 md:h-12 text-sm',
    lg: 'w-12 h-12 md:w-16 md:h-16 text-xl'
  }

  const sourceFavicon = getSourceFavicon(source)
  const primarySrc = sourceFavicon || logo || null

  // If no primary source, start at clearbit level
  const effectiveLevel = !primarySrc && fallbackLevel === 0 ? 1 : fallbackLevel

  const handleError = () => {
    setFallbackLevel(prev => prev + 1)
  }

  // Show initials
  if (effectiveLevel >= 3) {
    return (
      <div className={`rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}>
        <span className="font-medium text-neutral-400">{getInitials(company)}</span>
      </div>
    )
  }

  // Show Icon Horse favicon
  if (effectiveLevel === 2) {
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

  // Show clearbit logo
  if (effectiveLevel === 1) {
    return (
      <div className={`rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}>
        <img
          src={getClearbitLogoUrl(company)}
          alt={company}
          className="w-full h-full object-contain"
          onError={handleError}
        />
      </div>
    )
  }

  // Show primary source (source favicon or company logo)
  return (
    <div className={`rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}>
      <img
        src={primarySrc!}
        alt={company}
        className="w-full h-full object-contain"
        onError={handleError}
      />
    </div>
  )
}
