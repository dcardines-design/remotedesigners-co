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
// Image search disabled - using DALL-E featured images only
// import { replaceImagePlaceholders } from './image-search'

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

TONE & VOICE (Think Morning Brew meets design Twitter):
- Punchy and witty - short sentences that pack a punch. Snappy one-liners welcome.
- Pop culture references and analogies that actually land (Netflix binges, coffee addiction, Slack chaos)
- Conversational but clever - you're the friend who's funny AND knows their stuff
- Bold claims, then back them up. "Hot take: Your portfolio matters less than you think. Here's why."
- Use rhetorical questions to pull readers in. "Sound familiar?"
- Light roasting is encouraged - poke fun at design trends, startup culture, "we're like a family" job posts
- Keep paragraphs tight - 2-3 sentences max. White space is your friend.
- Subheadings should be interesting, not boring ("Why This Matters" > "Introduction")
- Sprinkle in personality: "spoiler alert:", "plot twist:", "the bottom line:"
- No corporate speak. If your CEO would put it in a memo, rewrite it.
- ADD AN EMOJI at the start of the title (e.g. "🚀 Top Remote Design Jobs" or "💰 Salary Guide for Designers"). Pick relevant emojis like 🎨 💼 🚀 💰 📈 🎯 💡 ✨ 🔥 📊

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
   - Write mostly in prose paragraphs - use bullet points sparingly (max 2-3 lists per article)
   - Lead with paragraphs that explain concepts, then optionally use a short list for key takeaways
   - Bold key phrases within paragraphs for scanability
   - Each section should have at least 2-3 paragraphs before any list

3. Content (CRITICAL - MUST BE 1,200+ WORDS):
   - MINIMUM 1,200 words, ideally 1,500-1,800 words - THIS IS NON-NEGOTIABLE
   - Each H2 section should be 200-300 words with 3-4 substantial paragraphs
   - Include AT LEAST 5-6 H2 sections to ensure sufficient length
   - Actionable advice written in engaging prose
   - Include statistics and data woven naturally into paragraphs
   - Tell stories and use examples - don't just list tips
   - Each major point should be explained in 2-3 paragraphs, not just a bullet
   - End with clear CTA directing readers to browse jobs
   - IF YOUR CONTENT IS UNDER 1,200 WORDS, ADD MORE DEPTH TO EACH SECTION

4. REAL-WORLD EXAMPLES & REFERENCES (CRITICAL):
   - Include 3-5 specific, real company examples (e.g., "Airbnb's design system", "Stripe's checkout UX")
   - Reference actual tools by name (Figma, Framer, Linear, Notion, etc.)
   - Cite real studies or reports when discussing trends (e.g., "According to Dribbble's 2024 Design Report...")
   - Mention real designers or design leaders when relevant (e.g., "As Julie Zhuo wrote in The Making of a Manager...")
   - Use specific numbers and dates when possible
   - Reference real design systems (Material Design, Apple HIG, Shopify Polaris)
   - Include real job titles and company names from actual postings
   - DO NOT make up fake statistics or studies - use well-known facts or be vague ("studies show" if unsure)

