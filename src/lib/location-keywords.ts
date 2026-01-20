// Shared location keywords for filtering jobs across the application
// Used by the jobs API, daily digest cron, and SEO landing pages
// This is the single source of truth for all location filtering

// Shared arrays for keys that need aliases (homepage vs SEO page slugs differ)
const latamKeywords = ['latin america', 'latam', 'south america', 'brazil', 'mexico', 'argentina', 'colombia', 'chile', 'peru', 'central america']
const australiaKeywords = ['australia', 'australian', 'oceania', 'new zealand', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'anz']

// Remote work keywords that indicate a job can be done from anywhere
const REMOTE_WORK_KEYWORDS = [
  'remote', 'worldwide', 'anywhere', 'global', 'international', 'distributed', 'location independent',
  'work from home', 'wfh', 'home office', 'telecommute', 'telework', 'virtual', 'fully remote',
  'remote-first', 'remote first', '100% remote', 'work remotely', 'home-based', 'home based'
]

export const LOCATION_KEYWORDS: Record<string, string[]> = {
  'worldwide': REMOTE_WORK_KEYWORDS,
  'usa': ['usa', 'united states', 'us', 'america', 'american', 'u.s.', 'new york', 'san francisco', 'los angeles', 'seattle', 'austin', 'boston', 'chicago', 'denver', 'miami', 'atlanta'],
  'europe': ['europe', 'eu', 'european', 'emea', 'germany', 'france', 'netherlands', 'spain', 'italy', 'sweden', 'denmark', 'portugal', 'ireland', 'austria', 'belgium'],
  'uk': ['uk', 'united kingdom', 'london', 'england', 'britain', 'british', 'manchester', 'birmingham', 'edinburgh', 'scotland', 'wales'],
  'canada': ['canada', 'canadian', 'toronto', 'vancouver', 'montreal', 'ottawa', 'calgary'],
  'germany': ['germany', 'german', 'berlin', 'munich', 'frankfurt'],
  'north-america': ['north america', 'usa', 'canada', 'us', 'americas'],
  'latin-america': latamKeywords,  // Used by homepage filter
  'latam': latamKeywords,          // Used by SEO pages (alias)
  'asia': ['asia', 'apac', 'singapore', 'japan', 'india', 'china', 'hong kong', 'korea', 'taiwan', 'vietnam', 'indonesia', 'malaysia', 'philippines', 'thailand'],
  'oceania': australiaKeywords,    // Used by homepage filter
  'australia': australiaKeywords,  // Used by SEO pages (alias)
  'middle-east': ['middle east', 'uae', 'dubai', 'israel', 'saudi', 'saudi arabia', 'qatar', 'bahrain', 'kuwait', 'mena'],
  'africa': ['africa', 'african', 'south africa', 'nigeria', 'kenya', 'egypt', 'ghana', 'rwanda', 'morocco'],
}

// Job type keyword mapping for filtering (used by daily digest)
export const JOB_TYPE_KEYWORDS: Record<string, string[]> = {
  'product-design': ['product design', 'product designer'],
  'ux-design': ['ux design', 'ux designer', 'user experience'],
  'ui-design': ['ui design', 'ui designer', 'user interface'],
  'visual-design': ['visual design', 'visual designer'],
  'brand-design': ['brand design', 'brand designer', 'branding'],
  'graphic-design': ['graphic design', 'graphic designer'],
  'motion-design': ['motion design', 'motion designer', 'motion graphics', 'animator'],
  'interaction-design': ['interaction design', 'interaction designer', 'ixd'],
  'web-design': ['web design', 'web designer'],
  'design-systems': ['design system', 'design ops'],
  'design-lead': ['design lead', 'design director', 'head of design', 'design manager', 'vp design'],
  'user-research': ['user research', 'ux research', 'researcher'],
}
