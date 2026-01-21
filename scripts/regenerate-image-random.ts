/**
 * Regenerate blog image with random Ghibli style
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function regenerateImage() {
  const { generateBlogImage } = await import('../src/lib/blog/image-generator')
  const { createAdminSupabaseClient } = await import('../src/lib/supabase')

  const supabase = createAdminSupabaseClient()

  // Get the post
  const { data: post, error: fetchError } = await supabase
    .from('blog_posts')
    .select('id, slug, title, category, featured_image_alt')
    .eq('slug', 'design-system-documentation-remote-best-practices-2026')
    .single()

  if (fetchError || !post) {
    console.error('Post not found:', fetchError)
    return
  }

  console.log('Found post:', post.title)
  console.log('Category:', post.category)

  // Pick a random style (0-5)
  const styleIndex = Math.floor(Math.random() * 6)
  const styleNames = [
    'Golden hour meadows',
    'Misty morning forest',
    'Coastal seaside',
    'Cozy countryside',
    'Sunset skyscape',
    'Soft watercolor abstract'
  ]

  console.log(`\nUsing style ${styleIndex}: ${styleNames[styleIndex]}`)

  // Generate new image
  console.log('Generating new Ghibli image...')
  const image = await generateBlogImage(
    post.category,
    post.featured_image_alt || 'Design system documentation for remote teams',
    styleIndex
  )

  if (!image) {
    console.error('Failed to generate image')
    return
  }

  console.log('New image URL:', image.storedUrl)

  // Update the post
  const { error: updateError } = await supabase
    .from('blog_posts')
    .update({ featured_image: image.storedUrl })
    .eq('id', post.id)

  if (updateError) {
    console.error('Update error:', updateError)
    return
  }

  console.log('\n✅ Blog image updated successfully!')
}

regenerateImage().catch(console.error)
