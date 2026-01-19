// Shared location keywords for filtering jobs across the application
// Used by both the jobs API and the daily digest cron

export const LOCATION_KEYWORDS: Record<string, string[]> = {
  'worldwide': ['remote', 'worldwide', 'anywhere', 'global'],
  'usa': ['usa', 'united states', 'us', 'america', 'u.s.', 'new york', 'san francisco', 'los angeles', 'seattle', 'austin', 'boston', 'chicago', 'denver', 'miami', 'atlanta'],
  'europe': ['europe', 'eu', 'european', 'emea'],
  'uk': ['uk', 'united kingdom', 'london', 'england', 'britain', 'manchester'],
  'canada': ['canada', 'canadian', 'toronto', 'vancouver', 'montreal'],
  'germany': ['germany', 'german', 'berlin', 'munich', 'frankfurt'],
  'north-america': ['north america', 'usa', 'canada', 'us', 'americas'],
  'latin-america': ['latin america', 'latam', 'south america', 'brazil', 'mexico', 'argentina'],
  'asia': ['asia', 'apac', 'singapore', 'japan', 'india', 'china', 'hong kong', 'korea', 'philippines'],
  'oceania': ['oceania', 'australia', 'new zealand', 'sydney', 'melbourne'],
  'middle-east': ['middle east', 'uae', 'dubai', 'israel', 'saudi'],
  'africa': ['africa', 'south africa', 'nigeria', 'kenya', 'egypt'],
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
