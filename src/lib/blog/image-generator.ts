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

// Different Studio Ghibli + Solarpunk style variations for variety
const ART_STYLE_PROMPTS = [
  // Style 0: Ghibli solarpunk - golden hour meadows
  (scene: string) => `studio ghibli inspired solarpunk illustration of ${scene}. lush green rolling hills with wildflower meadows. golden hour sunlight with warm orange and pink sky. glass geodesic domes and solar panels nestled among vegetation. wind turbines on distant hills. fluffy cumulus clouds. detailed hand-painted background style. soft edges and dreamy atmosphere. cozy and hopeful feeling. small details like butterflies, dandelion seeds floating. absolutely no text or words in the image.`,

  // Style 1: Ghibli solarpunk - misty morning forest
  (scene: string) => `studio ghibli inspired solarpunk illustration of ${scene}. mystical forest setting with tall trees and dappled sunlight. soft morning mist between the trees. sustainable treehouses with solar roofs integrated into the canopy. moss-covered stones and ferns. gentle green and blue color palette. ethereal and peaceful atmosphere. hand-painted watercolor texture. tiny glowing particles in the air. absolutely no text or words in the image.`,

  // Style 2: Ghibli solarpunk - coastal seaside
  (scene: string) => `studio ghibli inspired solarpunk illustration of ${scene}. beautiful coastal seaside landscape. turquoise ocean waves and white sand beach. colorful wildflowers on grassy cliffs with wind turbines. floating solar platforms on the water. bright blue sky with dramatic white clouds. warm summer afternoon light. hand-painted anime background style. nostalgic and hopeful mood. absolutely no text or words in the image.`,

  // Style 3: Ghibli solarpunk - cozy countryside
  (scene: string) => `studio ghibli inspired solarpunk illustration of ${scene}. charming countryside with rolling farmland. quaint eco-cottages with green roofs and solar panels among fields. vertical gardens on buildings. winding paths with electric vehicles. fluffy clouds in blue sky. soft afternoon sunlight. hand-painted anime style with rich earthy colors. peaceful sustainable village atmosphere. absolutely no text or words in the image.`,

  // Style 4: Ghibli solarpunk - sunset skyscape
  (scene: string) => `studio ghibli inspired solarpunk illustration of ${scene}. dramatic sunset sky with layers of orange, pink, and purple clouds. silhouetted solarpunk cityscape below with green terraces. elegant wind turbines and floating structures. birds flying across the sky. magical golden light. hand-painted anime background with beautiful color gradients. emotional and inspiring atmosphere. tiny details like floating seeds and leaves. absolutely no text or words in the image.`,
]

/**
 * Generate a featured image for a blog post using DALL-E 3
 * @param styleIndex - Optional index (0-4) to force a specific art style:
 *   0 = Soft watercolor solarpunk
 *   1 = Studio Ghibli inspired
 *   2 = Isometric cozy
 *   3 = Retro futurism
 *   4 = Paper cut collage
 */
export async function generateBlogImage(
  category: BlogCategory,
  altText: string,
  styleIndex?: number
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

    // Use specified style or random
    const styleIdx = styleIndex !== undefined && styleIndex >= 0 && styleIndex < ART_STYLE_PROMPTS.length
      ? styleIndex
      : Math.floor(Math.random() * ART_STYLE_PROMPTS.length)
    const stylePrompt = ART_STYLE_PROMPTS[styleIdx]
    const prompt = stylePrompt(topicScene)
    console.log(`Using art style index: ${styleIdx}`)

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
