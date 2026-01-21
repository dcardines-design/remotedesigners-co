// Job utility functions used across the app

export const getInitials = (company: string) => company.substring(0, 2).toUpperCase()

// Generate company logo URL using Clearbit
export const getCompanyLogoUrl = (company: string): string => {
  const cleanName = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
  return `https://logo.clearbit.com/${cleanName}.com`
}

// Google Favicon fallback for when Clearbit fails - returns empty string if company name is invalid
export const getGoogleFaviconUrl = (company: string): string => {
  const cleanName = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
  if (!cleanName || cleanName.length < 2) return '' // Skip invalid names
  return `https://www.google.com/s2/favicons?domain=${cleanName}.com&sz=128`
}

// For certain sources, use the source's favicon instead of company logo
export const getSourceFavicon = (source: string): string | null => {
  if (source === 'dribbble') return 'https://www.google.com/s2/favicons?domain=dribbble.com&sz=128'
  return null
}

// Sources that typically don't have good company logos - skip Clearbit for these
const AGGREGATOR_SOURCES = ['remotive', 'linkedin', 'indeed', 'remoteok', 'weworkremotely', 'nodesk', 'remote.co']

export const shouldSkipLogoFetch = (source: string, companyLogo?: string | null): boolean => {
  // If job already has a logo, use it
  if (companyLogo) return false
  // Skip Clearbit for aggregator sources without logos
  return AGGREGATOR_SOURCES.includes(source?.toLowerCase() || '')
}

export const toTitleCase = (str: string) =>
  str.toLowerCase().replace(/(?:^|[\s-])\w/g, match => match.toUpperCase())

// Extract a simple region label for the chip
export const getRegionChip = (location: string): { label: string; value: string } | null => {
  if (!location) return null
  const loc = location.toLowerCase()

  if (loc.includes('usa') || loc.includes('united states')) return { label: 'USA', value: 'usa' }
  if (loc.includes('europe')) return { label: 'Europe', value: 'europe' }
  if (loc.includes('uk') || loc.includes('united kingdom')) return { label: 'UK', value: 'uk' }
  if (loc.includes('canada')) return { label: 'Canada', value: 'canada' }
  if (loc.includes('germany')) return { label: 'Germany', value: 'germany' }
  if (loc.includes('worldwide') || loc.includes('anywhere')) return { label: 'Worldwide', value: 'worldwide' }

  const parts = location.split(/[,;·]/).map(p => p.trim().replace(/\s*\(Remote\)/gi, ''))
  const firstPart = parts[0]
  if (firstPart && firstPart.length > 0 && firstPart.length <= 20 && !firstPart.toLowerCase().includes('remote')) {
    return { label: firstPart, value: firstPart.toLowerCase() }
  }

  return null
}

export const cleanJobTitle = (title: string): string => {
  let cleaned = title.replace(/^for a position of\s+/i, '')
  cleaned = cleaned.replace(/\s+in\s+[A-Za-z\s,]+(?:,\s*[A-Z]{2})?$/i, '')
  cleaned = cleaned.replace(/^looking for\s+(?:a\s+)?/i, '')
  cleaned = cleaned.replace(/^hiring\s+(?:a\s+)?/i, '')
  cleaned = cleaned.replace(/^seeking\s+(?:a\s+)?/i, '')
  return cleaned.trim()
}

export const getDaysAgo = (posted_at: string) => {
  const diff = Date.now() - new Date(posted_at).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export const isNewJob = (posted_at: string) => getDaysAgo(posted_at) <= 2

export interface JobForSalary {
  salary_text?: string | null
  salary_min?: number | null
  salary_max?: number | null
}

export const formatSalary = (job: JobForSalary): string | null => {
  if (job.salary_text) return job.salary_text
  if (job.salary_min && job.salary_max) {
    return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
  }
  if (job.salary_min) return `$${job.salary_min.toLocaleString()}+`
  if (job.salary_max) return `Up to $${job.salary_max.toLocaleString()}`
  return null
}

export const isRemoteJob = (location: string) => location.toLowerCase().includes('remote')

export const formatLocation = (location: string): string => {
  if (location.length <= 40) return location

  const isRemote = location.toLowerCase().includes('remote')

  if (location.includes(', or ') || location.includes(' or Remote')) {
    const beforeOr = location.split(/,?\s+or\s+/i)[0]
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

  if (location.length > 50) {
    const truncated = location.substring(0, 40).replace(/,?\s*$/, '')
    return isRemote ? `${truncated}... · Remote` : `${truncated}...`
  }

  return location
}

export const formatTimeAgo = (posted_at: string): string => {
  const diff = Date.now() - new Date(posted_at).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

export const generateJobSlug = (title: string, company: string, id: string): string => {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)

  const cleanCompany = company
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30)

  return `${cleanTitle}-at-${cleanCompany}-${id}`
}
