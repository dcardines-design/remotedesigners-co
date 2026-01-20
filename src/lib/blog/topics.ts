/**
 * Blog topic templates with target keywords
 */

import { BlogCategory } from './seo-helpers'
import { JobInsights } from './job-insights'
import { chatCompletion } from '@/lib/openrouter'
import { createServerSupabaseClient } from '@/lib/supabase'

export interface BlogTopic {
  title: string
  focusKeyword: string
  secondaryKeywords: string[]
  category: BlogCategory
  promptContext: string
  tags: string[]
}

/**
 * Topic templates organized by category
 */
export const TOPIC_TEMPLATES: Partial<Record<BlogCategory, BlogTopic[]>> = {
  'job-market-insights': [
    {
      title: 'Remote Design Jobs: {month} {year} Market Report',
      focusKeyword: 'remote design jobs',
      secondaryKeywords: ['UX designer salary', 'design job trends', 'remote work statistics'],
      category: 'job-market-insights',
      promptContext: 'Write a comprehensive market report analyzing the current state of remote design jobs. Include statistics about job growth, top hiring companies, salary trends, and most in-demand design skills.',
      tags: ['market-report', 'salary', 'trends', 'remote-work'],
    },
    {
      title: 'Top Companies Hiring Remote {designType} Designers in {year}',
      focusKeyword: 'companies hiring remote designers',
      secondaryKeywords: ['remote UX jobs', 'design careers', 'tech companies hiring'],
      category: 'job-market-insights',
      promptContext: 'Highlight the top companies actively hiring remote designers. Discuss company culture, benefits, salary ranges, and what makes each company attractive for designers.',
      tags: ['companies', 'hiring', 'remote-work', 'career'],
    },
    {
      title: 'UX Designer Salary Trends: What to Expect in {year}',
      focusKeyword: 'UX designer salary',
      secondaryKeywords: ['designer compensation', 'salary negotiation', 'design career growth'],
      category: 'job-market-insights',
      promptContext: 'Analyze current salary trends for UX designers at different experience levels. Cover factors affecting compensation, regional differences, and negotiation tips.',
      tags: ['salary', 'UX-design', 'compensation', 'career'],
    },
    {
      title: 'Product Designer vs UX Designer: Roles, Salaries & Opportunities',
      focusKeyword: 'product designer jobs',
      secondaryKeywords: ['UX design career', 'design roles', 'remote design jobs'],
      category: 'job-market-insights',
      promptContext: 'Compare product designer and UX designer roles, covering responsibilities, required skills, salary differences, and career paths. Help designers understand which path suits them.',
      tags: ['product-design', 'UX-design', 'career-path', 'comparison'],
    },
    {
      title: 'Most In-Demand Design Skills for Remote Jobs in {year}',
      focusKeyword: 'design skills',
      secondaryKeywords: ['UX skills', 'remote designer requirements', 'design tools'],
      category: 'job-market-insights',
      promptContext: 'Identify the most sought-after skills in remote design job postings. Cover both technical skills (tools, methodologies) and soft skills employers value.',
      tags: ['skills', 'job-requirements', 'learning', 'career'],
    },
  ],
  'remote-work-tips': [
    {
      title: 'Remote Designer Productivity: {count} Tips That Actually Work',
      focusKeyword: 'remote designer productivity',
      secondaryKeywords: ['work from home tips', 'designer workflow', 'focus techniques'],
      category: 'remote-work-tips',
      promptContext: 'Share actionable productivity tips specifically for remote designers. Cover time management, avoiding distractions, maintaining creativity, and establishing healthy routines.',
      tags: ['productivity', 'remote-work', 'tips', 'workflow'],
    },
    {
      title: 'Home Office Setup for Designers: Essential Equipment Guide',
      focusKeyword: 'home office setup for designers',
      secondaryKeywords: ['designer workspace', 'design equipment', 'ergonomic setup'],
      category: 'remote-work-tips',
      promptContext: 'Guide designers in creating an optimal home office setup. Cover monitors, drawing tablets, chairs, lighting, and other equipment essential for design work.',
      tags: ['home-office', 'equipment', 'setup', 'workspace'],
    },
    {
      title: 'Best Collaboration Tools for Remote Design Teams in {year}',
      focusKeyword: 'remote design team collaboration',
      secondaryKeywords: ['design tools', 'team communication', 'design workflow'],
      category: 'remote-work-tips',
      promptContext: 'Review the best tools for remote design team collaboration. Cover design tools (Figma), communication (Slack), project management, and feedback/review tools.',
      tags: ['tools', 'collaboration', 'teams', 'software'],
    },
    {
      title: 'Avoiding Burnout as a Remote Designer: Self-Care Strategies',
      focusKeyword: 'designer burnout',
      secondaryKeywords: ['work-life balance', 'remote work wellbeing', 'designer mental health'],
      category: 'remote-work-tips',
      promptContext: 'Address the unique burnout risks for remote designers and provide strategies for prevention. Cover setting boundaries, taking breaks, maintaining social connections, and recognizing warning signs.',
      tags: ['burnout', 'wellbeing', 'work-life-balance', 'self-care'],
    },
    {
      title: 'Time Zone Management for Global Design Teams',
      focusKeyword: 'time zone management',
      secondaryKeywords: ['async work', 'global teams', 'remote collaboration'],
      category: 'remote-work-tips',
      promptContext: 'Help designers navigate working across time zones. Cover async communication strategies, scheduling tools, documentation practices, and maintaining team cohesion globally.',
      tags: ['time-zones', 'global-teams', 'async-work', 'communication'],
    },
  ],
  'career-advice': [
    {
      title: 'Building a Design Portfolio That Gets You Hired (+ Examples)',
      focusKeyword: 'design portfolio tips',
      secondaryKeywords: ['UX portfolio', 'portfolio examples', 'designer job search'],
      category: 'career-advice',
      promptContext: 'Provide comprehensive guidance on building an effective design portfolio. Cover what to include, how to present case studies, common mistakes to avoid, and tips for standing out.',
      tags: ['portfolio', 'job-search', 'case-studies', 'tips'],
    },
    {
      title: 'Design Interview Preparation: Questions & How to Ace Them',
      focusKeyword: 'design interview preparation',
      secondaryKeywords: ['UX interview questions', 'design whiteboard', 'portfolio presentation'],
      category: 'career-advice',
      promptContext: 'Help designers prepare for interviews with common questions, portfolio presentation tips, whiteboard exercise strategies, and how to discuss design decisions confidently.',
      tags: ['interviews', 'job-search', 'preparation', 'tips'],
    },
    {
      title: 'Freelance vs Full-Time Designer: Making the Right Choice',
      focusKeyword: 'freelance vs full-time designer',
      secondaryKeywords: ['designer career path', 'freelance design', 'design employment'],
      category: 'career-advice',
      promptContext: 'Compare freelance and full-time design careers objectively. Cover income stability, flexibility, benefits, growth opportunities, and help readers assess which fits their goals.',
      tags: ['freelance', 'employment', 'career-path', 'decision'],
    },
    {
      title: 'From Junior to Senior Designer: Career Growth Roadmap',
      focusKeyword: 'designer career growth',
      secondaryKeywords: ['senior designer', 'career progression', 'design leadership'],
      category: 'career-advice',
      promptContext: 'Map out the career progression from junior to senior designer. Cover skill development, taking on more responsibility, building influence, and transitioning to leadership roles.',
      tags: ['career-growth', 'seniority', 'leadership', 'skills'],
    },
    {
      title: 'Negotiating Your Design Job Offer: A Complete Guide',
      focusKeyword: 'design job offer negotiation',
      secondaryKeywords: ['salary negotiation', 'designer compensation', 'job offer tips'],
      category: 'career-advice',
      promptContext: 'Guide designers through salary and offer negotiation. Cover research, timing, what to negotiate beyond salary, handling counteroffers, and common mistakes.',
      tags: ['negotiation', 'salary', 'job-offer', 'tips'],
    },
  ],
}

