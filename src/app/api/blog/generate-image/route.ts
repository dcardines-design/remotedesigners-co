import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { generateBlogImage } from '@/lib/blog/image-generator'
import { BlogCategory } from '@/lib/blog/seo-helpers'

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json()

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // Get the blog post
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, excerpt, category')
      .eq('slug', slug)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 })
    }

    // Generate image using the library (Ghibli/Frieren anime style)
    const result = await generateBlogImage(
      post.category as BlogCategory,
      `Illustration for ${post.title}`
    )

    if (!result) {
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
    }

    // Update blog post with new image
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        featured_image: result.storedUrl,
        featured_image_alt: `Illustration for ${post.title}`,
      })
      .eq('id', post.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 })
    }

    return NextResponse.json({ imageUrl: result.storedUrl })

  } catch (error) {
    console.error('Generate image error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to generate image: ${message}` }, { status: 500 })
  }
}
