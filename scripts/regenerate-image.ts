/**
 * Regenerate blog image for a specific post
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
    .eq('slug', 'remote-design-mentorship-finding-virtual-career-guidance')
    .single()

  if (fetchError || !post) {
    console.error('Post not found:', fetchError)
    return
  }

  console.log('Found post:', post.title)
  console.log('Category:', post.category)
  console.log('Current alt text:', post.featured_image_alt)

  // Generate new image with Ghibli watercolor style (style 5)
  console.log('\nGenerating new Ghibli watercolor image...')
  const image = await generateBlogImage(
    post.category,
    post.featured_image_alt || 'Remote design mentorship virtual career guidance',
    5 // Ghibli watercolor abstract style
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