6. SOURCES SECTION (REQUIRED):
   - End every article with a "## Sources" section
   - Include 4-6 real sources with hyperlinks from this VERIFIED list:

   VERIFIED SOURCE URLs (use these exact URLs):
   - [Nielsen Norman Group - Remote UX Work](https://www.nngroup.com/articles/remote-ux/)
   - [Nielsen Norman Group - Research Methods](https://www.nngroup.com/topic/research-methods/)
   - [Nielsen Norman Group - UX Articles](https://www.nngroup.com/articles/)
   - [Figma - Design Systems 101](https://www.figma.com/blog/design-systems-101-what-is-a-design-system/)
   - [Figma - How to Build a Design System](https://www.figma.com/blog/design-systems-102-how-to-build-your-design-system/)
   - [Figma Best Practices](https://www.figma.com/best-practices/)
   - [Adobe 2025 Creative Trends](https://blog.adobe.com/en/publish/2024/12/03/escaping-surreal-familiar-adobe-2025-creative-trends-forecast)
   - [Adobe 2026 Creative Trends](https://business.adobe.com/resources/creative-trends-report.html)
   - [Glassdoor - UX Designer Salaries](https://www.glassdoor.com/Salaries/ux-designer-salary-SRCH_KO0,11.htm)
   - [Glassdoor - Remote UX Designer Pay](https://www.glassdoor.com/Salaries/remote-ux-designer-salary-SRCH_IL.0,6_IS11047_KO7,18.htm)
   - [LinkedIn Jobs on the Rise 2026](https://www.linkedin.com/pulse/linkedin-jobs-rise-2026-25-fastest-growing-roles-us-linkedin-news-dlb1c)
   - [FlexJobs Remote Work Index](https://www.flexjobs.com/blog/post/flexjobs-remote-work-economy-index)
   - [Robert Half - Remote Work Statistics](https://www.roberthalf.com/us/en/insights/research/remote-work-statistics-and-trends)
   - [A List Apart](https://alistapart.com/)
   - [Smashing Magazine](https://www.smashingmagazine.com/)
   - [UX Collective](https://uxdesign.cc/)
   - [Coursera - UX Designer Salary Guide](https://www.coursera.org/articles/ux-designer-salary-guide)

   Pick 4-6 sources relevant to the article topic from this list.

5. Internal linking:
   - Include 2-3 links to job listing pages using markdown format

IMPORTANT: Do NOT include the title as an H1 heading at the start of the content. The title is displayed separately in the page header. Start the content directly with the first paragraph or H2 section.

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

CRITICAL REQUIREMENTS:
- Keep the title under 60 characters
- MUST BE AT LEAST 1,200 WORDS (aim for 1,500 words) - this is mandatory, not optional
- Include 5-6 H2 sections, each with 3-4 substantial paragraphs (200-300 words per section)
- Use the focus keyword "${topic.focusKeyword}" naturally (1-2% density)
- Include 3-5 real company/tool examples with specific details
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
        max_tokens: 6000,
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
      // Clean up response - remove any markdown code blocks and extract JSON
      let cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      // Try to extract JSON object if there's extra content
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0]
      }

      // Fix common JSON issues from AI responses
      cleanedResponse = cleanedResponse
        .replace(/[\u2018\u2019]/g, "'")  // Smart single quotes
        .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
        .replace(/\u2013/g, '-')          // En dash
        .replace(/\u2014/g, '--')         // Em dash

      // Fix unescaped control characters in the content field
      // Extract content value manually since it spans multiple lines
      const contentStartMatch = cleanedResponse.match(/"content"\s*:\s*"/)
      if (contentStartMatch) {
        const startIdx = cleanedResponse.indexOf(contentStartMatch[0]) + contentStartMatch[0].length
        // Find the end - look for pattern "}\n or "},\n  "tags" or similar
        // The content ends when we find ", followed by a JSON field name or }
        const endPatterns = [
          /"\s*,\s*"tags"\s*:/,
          /"\s*,\s*"featured_image_alt"\s*:/,
          /"\s*\}/,
        ]

        let endIdx = -1
        for (const pattern of endPatterns) {
          const afterStart = cleanedResponse.slice(startIdx)
          const match = afterStart.match(pattern)
          if (match && match.index !== undefined) {
            const potentialEnd = startIdx + match.index
            if (endIdx === -1 || potentialEnd < endIdx) {
              endIdx = potentialEnd
            }
          }
        }

        if (endIdx > startIdx) {
          const rawContent = cleanedResponse.slice(startIdx, endIdx)
          // Properly escape control characters
          const escapedContent = rawContent
            .split('\n')
            .join('\\n')
            .split('\r')
            .join('\\r')
            .split('\t')
            .join('\\t')
          cleanedResponse =
            cleanedResponse.slice(0, startIdx) +
            escapedContent +
            cleanedResponse.slice(endIdx)
        }
      }

      parsed = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('Failed to parse AI response:', response)
      console.error('Parse error:', parseError)
      throw new Error('Failed to parse AI-generated content as JSON')
    }

    // Generate slug from title
    const slug = generateSlug(parsed.title)

    // Calculate metrics
    let wordCount = countWords(parsed.content)
    let finalContent = parsed.content

    // If content is too short, expand it (up to 2 passes)
    if (wordCount < 1100) {
      console.log(`Content is ${wordCount} words, expanding (pass 1)...`)
      finalContent = await expandContent(parsed.content, topic, insights)
      wordCount = countWords(finalContent)
      console.log(`After pass 1: ${wordCount} words`)

      // Second pass if still too short
      if (wordCount < 1200) {
        console.log(`Still short, expanding (pass 2)...`)
        finalContent = await expandContent(finalContent, topic, insights)
        wordCount = countWords(finalContent)
        console.log(`After pass 2: ${wordCount} words`)
      }
    }

    const readingTime = calculateReadingTime(finalContent)

    // Ensure meta description is under 160 chars
    const metaDescription = parsed.meta_description.length > 160
      ? generateMetaDescription(finalContent, parsed.focus_keyword)
      : parsed.meta_description

    return {
      title: parsed.title.substring(0, 255),
      slug,
      meta_title: parsed.meta_title.substring(0, 70),
      meta_description: metaDescription.substring(0, 160),
      focus_keyword: parsed.focus_keyword || topic.focusKeyword,
      secondary_keywords: parsed.secondary_keywords || topic.secondaryKeywords,
      excerpt: parsed.excerpt.substring(0, 500),
      content: finalContent,
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
 * Expand content that's too short
 */
async function expandContent(
  content: string,
  topic: BlogTopic,
  insights: JobInsights
): Promise<string> {
  const currentWordCount = countWords(content)

  const expandPrompt = `TASK: You must EXPAND this blog post from ${currentWordCount} words to AT LEAST 1,400 words.

CRITICAL: Do NOT summarize or shorten. You must ADD content, not remove it. The output MUST be longer than the input.

ORIGINAL CONTENT (${currentWordCount} words):
---
${content}
---

EXPANSION INSTRUCTIONS:
1. Keep ALL existing content - do not remove anything
2. For EACH existing H2 section, add 2-3 NEW paragraphs with:
   - More specific examples (Airbnb, Stripe, Figma, Google, Apple, Spotify)
   - Real statistics or studies
   - Actionable tips
   - Industry leader quotes or references
3. Add 1-2 NEW H2 sections if needed to reach word count
4. Keep the same punchy, witty tone throughout
5. Keep all existing internal links

CONTEXT TO USE:
- There are ${insights.totalJobs} active remote design jobs
- Top hiring companies: ${insights.topCompanies.slice(0, 5).map(c => c.company).join(', ')}

OUTPUT: Return ONLY the full expanded markdown content. No JSON, no explanations.
The content MUST be at least 1,400 words. Count carefully.`

  const response = await chatCompletion(
    [{ role: 'user', content: expandPrompt }],
    {
      model: 'anthropic/claude-3.5-sonnet',
      temperature: 0.8,
      max_tokens: 8000,
    }
  )

  // Clean the response
  let expanded = response.trim()
  // Remove any markdown code blocks if present
  if (expanded.startsWith('```')) {
    expanded = expanded.replace(/^```(?:markdown)?\n?/, '').replace(/\n?```$/, '')
  }

  // If expansion failed (shorter or equal), return original
  const expandedWordCount = countWords(expanded)
  if (expandedWordCount <= currentWordCount) {
    console.log(`Expansion failed (${expandedWordCount} <= ${currentWordCount}), keeping original`)
    return content
  }

  return expanded
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
