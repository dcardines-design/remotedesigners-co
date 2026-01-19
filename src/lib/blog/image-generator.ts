/**
 * AI Image Generation for Blog Posts using DALL-E 3
 */

import OpenAI from 'openai'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { BlogCategory } from './seo-helpers'

// Lazy OpenAI client initialization
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return null
  }
  return new OpenAI({ apiKey })
}

// Scene descriptions for each topic category
const TOPIC_SCENES: Record<BlogCategory, string[]> = {
  'job-market-insights': [
    'a designer reviewing data visualizations on floating holographic screens',
    'a collaborative workspace with designers analyzing job trends together',
    'a person climbing a growth chart made of organic vines and flowers',
    'designers gathered around a glowing world map showing job connections',
    'a creative studio with charts and graphs floating in a garden setting',
  ],
  'remote-work-tips': [
    'a cozy home office surrounded by plants and natural light',
    'a designer working from a treehouse with modern tech',
    'a peaceful balcony workspace overlooking a green city',
    'a minimalist desk setup in a sunlit room with large windows',
    'a person sketching on a tablet in a rooftop garden',
  ],
  'career-advice': [
    'a designer sketching ideas in a sunlit garden studio',
    'a mentor and mentee discussing design on a rooftop garden',
    'a creative journey path winding through a lush landscape',
    'a person standing at a crossroads with signposts in a beautiful meadow',
    'a designer building a bridge to new opportunities in a nature setting',
  ],
}

/**
 * Generate a featured image for a blog post using DALL-E 3
 */
export async function generateBlogImage(
  category: BlogCategory,
  altText: string
): Promise<{ url: string; storedUrl: string } | null> {
  const openai = getOpenAIClient()
  if (!openai) {
    console.warn('OPENAI_API_KEY not set, skipping image generation')
    return null
  }

  try {
    // Select a random scene for the category
    const scenes = TOPIC_SCENES[category]
    const topicScene = scenes[Math.floor(Math.random() * scenes.length)]

    // Build the prompt
    const prompt = `dreamy solarpunk illustration in a soft anime watercolor style. ${topicScene} is the main focus of the image, gently integrated into a lush, nature-first environment filled with dense greenery, flowering plants, and winding vines. subtle futuristic eco elements like solar panels, wind turbines, floating structures, or green architecture blend naturally into the background. painterly textures, no hard edges, gentle diffused lighting, pastel greens with accents of orange and pink. calm, optimistic, and airy mood, wide depth of field, minimal clutter, high detail but soft and serene. landscape composition, watercolor anime aesthetic, 4k quality. no text or words in the image.`

    console.log('Generating image with DALL-E 3...')

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024', // Wide format for blog headers
      quality: 'standard',
      style: 'vivid',
    })

    const tempUrl = response.data?.[0]?.url
    if (!tempUrl) {
      console.error('No URL returned from DALL-E')
      return null
    }

    // Download and store the image in Supabase Storage
    const storedUrl = await storeImageInSupabase(tempUrl, category)

    return {
      url: tempUrl,
      storedUrl: storedUrl || tempUrl,
    }
  } catch (error) {
    console.error('Image generation error:', error)
    return null
  }
}

/**
 * Download image from URL and upload to Supabase Storage
 */
async function storeImageInSupabase(
  imageUrl: string,
  category: BlogCategory
): Promise<string | null> {
  try {
    const supabase = createAdminSupabaseClient()

    // Download the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`)
    }

    const imageBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(imageBuffer)

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `blog/${category}/${timestamp}.png`

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('blog-images')
      .upload(filename, uint8Array, {
        contentType: 'image/png',
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
            contentType: 'image/png',
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
 * Get fallback image URL based on category
 */
export function getFallbackImage(category: BlogCategory): string {
  const fallbacks: Record<BlogCategory, string> = {
    'job-market-insights': '/blog/fallback-market-insights.jpg',
    'remote-work-tips': '/blog/fallback-remote-work.jpg',
    'career-advice': '/blog/fallback-career-advice.jpg',
  }

  return fallbacks[category] || '/blog/fallback-default.jpg'
}

/**
 * Validate that an image URL is accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}
