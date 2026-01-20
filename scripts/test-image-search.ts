/**
 * Test script for Google Custom Search image integration
 * Run with: npx tsx scripts/test-image-search.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function testImageSearch() {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

  console.log('Testing Google Custom Search API...\n')
  console.log('API Key:', apiKey ? `${apiKey.slice(0, 10)}...` : 'NOT SET')
  console.log('Search Engine ID:', searchEngineId || 'NOT SET')

  if (!apiKey || !searchEngineId) {
    console.error('\nMissing credentials!')
    process.exit(1)
  }

  const query = 'remote designer working from home office'

  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('cx', searchEngineId)
  url.searchParams.set('q', query)
  url.searchParams.set('searchType', 'image')
  url.searchParams.set('num', '3')
  url.searchParams.set('rights', 'cc_publicdomain,cc_attribute,cc_sharealike')
  url.searchParams.set('safe', 'active')
  url.searchParams.set('imgType', 'photo')

  console.log('\nSearching for:', query)
  console.log('Filter: Creative Commons only\n')

  try {
    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.error) {
      console.error('API Error:', data.error.message)
      process.exit(1)
    }

    if (!data.items || data.items.length === 0) {
      console.log('No images found. Try a different query.')
      process.exit(0)
    }

    console.log(`Found ${data.items.length} images:\n`)

    data.items.forEach((item: any, i: number) => {
      console.log(`${i + 1}. ${item.title}`)
      console.log(`   Source: ${item.displayLink}`)
      console.log(`   Image: ${item.link.slice(0, 60)}...`)
      console.log(`   Page: ${item.image?.contextLink || 'N/A'}`)
      console.log('')
    })

    console.log('Image search is working!')
  } catch (error) {
    console.error('Fetch error:', error)
    process.exit(1)
  }
}

testImageSearch()
