/**
 * Regenerate blog image with specific style
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const slug = process.argv[2] || 'remote-design-mentorship-finding-virtual-career-guidance'
const styleIndex = parseInt(process.argv[3] || '3')

async function regenerateImage() {
  const { generateBlogImage } = await import('../src/lib/blog/image-generator')
  const { createAdminSupabaseClient } = await import('../src/lib/supabase')

  const supabase = createAdminSupabaseClient()

  const { data: post, error: fetchError } = await supabase
    .from('blog_posts')
    .select('id, slug, title, category, featured_image_alt')
    .eq('slug', slug)
    .single()

  if (fetchError || !post) {
    console.error('Post not found:', fetchError)
    return
  }

  const styleNames = [
    'Golden hour meadows',
    'Misty morning forest',
    'Coastal seaside',
    'Cozy countryside',
    'Sunset skyscape',
    'Soft watercolor abstract'
  ]

  console.log('Found post:', post.title)
  console.log(`Using style ${styleIndex}: ${styleNames[styleIndex]}`)

  console.log('\nGenerating image...')
  const image = await generateBlogImage(post.category, post.featured_image_alt, styleIndex)

  if (!image) {
    console.error('Failed to generate image')
    return
  }

  console.log('New image URL:', image.storedUrl)

  const { error: updateError } = await supabase
    .from('blog_posts')
    .update({ featured_image: image.storedUrl })
    .eq('id', post.id)

  if (updateError) {
    console.error('Update error:', updateError)
    return
  }

  console.log('\n✅ Done!')
}

regenerateImage().catch(console.error)
