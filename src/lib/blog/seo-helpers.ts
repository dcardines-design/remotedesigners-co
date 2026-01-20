/**
 * SEO helper utilities for blog posts
 */

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters (including emojis)
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '')  // Remove leading/trailing hyphens
    .substring(0, 80)         // Limit length
}

/**
 * Calculate reading time in minutes
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).filter(Boolean).length
  return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * Count words in content
 */
export function countWords(content: string): number {
  return content.split(/\s+/).filter(Boolean).length
}

/**
 * Extract keywords from content for SEO
 */
export function extractKeywords(content: string, limit: number = 10): string[] {
  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
    'their', 'what', 'which', 'who', 'whom', 'where', 'when', 'why',
    'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'not', 'only', 'same', 'so', 'than',
    'too', 'very', 'just', 'about', 'above', 'after', 'again', 'against',
    'as', 'at', 'before', 'below', 'between', 'by', 'for', 'from',
    'in', 'into', 'of', 'off', 'on', 'out', 'over', 'through', 'to',
    'under', 'up', 'with', 'you', 'your', 'we', 'our', 'i', 'my',
  ])

  // Extract words and count frequency
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))

  const frequency: Record<string, number> = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })

  // Sort by frequency and return top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word)
}

/**
 * Truncate text to a maximum length at word boundary
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text

  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...'
}

/**
 * Generate meta description from content
 */
export function generateMetaDescription(content: string, focusKeyword?: string): string {
  // Remove markdown syntax
  const plainText = content
    .replace(/#{1,6}\s/g, '')     // Headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1')     // Italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/`[^`]+`/g, '')      // Code
    .replace(/\n+/g, ' ')         // Newlines
    .trim()

  // Get first 160 chars
  let description = truncateText(plainText, 155)

  // If focus keyword exists and isn't in the first sentence, prepend it
  if (focusKeyword && !description.toLowerCase().includes(focusKeyword.toLowerCase())) {
    description = `${focusKeyword} - ${description}`.substring(0, 155)
  }

  return description
}

/**
 * Validate SEO requirements for a blog post
 */
export function validateSEO(post: {
  title: string
  meta_title?: string
  meta_description?: string
  content: string
  focus_keyword?: string
}): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  // Title checks
  if (post.title.length > 70) {
    issues.push('Title exceeds 70 characters')
  }
  if (post.meta_title && post.meta_title.length > 70) {
    issues.push('Meta title exceeds 70 characters')
  }

  // Meta description checks
  if (!post.meta_description) {
    issues.push('Missing meta description')
  } else if (post.meta_description.length > 160) {
    issues.push('Meta description exceeds 160 characters')
  } else if (post.meta_description.length < 120) {
    issues.push('Meta description is too short (aim for 150-160 chars)')
  }

  // Focus keyword checks
  if (post.focus_keyword) {
    const contentLower = post.content.toLowerCase()
    const keywordLower = post.focus_keyword.toLowerCase()

    // Check keyword in first 100 words
    const first100Words = post.content.split(/\s+/).slice(0, 100).join(' ').toLowerCase()
    if (!first100Words.includes(keywordLower)) {
      issues.push('Focus keyword not in first 100 words')
    }

    // Check keyword density (1-2%)
    const wordCount = countWords(post.content)
    const keywordCount = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length
    const density = (keywordCount / wordCount) * 100

    if (density < 0.5) {
      issues.push('Keyword density too low (aim for 1-2%)')
    } else if (density > 3) {
      issues.push('Keyword density too high (aim for 1-2%)')
    }
  }

  // Content length
  const wordCount = countWords(post.content)
  if (wordCount < 1000) {
    issues.push('Content is short (aim for 1200-1800 words)')
  }

  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * Blog post categories
 */
export const BLOG_CATEGORIES = {
  'job-market-insights': {
    name: 'Job Market Insights',
    emoji: '📊',
    description: 'Data-driven analysis of remote design job trends',
  },
  'remote-work-tips': {
    name: 'Remote Work Tips',
    emoji: '🏠',
    description: 'Productivity and lifestyle tips for remote designers',
  },
  'career-advice': {
    name: 'Career Advice',
    emoji: '🚀',
    description: 'Professional growth and career development for designers',
  },
  'design-news': {
    name: 'Design News',
    emoji: '📰',
    description: 'Latest updates, trends, and news in the design industry',
  },
  'ux-design': {
    name: 'UX Design',
    emoji: '🎯',
    description: 'User experience design insights, methods, and best practices',
  },
  'product-design': {
    name: 'Product Design',
    emoji: '✨',
    description: 'Product design strategies, processes, and case studies',
  },
  'graphic-design': {
    name: 'Graphic Design',
    emoji: '🎨',
    description: 'Visual design, branding, and creative techniques',
  },
} as const

export type BlogCategory = keyof typeof BLOG_CATEGORIES
