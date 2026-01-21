/**
 * Generate a UX design blog post with Ghibli watercolor style image
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function generateUXBlog() {
  const { generateUniqueTopic, generateBlogPost, getJobInsights } = await import('../src/lib/blog')
  const { generateBlogImage } = await import('../src/lib/blog/image-generator')
  const { createAdminSupabaseClient } = await import('../src/lib/supabase')

  console.log('=== Generating UX Design Blog ===\n')

  // 1. Generate unique topic
  console.log('1. Generating unique topic...')
  const topic = await generateUniqueTopic('ux-design')
  console.log(`   Topic: ${topic.title}`)
  console.log(`   Focus keyword: ${topic.focusKeyword}\n`)

  // 2. Get job insights
  console.log('2. Fetching job insights...')
  const insights = await getJobInsights()
  console.log(`   Total jobs: ${insights.totalJobs}\n`)

  // 3. Generate content
  console.log('3. Generating blog content...')
  const content = await generateBlogPost(topic, insights)
  console.log(`   Title: ${content.title}`)
  console.log(`   Words: ${content.word_count}`)
  console.log(`   Reading time: ${content.reading_time_minutes} min\n`)

  // 4. Generate Ghibli watercolor abstract image (style index 5)
  console.log('4. Generating Ghibli watercolor image (style 5)...')
  const image = await generateBlogImage('ux-design', content.featured_image_alt, 5)
  if (image) {
    console.log(`   Stored URL: ${image.storedUrl}\n`)
  } else {
    console.log('   No image generated\n')
  }

  // 5. Save to database
  console.log('5. Saving to database...')
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      title: content.title,
      slug: content.slug,
      content: content.content,
      excerpt: content.excerpt,
      category: content.category,
      tags: content.tags,
      featured_image: image?.storedUrl || null,
      featured_image_alt: content.featured_image_alt,
      meta_title: content.meta_title,
      meta_description: content.meta_description,
      focus_keyword: content.focus_keyword,
      secondary_keywords: content.secondary_keywords,
      word_count: content.word_count,
      reading_time_minutes: content.reading_time_minutes,
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('   Error:', error)
    return
  }

  console.log(`   Saved! ID: ${data.id}`)
  console.log(`\n✅ Blog post created: /blog/${content.slug}`)
}

generateUXBlog().catch(console.error)