/**
 * Select a random topic that hasn't been used recently
 */
export function selectNextTopic(
  usedSlugs: string[],
  insights: JobInsights
): BlogTopic {
  // Get all categories and shuffle them randomly
  const categories = Object.keys(TOPIC_TEMPLATES) as BlogCategory[]
  const shuffledCategories = categories.sort(() => Math.random() - 0.5)

  // Find a category with unused topics
  for (const category of shuffledCategories) {
    const topics = TOPIC_TEMPLATES[category] || []
    const unusedTopics = topics.filter(topic => {
      const slug = generateTopicSlug(topic)
      return !usedSlugs.some(used => used.includes(slug.split('-').slice(0, 3).join('-')))
    })

    if (unusedTopics.length > 0) {
      // Return a random unused topic from this category
      return unusedTopics[Math.floor(Math.random() * unusedTopics.length)]
    }
  }

  // If all topics used, pick completely random from all categories
  const allTopics = categories.flatMap(cat => TOPIC_TEMPLATES[cat] || [])
  return allTopics[Math.floor(Math.random() * allTopics.length)]
}

/**
 * Generate slug from topic template
 */
function generateTopicSlug(topic: BlogTopic): string {
  return topic.title
    .toLowerCase()
    .replace(/\{[^}]+\}/g, '') // Remove placeholders
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
}

