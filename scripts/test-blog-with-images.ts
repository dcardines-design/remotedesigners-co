/**
 * Test full blog generation with inline images
 * Run with: npx tsx scripts/test-blog-with-images.ts
 */

// Load env FIRST before any other imports
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// Now dynamically import everything else
async function main() {
  const { generateBlogPost } = await import('../src/lib/blog/content-generator')
  const { BlogTopic } = await import('../src/lib/blog/topics')
  const { JobInsights } = await import('../src/lib/blog/job-insights')

  console.log('Testing blog generation with inline images...\n')

  // Simple test topic
  const testTopic = {
    id: 'test-remote-work-tips',
    title: 'Remote Work Tips for Designers',
    focusKeyword: 'remote work tips',
    secondaryKeywords: ['work from home', 'remote designer', 'productivity'],
    category: 'remote-work-tips' as const,
    tags: ['remote work', 'productivity', 'design career'],
    contextTemplate: 'Write about practical tips for designers working remotely.',
  }

  // Mock job insights matching the JobInsights interface
  const mockInsights = {
    totalJobs: 150,
    jobsByType: {
      'UX Design': 50,
      'Product Design': 40,
      'Graphic Design': 30,
      'UI Design': 30,
    },
    topCompanies: [
      { company: 'Stripe', count: 12 },
      { company: 'Airbnb', count: 8 },
      { company: 'Notion', count: 6 },
      { company: 'Figma', count: 5 },
      { company: 'Shopify', count: 4 },
    ],
    topLocations: [
      { location: 'Remote', count: 100 },
      { location: 'USA', count: 30 },
      { location: 'Europe', count: 20 },
    ],
    recentTrends: {
      newJobsThisWeek: 45,
      newJobsLastWeek: 38,
      weeklyGrowth: 18,
    },
    salaryRanges: {
      average: { min: 80000, max: 140000 },
      byType: {
        'UX Design': { min: 90000, max: 150000 },
        'Product Design': { min: 100000, max: 160000 },
        'Graphic Design': { min: 60000, max: 100000 },
      },
    },
  }

  console.log('Generating blog post...')
  console.log('Topic:', testTopic.title)
  console.log('Category:', testTopic.category)
  console.log('\nThis will:')
  console.log('1. Generate content with AI (Claude)')
  console.log('2. Extract [IMAGE: ...] placeholders')
  console.log('3. Search Google for Creative Commons images')
  console.log('4. Download and store in Supabase')
  console.log('5. Replace placeholders with markdown\n')

  try {
    const startTime = Date.now()
    const result = await generateBlogPost(testTopic, mockInsights as any)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log(`\n✅ Blog generated in ${elapsed}s\n`)
    console.log('='.repeat(60))
    console.log('TITLE:', result.title)
    console.log('SLUG:', result.slug)
    console.log('WORD COUNT:', result.word_count)
    console.log('READING TIME:', result.reading_time_minutes, 'min')
    console.log('='.repeat(60))

    // Check for images in content
    const imageMatches = result.content.match(/!\[.*?\]\(.*?\)/g) || []
    const sourceMatches = result.content.match(/\*Source:.*?\*/g) || []

    console.log('\nIMAGES FOUND:', imageMatches.length)
    console.log('SOURCE ATTRIBUTIONS:', sourceMatches.length)

    if (imageMatches.length > 0) {
      console.log('\nImage URLs:')
      imageMatches.forEach((img, i) => {
        const urlMatch = img.match(/\((https?:\/\/[^)]+)\)/)
        if (urlMatch) {
          console.log(`  ${i + 1}. ${urlMatch[1].slice(0, 70)}...`)
        }
      })
    }

    // Check for any remaining placeholders (shouldn't be any)
    const remainingPlaceholders = result.content.match(/\[IMAGE:.*?\]/g) || []
    if (remainingPlaceholders.length > 0) {
      console.log('\n⚠️  Unprocessed placeholders:', remainingPlaceholders.length)
    }

    console.log('\n' + '='.repeat(60))
    console.log('CONTENT PREVIEW (first 1500 chars):')
    console.log('='.repeat(60))
    console.log(result.content.slice(0, 1500))
    console.log('\n... (truncated)')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
