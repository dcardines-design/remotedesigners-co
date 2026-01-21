/**
 * Analyze a reference image with GPT-4 Vision to extract style description
 * Usage: npx tsx scripts/analyze-style.ts [image-url]
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const imageUrl = process.argv[2]

if (!imageUrl) {
  console.log('Usage: npx tsx scripts/analyze-style.ts [image-url]')
  console.log('')
  console.log('Examples:')
  console.log('  npx tsx scripts/analyze-style.ts https://example.com/image.png')
  console.log('  npx tsx scripts/analyze-style.ts https://urbmvgfxqygrxomcirub.supabase.co/storage/v1/object/public/blog-images/blog/ux-design/1768918228925.png')
  process.exit(1)
}

async function analyze() {
  const { analyzeStyleReference } = await import('../src/lib/blog/image-generator')

  console.log('Analyzing image:', imageUrl)
  console.log('')

  const styleDescription = await analyzeStyleReference(imageUrl)

  console.log('\n=== STYLE DESCRIPTION ===')
  console.log(styleDescription)
  console.log('\n=== COPY THIS TO USE AS REFERENCE ===')
  console.log(`\nAdd to image-generator.ts:\n`)
  console.log(`const VISION_STYLE = \`${styleDescription}\``)
}

analyze().catch(console.error)
