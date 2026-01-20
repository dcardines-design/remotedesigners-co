/**
 * Fix invalid internal links in blog posts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// Link replacements
const LINK_FIXES: Record<string, string> = {
  '/jobs': '/remote-design-jobs-worldwide',
  '/remote-ux-design-jobs': '/remote-ui-ux-design-jobs',
  '/remote-ux-jobs': '/remote-ui-ux-design-jobs',
  '/ux-design-jobs': '/remote-ui-ux-design-jobs',
}

async function fixLinks() {
  const { createAdminSupabaseClient } = await import('../src/lib/supabase')

  const supabase = createAdminSupabaseClient()

  // Get all published posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, slug, content')
    .eq('status', 'published')

  if (error) {
    console.error('Error fetching posts:', error)
    return
  }

  const postCount = posts ? posts.length : 0
  console.log(`Checking ${postCount} posts...\n`)

  for (const post of posts || []) {
    // Find all internal links
    const linkPattern = /\[([^\]]+)\]\((\/[^)]+)\)/g
    let match
    const issues: string[] = []
    let updatedContent = post.content

    while ((match = linkPattern.exec(post.content)) !== null) {
      const [, , path] = match

      // Check if it's a valid route or needs fixing
      if (LINK_FIXES[path]) {
        issues.push(`  - "${path}" → "${LINK_FIXES[path]}"`)
        updatedContent = updatedContent.replace(
          `](${path})`,
          `](${LINK_FIXES[path]})`
        )
      }
    }

    if (issues.length > 0) {
      console.log(`\n${post.slug}:`)
      issues.forEach(i => console.log(i))

      // Update the post
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ content: updatedContent })
        .eq('id', post.id)

      if (updateError) {
        console.log(`  ❌ Update failed: ${updateError.message}`)
      } else {
        console.log(`  ✅ Fixed!`)
      }
    }
  }

  console.log('\nDone!')
}

fixLinks()
