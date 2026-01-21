'use client'

import { useState } from 'react'

const getCompanyLogoUrl = (company: string): string => {
  const cleanName = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
  return `https://logo.clearbit.com/${cleanName}.com`
}

// For certain sources, use the source's favicon instead of company logo
const getSourceFavicon = (source: string): string | null => {
  if (source === 'dribbble') return 'https://www.google.com/s2/favicons?domain=dribbble.com&sz=128'
  return null
}

// Building icon SVG for fallback
const BuildingIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-neutral-400"
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
    <path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
  </svg>
)

interface CompanyLogoProps {
  company: string
  companyLogo?: string | null
  /** Job source (e.g., 'dribbble', 'linkedin') - used for source-specific favicons */
  source?: string
  /** Size classes for the container. Use Tailwind classes like 'w-10 h-10 md:w-12 md:h-12' */
  sizeClasses?: string
  /** Icon size in pixels for the fallback building icon */
  iconSize?: number
  /** Additional classes to add to the container */
  className?: string
}

export function CompanyLogo({
  company,
  companyLogo,
  source,
  sizeClasses = 'w-10 h-10 md:w-12 md:h-12',
  iconSize = 20,
  className = ''
}: CompanyLogoProps) {
  // Determine initial image source: source favicon > company logo > clearbit
  const sourceFavicon = source ? getSourceFavicon(source) : null
  const initialSrc = sourceFavicon || companyLogo || getCompanyLogoUrl(company)

  const [imgSrc, setImgSrc] = useState(initialSrc)
  const [triedClearbit, setTriedClearbit] = useState(!companyLogo && !sourceFavicon) // Already using Clearbit if no logo
  const [showFallback, setShowFallback] = useState(false)

  const handleError = () => {
    if (!triedClearbit) {
      setTriedClearbit(true)
      setImgSrc(getCompanyLogoUrl(company))
    } else {
      setShowFallback(true)
    }
  }

  const baseClasses = `rounded-full border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden ${sizeClasses} ${className}`

  if (showFallback) {
    return (
      <div className={`${baseClasses} bg-neutral-100`}>
        <BuildingIcon size={iconSize} />
      </div>
    )
  }

  return (
    <div className={`${baseClasses} bg-white`}>
      <img
        src={imgSrc}
        alt={company}
        className="w-full h-full object-contain"
        onError={handleError}
      />
    </div>
  )
}