/**
 * Interpolate topic title with dynamic values
 */
export function interpolateTitle(
  template: string,
  values: {
    month?: string
    year?: string
    count?: string
    designType?: string
  }
): string {
  let result = template

  const now = new Date()
  const defaults = {
    month: now.toLocaleString('en-US', { month: 'long' }),
    year: now.getFullYear().toString(),
    count: String(Math.floor(Math.random() * 5) + 8), // Random 8-12
    designType: ['UX', 'Product', 'UI'][Math.floor(Math.random() * 3)],
  }

  const finalValues = { ...defaults, ...values }

  result = result.replace(/\{month\}/g, finalValues.month)
  result = result.replace(/\{year\}/g, finalValues.year)
  result = result.replace(/\{count\}/g, finalValues.count)
  result = result.replace(/\{designType\}/g, finalValues.designType)

  return result
}

/**
 * Get topic context with job insights for AI prompt
 */
export function buildTopicContext(topic: BlogTopic, insights: JobInsights): string {
  return `
${topic.promptContext}

USE THESE REAL STATISTICS IN YOUR ARTICLE:
- Total active remote design jobs: ${insights.totalJobs.toLocaleString()}
- New jobs this week: ${insights.recentTrends.newJobsThisWeek}
- Week-over-week growth: ${insights.recentTrends.weeklyGrowth > 0 ? '+' : ''}${insights.recentTrends.weeklyGrowth}%
- Top hiring companies: ${insights.topCompanies.slice(0, 5).map(c => c.company).join(', ')}
- Popular locations: ${insights.topLocations.slice(0, 5).map(l => l.location).join(', ')}
${insights.salaryRanges.average ? `- Average salary range: $${Math.round(insights.salaryRanges.average.min / 1000)}k - $${Math.round(insights.salaryRanges.average.max / 1000)}k` : ''}

INTERNAL LINKS TO INCLUDE (use markdown links):
- [Browse Remote UX/UI Design Jobs](/remote-ui-ux-design-jobs)
- [Find Product Design Opportunities](/remote-product-design-jobs)
- [See All Remote Design Jobs](/remote-design-jobs-worldwide)
`.trim()
}

/**
 * Category descriptions for AI topic generation
 */
