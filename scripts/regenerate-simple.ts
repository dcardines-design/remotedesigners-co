/**
 * Regenerate blog image with new unified Ghibli style
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const slug = process.argv[2]

if (!slug) {
  console.log('Usage: npx tsx scripts/regenerate-simple.ts [slug]')
  process.exit(1)
}

async function regenerate() {
  const { generateBlogImage } = await import('../src/lib/blog/image-generator')
  const { createAdminSupabaseClient } = await import('../src/lib/supabase')

  const supabase = createAdminSupabaseClient()

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, category, featured_image_alt')
    .eq('slug', slug)
    .single()

  if (error || !post) {
    console.error('Post not found:', error)
    return
  }

  console.log('Found:', post.title)
  console.log('Category:', post.category)

  const image = await generateBlogImage(post.category, post.featured_image_alt || post.title)

  if (!image) {
    console.error('Failed to generate image')
    return
  }

  console.log('New image:', image.storedUrl)

  await supabase.from('blog_posts').update({ featured_image: image.storedUrl }).eq('id', post.id)

  console.log('\n✅ Done!')

  // Play ping sound on macOS
  const { exec } = await import('child_process')
  exec('afplay /System/Library/Sounds/Glass.aiff')
}

regenerate().catch(console.error)
