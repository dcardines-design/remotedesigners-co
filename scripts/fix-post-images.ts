/**
 * Fix image placeholders in a blog post
 * Run with: npx tsx scripts/fix-post-images.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function fix() {
  const { createAdminSupabaseClient } = await import('../src/lib/supabase')
  const { replaceImagePlaceholders } = await import('../src/lib/blog/image-search')

  const supabase = createAdminSupabaseClient()

  // Get the post
  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, slug, content')
    .ilike('slug', '%january-2026-market-surge%')
    .single()

  if (!post) {
    console.log('Post not found')
    return
  }

  console.log('Found post:', post.slug)

  // Check for placeholders
  const placeholders = post.content.match(/\[IMAGE:.*?\]/g) || []
  console.log('Placeholders found:', placeholders.length)
  placeholders.forEach(p => console.log(' -', p))

  if (placeholders.length === 0) {
    console.log('No placeholders to process')
    return
  }

  // Process images
  console.log('\nProcessing images...')
  const updatedContent = await replaceImagePlaceholders(post.content)

  // Check what changed
  const remainingPlaceholders = updatedContent.match(/\[IMAGE:.*?\]/g) || []
  const imagesAdded = updatedContent.match(/!\[.*?\]\(.*?\)/g) || []

  console.log('\nResults:')
  console.log('- Images added:', imagesAdded.length)
  console.log('- Remaining placeholders:', remainingPlaceholders.length)

  if (remainingPlaceholders.length > 0) {
    console.log('  Still unprocessed:', remainingPlaceholders)
  }

  // Update the post
  const { error } = await supabase
    .from('blog_posts')
    .update({ content: updatedContent })
    .eq('id', post.id)

  if (error) {
    console.error('Update error:', error)
  } else {
    console.log('\nPost updated successfully!')
  }
}

fix()
