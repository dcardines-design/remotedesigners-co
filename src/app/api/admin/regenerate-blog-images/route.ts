import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { generateBlogImage } from '@/lib/blog/image-generator'
import { BlogCategory } from '@/lib/blog/seo-helpers'

function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return authHeader === `Bearer ${cronSecret}`
}

export async function POST(request: NextRequest) {
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabaseClient()

  // Get all published blog posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, category, featured_image_alt')
    .eq('status', 'published')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = []

  for (const post of posts || []) {
    console.log(`Regenerating image for: ${post.slug}`)

    try {
      const imageResult = await generateBlogImage(
        post.category as BlogCategory,
        post.featured_image_alt || post.title
      )

      if (imageResult) {
        // Update the post with new image
        await supabase
          .from('blog_posts')
          .update({ featured_image: imageResult.storedUrl })
          .eq('id', post.id)

        results.push({
          slug: post.slug,
          success: true,
          image: imageResult.storedUrl,
        })
      } else {
        results.push({
          slug: post.slug,
          success: false,
          error: 'Image generation failed',
        })
      }
    } catch (err) {
      results.push({
        slug: post.slug,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return NextResponse.json({
    total: posts?.length || 0,
    results,
  })
}
