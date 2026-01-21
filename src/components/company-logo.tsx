'use client'

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

// Building icon HTML for fallback
const buildingIconHtml = (size: number) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-neutral-400"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`

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
  // Determine image source: source favicon > company logo > clearbit
  const sourceFavicon = source ? getSourceFavicon(source) : null
  const imgSrc = sourceFavicon || companyLogo || getCompanyLogoUrl(company)
  const clearbitUrl = getCompanyLogoUrl(company)

  const baseClasses = `rounded-full border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden ${sizeClasses} ${className}`

  return (
    <div className={`${baseClasses} bg-white`}>
      <img
        src={imgSrc}
        alt={company}
        className="w-full h-full object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          // If we haven't tried Clearbit yet and current src isn't Clearbit, try it
          if (!target.dataset.triedClearbit && !target.src.includes('logo.clearbit.com')) {
            target.dataset.triedClearbit = 'true'
            target.src = clearbitUrl
          } else {
            // All fallbacks failed, show building icon
            target.style.display = 'none'
            target.parentElement!.className = `${sizeClasses} ${className} rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0`
            target.parentElement!.innerHTML = buildingIconHtml(iconSize)
          }
        }}
      />
    </div>
  )
}