const CATEGORY_PROMPTS: Record<BlogCategory, string> = {
  'job-market-insights': 'remote design job market trends, hiring statistics, salary data, industry analysis, employment outlook',
  'remote-work-tips': 'productivity tips for remote designers, work from home strategies, tools, workspace optimization, time management',
  'career-advice': 'career growth for designers, portfolio tips, interview prep, job search strategies, professional development',
  'design-news': 'latest design industry news, tool updates, company announcements, design trends, industry events',
  'ux-design': 'UX design methods, user research, usability testing, interaction design, design thinking, UX best practices',
  'product-design': 'product design process, design systems, prototyping, product strategy, cross-functional collaboration',
  'graphic-design': 'visual design, branding, typography, color theory, illustration, creative techniques, design inspiration',
}

/**
 * Fetch existing blog post titles from the database
 */
async function getExistingBlogTitles(): Promise<string[]> {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select('title')

    if (error) {
      console.error('Error fetching existing titles:', error)
      return []
    }

    return data?.map(p => p.title) || []
  } catch (error) {
    console.error('Error fetching existing titles:', error)
    return []
  }
}

/**
 * Generate a unique blog topic using AI
 */
export async function generateUniqueTopic(
  preferredCategory?: BlogCategory
): Promise<BlogTopic> {
  // Get existing titles to avoid duplicates
  const existingTitles = await getExistingBlogTitles()

  // Pick a category (random if not specified)
  const categories = Object.keys(CATEGORY_PROMPTS) as BlogCategory[]
  const category = preferredCategory || categories[Math.floor(Math.random() * categories.length)]
  const categoryPrompt = CATEGORY_PROMPTS[category]

  const currentYear = new Date().getFullYear()

  const prompt = `Generate a unique blog post topic for a remote design job board website.

CATEGORY: ${category}
CATEGORY FOCUS: ${categoryPrompt}
CURRENT YEAR: ${currentYear}

EXISTING BLOG TITLES (DO NOT DUPLICATE THESE):
${existingTitles.map(t => `- ${t}`).join('\n') || '- None yet'}

Generate a NEW, UNIQUE blog topic that:
1. Is different from all existing titles above
2. Is relevant to remote designers and the ${category} category
3. Has strong SEO potential with searchable keywords
4. Would be interesting and valuable to remote design professionals
5. Include the year ${currentYear} in the title if it makes sense

Return ONLY valid JSON with this exact structure (no markdown code blocks):
{
  "title": "Catchy SEO-optimized title under 60 characters",
  "focusKeyword": "main keyword phrase",
  "secondaryKeywords": ["keyword2", "keyword3", "keyword4"],
  "promptContext": "Brief description of what the article should cover",
  "tags": ["tag1", "tag2", "tag3"]
}`

  try {
    const response = await chatCompletion(
      [{ role: 'user', content: prompt }],
      {
        model: 'anthropic/claude-3.5-sonnet',
        temperature: 0.8,
        max_tokens: 500,
      }
    )

    // Parse the JSON response
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleanedResponse)

    return {
      title: parsed.title,
      focusKeyword: parsed.focusKeyword,
      secondaryKeywords: parsed.secondaryKeywords || [],
      category,
      promptContext: parsed.promptContext,
      tags: parsed.tags || [],
    }
  } catch (error) {
    console.error('Error generating unique topic:', error)
    // Fall back to a template topic
    const templates = TOPIC_TEMPLATES[category] || TOPIC_TEMPLATES['job-market-insights'] || []
    if (templates.length === 0) {
      // Ultimate fallback
      return {
        title: `Remote Design Trends in ${new Date().getFullYear()}`,
        focusKeyword: 'remote design jobs',
        secondaryKeywords: ['design careers', 'remote work'],
        category: 'job-market-insights',
        promptContext: 'Write about current trends in remote design work.',
        tags: ['trends', 'remote-work'],
      }
    }
    return templates[Math.floor(Math.random() * templates.length)]
  }
}
