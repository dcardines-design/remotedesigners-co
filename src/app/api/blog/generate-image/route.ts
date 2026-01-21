import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    // Generate image prompt based on title and category
    const prompt = `Create a modern, professional illustration for a blog article titled "${post.title}".
Style: Clean, minimalist, modern tech/design aesthetic.
Use soft gradients, geometric shapes, and a cohesive color palette.
No text or words in the image.
The image should feel professional and suitable for a remote design jobs website.`

    // Generate image with DALL-E
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
    })

    const imageUrl = response.data[0]?.url

    if (!imageUrl) {
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
    }

    // Download the image and upload to Supabase storage
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer())

    const fileName = `blog/${slug}-${Date.now()}.png`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      // Fall back to using the OpenAI URL directly (temporary)
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          featured_image: imageUrl,
          featured_image_alt: `Illustration for ${post.title}`,
        })
        .eq('id', post.id)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 })
      }

      return NextResponse.json({ imageUrl, temporary: true })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName)

    // Update blog post with new image
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({
        featured_image: publicUrl,
        featured_image_alt: `Illustration for ${post.title}`,
      })
      .eq('id', post.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 })
    }

    return NextResponse.json({ imageUrl: publicUrl })

  } catch (error) {
    console.error('Generate image error:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
