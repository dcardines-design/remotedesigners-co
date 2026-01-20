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

// GET - list all posts that need images
export async function GET(request: NextRequest) {
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabaseClient()

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, category')
    .eq('status', 'published')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    total: posts?.length || 0,
    posts: posts?.map(p => ({ slug: p.slug, category: p.category })) || [],
  })
}

// POST - regenerate image for a single post by slug
export async function POST(request: NextRequest) {
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const slug = request.nextUrl.searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'slug parameter required' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()

  // Get the post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, category, featured_image_alt')
    .eq('slug', slug)
    .single()

  if (error || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

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

      return NextResponse.json({
        slug: post.slug,
        success: true,
        image: imageResult.storedUrl,
      })
    } else {
      return NextResponse.json({
        slug: post.slug,
        success: false,
        error: 'Image generation failed',
      }, { status: 500 })
    }
  } catch (err) {
    return NextResponse.json({
      slug: post.slug,
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 })
  }
}
