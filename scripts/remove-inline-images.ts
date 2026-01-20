/**
 * Remove inline images from a blog post
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function removeImages() {
  const { createAdminSupabaseClient } = await import('../src/lib/supabase')

  const supabase = createAdminSupabaseClient()

  // Get the post
  const { data: post, error: fetchError } = await supabase
    .from('blog_posts')
    .select('id, slug, content')
    .ilike('slug', '%january-2026-market-surge%')
    .single()

  if (fetchError || !post) {
    console.log('Post not found:', fetchError)
    return
  }

  console.log('Found post:', post.slug)
  console.log('Original content length:', post.content.length)

  // Remove markdown images and their source attribution lines
  // Pattern: ![alt](url)\n*Source: [text](url)*
  let updatedContent = post.content
    // Remove image + source attribution (on next line)
    .replace(/!\[.*?\]\(.*?\)\n\*Source:.*?\*\n?/g, '')
    // Remove standalone images
    .replace(/!\[.*?\]\(.*?\)\n?/g, '')
    // Remove standalone source attributions that might be left
    .replace(/\*Source:.*?\*\n?/g, '')
    // Clean up multiple blank lines
    .replace(/\n{3,}/g, '\n\n')

  console.log('Updated content length:', updatedContent.length)
  console.log('Removed:', post.content.length - updatedContent.length, 'characters')

  // Check for remaining images
  const remainingImages = updatedContent.match(/!\[.*?\]\(.*?\)/g) || []
  console.log('Remaining images:', remainingImages.length)

  // Update the post
  const { error: updateError } = await supabase
    .from('blog_posts')
    .update({ content: updatedContent })
    .eq('id', post.id)

  if (updateError) {
    console.error('Update error:', updateError)
  } else {
    console.log('\nPost updated successfully!')
  }
}

removeImages()
