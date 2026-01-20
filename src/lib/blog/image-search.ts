/**
 * Google Custom Search API for finding Creative Commons images
 */

import { createAdminSupabaseClient } from '@/lib/supabase'

export interface ImageResult {
  url: string          // Stored Supabase URL
  originalUrl: string  // Original image URL
  pageUrl: string      // Source page URL
  title: string        // Image title/description
  source: string       // Website name (e.g. "Wikimedia Commons")
}

interface GoogleSearchImage {
  link: string
  image?: {
    contextLink: string
    thumbnailLink: string
  }
  title: string
  displayLink: string
}

interface GoogleSearchResponse {
  items?: GoogleSearchImage[]
  error?: {
    message: string
    code: number
  }
}

/**
 * Search for reusable images via Google Custom Search API
 * Filters for Creative Commons licensed images only
 */
export async function searchWebImages(
  query: string,
  count: number = 3
): Promise<ImageResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

  if (!apiKey || !searchEngineId) {
    console.warn('Google Search API credentials not configured, skipping web image search')
    return []
  }

  try {
    // Add design/remote work context to improve results
    const enhancedQuery = `${query} remote work design professional`

    // Search with Creative Commons filter
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('cx', searchEngineId)
    url.searchParams.set('q', enhancedQuery)
    url.searchParams.set('searchType', 'image')
    url.searchParams.set('num', String(Math.min(count * 2, 10))) // Fetch extra in case some fail
    url.searchParams.set('rights', 'cc_publicdomain,cc_attribute,cc_sharealike') // Creative Commons filter
    url.searchParams.set('safe', 'active')
    url.searchParams.set('imgType', 'photo')
    url.searchParams.set('imgSize', 'large')

    console.log(`Searching Google Images for: "${query}"`)

    const response = await fetch(url.toString())
    const data: GoogleSearchResponse = await response.json()

    if (data.error) {
      console.error('Google Search API error:', data.error.message)
      return []
    }

    if (!data.items || data.items.length === 0) {
      console.log('No images found for query:', query)
      return []
    }

    // Process images: download and store in Supabase
    const results: ImageResult[] = []

    for (const item of data.items) {
      if (results.length >= count) break

      try {
        const storedUrl = await storeSearchImageInSupabase(item.link, query)

        if (storedUrl) {
          results.push({
            url: storedUrl,
            originalUrl: item.link,
            pageUrl: item.image?.contextLink || item.link,
            title: item.title || query,
            source: cleanSourceName(item.displayLink),
          })
          console.log(`Stored image from ${item.displayLink}`)
        }
      } catch (error) {
        console.warn(`Failed to process image from ${item.displayLink}:`, error)
        // Continue to next image
      }
    }

    return results
  } catch (error) {
    console.error('Image search error:', error)
    return []
  }
}

/**
 * Download image from URL and upload to Supabase Storage
 */
async function storeSearchImageInSupabase(
  imageUrl: string,
  searchQuery: string
): Promise<string | null> {
  try {
    const supabase = createAdminSupabaseClient()

    // Download the image with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RemoteDesigners/1.0)',
      },
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Validate it's actually an image
    if (!contentType.startsWith('image/')) {
      throw new Error(`Not an image: ${contentType}`)
    }

    const imageBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(imageBuffer)

    // Skip if too small (likely a placeholder/error image)
    if (uint8Array.length < 10000) {
      throw new Error('Image too small, likely a placeholder')
    }

    // Determine file extension
    const extension = contentType.includes('png') ? 'png'
      : contentType.includes('webp') ? 'webp'
      : 'jpg'

    // Generate unique filename
    const timestamp = Date.now()
    const slugifiedQuery = searchQuery
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 30)
    const filename = `blog/inline/${slugifiedQuery}-${timestamp}.${extension}`

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('blog-images')
      .upload(filename, uint8Array, {
        contentType,
        upsert: false,
      })

    if (error) {
      // If bucket doesn't exist, try to create it
      if (error.message?.includes('not found')) {
        console.log('Creating blog-images bucket...')
        await supabase.storage.createBucket('blog-images', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        })

        // Retry upload
        const { error: retryError } = await supabase.storage
          .from('blog-images')
          .upload(filename, uint8Array, {
            contentType,
            upsert: false,
          })

        if (retryError) {
          console.error('Failed to upload image after bucket creation:', retryError)
          return null
        }
      } else {
        console.error('Failed to upload image:', error)
        return null
      }
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filename)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error storing image in Supabase:', error)
    return null
  }
}

/**
 * Clean up display link to a readable source name
 */
function cleanSourceName(displayLink: string): string {
  // Remove www. and common prefixes
  let source = displayLink
    .replace(/^www\./, '')
    .replace(/\.com$|\.org$|\.net$/, '')

  // Capitalize first letter of each word
  source = source
    .split(/[.-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return source
}

/**
 * Extract image placeholders from markdown content
 * Format: [IMAGE: description of image needed]
 */
export function extractImagePlaceholders(content: string): string[] {
  const regex = /\[IMAGE:\s*([^\]]+)\]/g
  const placeholders: string[] = []
  let match

  while ((match = regex.exec(content)) !== null) {
    placeholders.push(match[1].trim())
  }

  return placeholders
}

/**
 * Replace image placeholders with actual images and source attribution
 * Returns the updated markdown content
 */
export async function replaceImagePlaceholders(content: string): Promise<string> {
  const placeholders = extractImagePlaceholders(content)

  if (placeholders.length === 0) {
    return content
  }

  let updatedContent = content

  for (const description of placeholders) {
    const images = await searchWebImages(description, 1)

    if (images.length > 0) {
      const image = images[0]

      // Create markdown with image and source attribution
      const imageMarkdown = `![${description}](${image.url})\n*Source: [${image.source}](${image.pageUrl})*`

      // Replace the placeholder
      updatedContent = updatedContent.replace(
        `[IMAGE: ${description}]`,
        imageMarkdown
      )
    } else {
      // Remove placeholder if no image found
      updatedContent = updatedContent.replace(`[IMAGE: ${description}]`, '')
    }
  }

  return updatedContent
}
