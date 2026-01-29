// Job API utility functions

import type { AIJobCategorization } from './types'
import {
  EXCLUDE_KEYWORDS,
  REQUIRED_TITLE_KEYWORDS,
  DESIGN_TITLE_PATTERNS,
  CORE_DESIGN_TITLES,
  EXCLUDED_SKILL_TERMS,
  SKILL_PATTERNS,
} from './constants'

// Check if a job is a design job based on title and tags
export function isDesignJob(title: string, tags?: string[], description?: string): boolean {
  const lowerTitle = title.toLowerCase()

  // First, check if title contains excluded keywords - immediate rejection
  const hasExcludedKeyword = EXCLUDE_KEYWORDS.some(keyword =>
    lowerTitle.includes(keyword.toLowerCase())
  )

  if (hasExcludedKeyword) {
    return false
  }

  // Title must contain at least one design-related keyword
  const hasRequiredKeyword = REQUIRED_TITLE_KEYWORDS.some(keyword =>
    lowerTitle.includes(keyword.toLowerCase())
  )

  if (!hasRequiredKeyword) {
    return false
  }

  // Check if title matches strong design patterns (most reliable)
  const matchesDesignPattern = DESIGN_TITLE_PATTERNS.some(pattern =>
    pattern.test(title)
  )

  if (matchesDesignPattern) {
    return true
  }

  // Check for core design job titles (must have one of these)
  const hasCoreDesignTitle = CORE_DESIGN_TITLES.some(keyword =>
    lowerTitle.includes(keyword)
  )

  if (hasCoreDesignTitle) {
    return true
  }

  // For jobs without clear design titles, check tags more strictly
  if (tags && tags.length > 0) {
    const lowerTags = tags.map(t => t.toLowerCase())

    // Must have 'design' or 'designer' in tags
    const hasDesignTag = lowerTags.some(tag =>
      tag === 'design' || tag === 'designer' || tag.includes('designer')
    )

    if (hasDesignTag) {
      // Also check for design tools
      const hasDesignTool = lowerTags.some(tag =>
        ['figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'xd', 'invision', 'framer'].includes(tag)
      )
      if (hasDesignTool) {
        return true
      }
    }
  }

  return false
}

// Filter out generic terms that aren't actual skills
export function filterSkills(skills: string[]): string[] {
  return skills.filter(skill => {
    const normalized = skill.trim().toLowerCase()
    return normalized && !EXCLUDED_SKILL_TERMS.includes(normalized)
  })
}

// Extract skills from job description
export function extractSkills(text: string): string[] {
  return SKILL_PATTERNS.filter(skill =>
    text.toLowerCase().includes(skill.toLowerCase())
  )
}

// Parse experience level from job title/description
export function parseExperienceLevel(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('senior') || lower.includes('sr.') || lower.includes('lead')) return 'senior'
  if (lower.includes('junior') || lower.includes('jr.') || lower.includes('entry')) return 'entry'
  if (lower.includes('principal') || lower.includes('staff') || lower.includes('director')) return 'lead'
  return 'mid'
}

// Parse job type from text
export function parseJobType(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('contract') || lower.includes('contractor')) return 'contract'
  if (lower.includes('part-time') || lower.includes('part time')) return 'part-time'
  if (lower.includes('freelance')) return 'freelance'
  if (lower.includes('internship') || lower.includes('intern ')) return 'internship'
  if (lower.includes('temporary') || lower.includes('temp ')) return 'contract'
  return 'full-time'
}

// AI-powered job categorization using OpenRouter
export async function categorizeJobWithAI(
  title: string,
  company: string,
  description: string
): Promise<AIJobCategorization | null> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return null

  try {
    const prompt = `Analyze this job posting and extract structured data. Return ONLY valid JSON, no markdown.

Job Title: ${title}
Company: ${company}
Description: ${description.slice(0, 3000)}

Return JSON with these exact fields:
{
  "experience_level": "entry" | "mid" | "senior" | "lead",
  "job_type": "full-time" | "part-time" | "contract" | "freelance" | "internship",
  "skills": ["skill1", "skill2", ...] (max 10 relevant design/tech skills),
  "salary_min": number or null (annual USD, extract if mentioned),
  "salary_max": number or null (annual USD, extract if mentioned)
}

Rules:
- experience_level: "entry" for 0-2 years, "mid" for 2-5 years, "senior" for 5+ years, "lead" for management/principal
- skills: Only include relevant skills like Figma, Sketch, Adobe XD, Photoshop, etc. Max 10.
- salary: Convert to annual USD if possible. If hourly, multiply by 2080. If monthly, multiply by 12.`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://remotedesigners.co',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0,
      }),
    })

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) return null

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    return {
      experience_level: parsed.experience_level || 'mid',
      job_type: parsed.job_type || 'full-time',
      skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 10) : [],
      salary_min: typeof parsed.salary_min === 'number' ? parsed.salary_min : undefined,
      salary_max: typeof parsed.salary_max === 'number' ? parsed.salary_max : undefined,
    }
  } catch (error) {
    console.error('AI categorization error:', error)
    return null
  }
}

// Strip HTML tags from text
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Generate Clearbit logo URL from company name
export function getClearbitLogo(companyName: string): string {
  const companyDomain = companyName.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .concat('.com')
  return `https://logo.clearbit.com/${companyDomain}`
}

// Alternative Clearbit logo URL generator (for ATS)
export function getClearbitLogoUrl(companyName: string): string {
  const cleanName = companyName.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
  return `https://logo.clearbit.com/${cleanName}.com`
}

// Convert HTML to structured text (markdown-style)
export function htmlToStructuredText(html: string): string {
  return html
    // Decode unicode escapes
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\u0026/g, '&')
    // Convert headers to markdown-style
    .replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, '\n\n## $1\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    // Convert list items to bullets
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    // Convert paragraphs and divs to newlines
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    // Remove remaining tags
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
