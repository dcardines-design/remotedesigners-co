/**
 * AI Content Generation for Blog Posts
 */

import { chatCompletion } from '@/lib/openrouter'
import { BlogTopic, buildTopicContext, interpolateTitle } from './topics'
import { JobInsights } from './job-insights'
import {
  generateSlug,
  calculateReadingTime,
  countWords,
  generateMetaDescription,
  BlogCategory,
} from './seo-helpers'

export interface GeneratedContent {
  title: string
  slug: string
  meta_title: string
  meta_description: string
  focus_keyword: string
  secondary_keywords: string[]
  excerpt: string
  content: string
  tags: string[]
  featured_image_alt: string
  word_count: number
  reading_time_minutes: number
  category: BlogCategory
}

const SYSTEM_PROMPT = `You are an expert content writer for RemoteDesigners.co, a job board for remote design professionals. Write SEO-optimized blog posts following these guidelines:

SEO REQUIREMENTS:
1. Include the focus keyword in:
   - The title (near the beginning)
   - The first paragraph (within first 100 words)
   - At least 2 H2 headings
   - The meta description
   - Image alt text suggestion
   - Naturally throughout (1-2% density)

2. Structure:
   - Compelling title under 60 characters
   - H2 headings every 200-300 words
   - Short paragraphs (2-4 sentences)
   - Bullet points and numbered lists
   - Bold key takeaways

3. Content:
   - 1,200-1,800 words
   - Actionable advice
   - Include statistics and data when available
   - End with clear CTA directing readers to browse jobs

4. Internal linking:
   - Include 2-3 links to job listing pages using markdown format

OUTPUT FORMAT (JSON only, no markdown code blocks):
{
  "title": "SEO-optimized title under 60 chars",
  "meta_title": "Title | RemoteDesigners.co (under 60 chars)",
  "meta_description": "Compelling description with keyword, 150-160 chars",
  "focus_keyword": "primary keyword",
  "secondary_keywords": ["keyword2", "keyword3"],
  "excerpt": "2-3 sentence summary for cards",
  "content": "Full markdown content with proper headings...",
  "tags": ["relevant", "tags"],
  "featured_image_alt": "Descriptive alt text with keyword"
}

IMPORTANT: Return ONLY valid JSON. No additional text or markdown code blocks.`

/**
 * Generate a complete blog post using AI
 */
export async function generateBlogPost(
  topic: BlogTopic,
  insights: JobInsights
): Promise<GeneratedContent> {
  // Interpolate the title template
  const interpolatedTitle = interpolateTitle(topic.title, {})

  // Build context with job insights
  const context = buildTopicContext(topic, insights)

  const userPrompt = `Write a blog post about: "${interpolatedTitle}"

FOCUS KEYWORD: ${topic.focusKeyword}
SECONDARY KEYWORDS: ${topic.secondaryKeywords.join(', ')}
CATEGORY: ${topic.category}

CONTEXT AND DATA TO USE:
${context}

Remember to:
- Keep the title under 60 characters
- Write 1,200-1,800 words
- Use the focus keyword "${topic.focusKeyword}" naturally (1-2% density)
- Include internal links to our job pages
- Make it actionable and valuable for remote designers

Return ONLY the JSON object, no other text.`

  try {
    const response = await chatCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      {
        model: 'anthropic/claude-3.5-sonnet',
        temperature: 0.7,
        max_tokens: 4000,
      }
    )

    // Parse the JSON response
    let parsed: {
      title: string
      meta_title: string
      meta_description: string
      focus_keyword: string
      secondary_keywords: string[]
      excerpt: string
      content: string
      tags: string[]
      featured_image_alt: string
    }

    try {
      // Clean up response - remove any markdown code blocks
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      parsed = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('Failed to parse AI response:', response)
      throw new Error('Failed to parse AI-generated content as JSON')
    }

    // Generate slug from title
    const slug = generateSlug(parsed.title)

    // Calculate metrics
    const wordCount = countWords(parsed.content)
    const readingTime = calculateReadingTime(parsed.content)

    // Ensure meta description is under 160 chars
    const metaDescription = parsed.meta_description.length > 160
      ? generateMetaDescription(parsed.content, parsed.focus_keyword)
      : parsed.meta_description

    return {
      title: parsed.title.substring(0, 255),
      slug,
      meta_title: parsed.meta_title.substring(0, 70),
      meta_description: metaDescription.substring(0, 160),
      focus_keyword: parsed.focus_keyword || topic.focusKeyword,
      secondary_keywords: parsed.secondary_keywords || topic.secondaryKeywords,
      excerpt: parsed.excerpt.substring(0, 500),
      content: parsed.content,
      tags: [...new Set([...parsed.tags, ...topic.tags])],
      featured_image_alt: parsed.featured_image_alt.substring(0, 255),
      word_count: wordCount,
      reading_time_minutes: readingTime,
      category: topic.category,
    }
  } catch (error) {
    console.error('Content generation error:', error)
    throw error
  }
}

/**
 * Validate generated content meets SEO requirements
 */
export function validateGeneratedContent(content: GeneratedContent): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Title checks
  if (content.title.length > 70) {
    issues.push(`Title too long (${content.title.length} chars)`)
  }

  // Meta description
  if (content.meta_description.length < 100) {
    issues.push('Meta description too short')
  }
  if (content.meta_description.length > 160) {
    issues.push('Meta description too long')
  }

  // Content length
  if (content.word_count < 800) {
    issues.push(`Content too short (${content.word_count} words)`)
  }

  // Keyword presence
  const contentLower = content.content.toLowerCase()
  const keywordLower = content.focus_keyword.toLowerCase()

  if (!contentLower.includes(keywordLower)) {
    issues.push('Focus keyword not found in content')
  }

  // Check for headings
  const h2Count = (content.content.match(/^## /gm) || []).length
  if (h2Count < 3) {
    issues.push('Too few H2 headings (need at least 3)')
  }

  // Check for internal links
  const internalLinks = content.content.match(/\[([^\]]+)\]\(\/(jobs|remote-)[^)]+\)/g) || []
  if (internalLinks.length < 2) {
    issues.push('Too few internal links')
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Regenerate content with improvements if validation fails
 */
export async function regenerateWithFixes(
  original: GeneratedContent,
  issues: string[]
): Promise<GeneratedContent> {
  const fixPrompt = `The previous blog post had these issues:
${issues.map(i => `- ${i}`).join('\n')}

Please regenerate the blog post fixing these specific issues.

ORIGINAL TITLE: ${original.title}
FOCUS KEYWORD: ${original.focus_keyword}
CATEGORY: ${original.category}

Ensure:
- Title under 60 characters
- Meta description 150-160 characters
- Content 1200-1800 words
- At least 4 H2 headings
- At least 2 internal links to /jobs or /remote-* pages
- Focus keyword appears in first paragraph and throughout (1-2% density)

Return ONLY valid JSON with the same structure as before.`

  const response = await chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'assistant', content: JSON.stringify(original) },
      { role: 'user', content: fixPrompt },
    ],
    {
      model: 'anthropic/claude-3.5-sonnet',
      temperature: 0.6,
      max_tokens: 4000,
    }
  )

  const cleanedResponse = response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const parsed = JSON.parse(cleanedResponse)
  const wordCount = countWords(parsed.content)

  return {
    ...original,
    ...parsed,
    slug: generateSlug(parsed.title),
    word_count: wordCount,
    reading_time_minutes: calculateReadingTime(parsed.content),
  }
}
