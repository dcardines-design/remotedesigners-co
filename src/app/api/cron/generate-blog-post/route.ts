import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { getJobInsights } from '@/lib/blog/job-insights'
import { TOPIC_TEMPLATES, selectNextTopic, interpolateTitle, buildTopicContext } from '@/lib/blog/topics'
import { generateBlogPost, validateGeneratedContent, regenerateWithFixes } from '@/lib/blog/content-generator'
import { generateBlogImage, getFallbackImage } from '@/lib/blog/image-generator'
import { postBlogToTwitter } from '@/lib/twitter-service'
import { BlogCategory } from '@/lib/blog/seo-helpers'

// Cron authentication
function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.warn('CRON_SECRET not configured')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  // Validate cron authentication
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isTest = request.nextUrl.searchParams.get('test') === 'true'

  console.log(`Starting blog post generation (test mode: ${isTest})...`)

  try {
    const supabase = createAdminSupabaseClient()

    // Get job insights for content
    console.log('Fetching job insights...')
    const insights = await getJobInsights()
    console.log(`Got insights: ${insights.totalJobs} total jobs`)

    // Get existing post slugs to avoid duplicates
    const { data: existingPosts } = await supabase
      .from('blog_posts')
      .select('slug')
      .order('published_at', { ascending: false })
      .limit(100)

    const existingSlugs = (existingPosts || []).map(p => p.slug)

    // Select next topic
    console.log('Selecting topic...')
    const topic = selectNextTopic(existingSlugs, insights)
    console.log(`Selected topic: ${topic.title} (${topic.category})`)

    // Generate content
    console.log('Generating blog content with AI...')
    let generatedContent = await generateBlogPost(topic, insights)

    // Validate content
    const validation = validateGeneratedContent(generatedContent)
    if (!validation.valid) {
      console.log(`Content validation failed: ${validation.issues.join(', ')}`)
      console.log('Regenerating with fixes...')
      generatedContent = await regenerateWithFixes(generatedContent, validation.issues)
    }

    console.log(`Generated: "${generatedContent.title}" (${generatedContent.word_count} words)`)

    // Generate featured image
    console.log('Generating featured image with DALL-E 3...')
    let featuredImageUrl: string | null = null
    const imageResult = await generateBlogImage(
      generatedContent.category as BlogCategory,
      generatedContent.featured_image_alt
    )

    if (imageResult) {
      featuredImageUrl = imageResult.storedUrl
      console.log(`Image generated and stored: ${featuredImageUrl}`)
    } else {
      featuredImageUrl = getFallbackImage(generatedContent.category as BlogCategory)
      console.log(`Using fallback image: ${featuredImageUrl}`)
    }

    // In test mode, don't save to database
    if (isTest) {
      return NextResponse.json({
        success: true,
        test: true,
        generated: {
          title: generatedContent.title,
          slug: generatedContent.slug,
          category: generatedContent.category,
          excerpt: generatedContent.excerpt,
          word_count: generatedContent.word_count,
          reading_time: generatedContent.reading_time_minutes,
          featured_image: featuredImageUrl,
          content_preview: generatedContent.content.substring(0, 500) + '...',
        },
      })
    }

    // Save to database
    console.log('Saving blog post to database...')
    const { data: savedPost, error: saveError } = await supabase
      .from('blog_posts')
      .insert({
        slug: generatedContent.slug,
        title: generatedContent.title,
        content: generatedContent.content,
        excerpt: generatedContent.excerpt,
        category: generatedContent.category,
        tags: generatedContent.tags,
        featured_image: featuredImageUrl,
        featured_image_alt: generatedContent.featured_image_alt,
        status: 'published',
        published_at: new Date().toISOString(),
        meta_title: generatedContent.meta_title,
        meta_description: generatedContent.meta_description,
        focus_keyword: generatedContent.focus_keyword,
        secondary_keywords: generatedContent.secondary_keywords,
        canonical_url: `https://remotedesigners.co/blog/${generatedContent.slug}`,
        reading_time_minutes: generatedContent.reading_time_minutes,
        word_count: generatedContent.word_count,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save blog post:', saveError)

      // If duplicate slug, append timestamp
      if (saveError.code === '23505') {
        const newSlug = `${generatedContent.slug}-${Date.now()}`
        console.log(`Duplicate slug detected, retrying with: ${newSlug}`)

        const { data: retryPost, error: retryError } = await supabase
          .from('blog_posts')
          .insert({
            slug: newSlug,
            title: generatedContent.title,
            content: generatedContent.content,
            excerpt: generatedContent.excerpt,
            category: generatedContent.category,
            tags: generatedContent.tags,
            featured_image: featuredImageUrl,
            featured_image_alt: generatedContent.featured_image_alt,
            status: 'published',
            published_at: new Date().toISOString(),
            meta_title: generatedContent.meta_title,
            meta_description: generatedContent.meta_description,
            focus_keyword: generatedContent.focus_keyword,
            secondary_keywords: generatedContent.secondary_keywords,
            canonical_url: `https://remotedesigners.co/blog/${newSlug}`,
            reading_time_minutes: generatedContent.reading_time_minutes,
            word_count: generatedContent.word_count,
          })
          .select()
          .single()

        if (retryError) {
          throw new Error(`Failed to save blog post: ${retryError.message}`)
        }

        generatedContent.slug = newSlug
      } else {
        throw new Error(`Failed to save blog post: ${saveError.message}`)
      }
    }

    console.log(`Blog post saved with slug: ${generatedContent.slug}`)

    // Post to Twitter
    console.log('Posting to Twitter...')
    const tweetSuccess = await postBlogToTwitter({
      slug: generatedContent.slug,
      title: generatedContent.title,
      category: generatedContent.category,
      excerpt: generatedContent.excerpt,
    })

    console.log(`Twitter post ${tweetSuccess ? 'succeeded' : 'failed'}`)

    return NextResponse.json({
      success: true,
      post: {
        slug: generatedContent.slug,
        title: generatedContent.title,
        category: generatedContent.category,
        word_count: generatedContent.word_count,
        url: `https://remotedesigners.co/blog/${generatedContent.slug}`,
      },
      tweeted: tweetSuccess,
    })
  } catch (error) {
    console.error('Blog generation failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
