/**
 * API endpoint to regenerate featured images for blog posts using DALL-E 3
 *
 * POST /api/blog/regenerate-images
 * Body: { postId?: string } - If no postId, regenerates for all posts without images
 *
 * Requires CRON_SECRET authorization
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { generateBlogImage, BlogCategory } from '@/lib/blog'

export const maxDuration = 300 // 5 minutes max

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { postId, regenerateAll = false } = body

    const supabase = createAdminSupabaseClient()

    // Build query
    let query = supabase
      .from('blog_posts')
      .select('id, title, slug, category, featured_image, featured_image_alt')

    if (postId) {
      // Specific post
      query = query.eq('id', postId)
    } else if (!regenerateAll) {
      // Only posts without images
      query = query.is('featured_image', null)
    }

    const { data: posts, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching posts:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        message: 'No posts need image regeneration',
        processed: 0,
      })
    }

    const results: Array<{
      id: string
      slug: string
      success: boolean
      imageUrl?: string
      error?: string
    }> = []

    // Process each post
    for (const post of posts) {
      console.log(`Generating image for: ${post.title}`)

      try {
        // Generate alt text from title
        const altText = `Featured image for ${post.title}`

        // Generate the image
        const imageResult = await generateBlogImage(
          post.category as BlogCategory,
          altText
        )

        if (imageResult?.storedUrl) {
          // Update the post with the new image
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update({
              featured_image: imageResult.storedUrl,
              featured_image_alt: altText,
              updated_at: new Date().toISOString(),
            })
            .eq('id', post.id)

          if (updateError) {
            results.push({
              id: post.id,
              slug: post.slug,
              success: false,
              error: `Failed to update post: ${updateError.message}`,
            })
          } else {
            results.push({
              id: post.id,
              slug: post.slug,
              success: true,
              imageUrl: imageResult.storedUrl,
            })
          }
        } else {
          results.push({
            id: post.id,
            slug: post.slug,
            success: false,
            error: 'Image generation returned no URL',
          })
        }
      } catch (error) {
        results.push({
          id: post.id,
          slug: post.slug,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }

      // Add a small delay between generations to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return NextResponse.json({
      message: `Processed ${results.length} posts`,
      successful,
      failed,
      results,
    })
  } catch (error) {
    console.error('Error in regenerate-images:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
