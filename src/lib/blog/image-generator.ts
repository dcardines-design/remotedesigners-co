/**
 * AI Image Generation for Blog Posts using DALL-E 3
 * Multiple style options available
 */

import OpenAI from 'openai'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { BlogCategory } from './seo-helpers'

// Available image styles
export type ImageStyle = 'dreamy' | 'vibrant' | 'minimal' | 'nature'

// Lazy OpenAI client initialization
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return null
  }
  return new OpenAI({ apiKey })
}

// Canvas requirements - MUST fill entire frame
const CANVAS_RULES = `CRITICAL: The artwork MUST fill the ENTIRE 1792x1024 canvas from edge to edge. NO borders. NO dark edges. NO margins. NO vignette. NO letterboxing. NO solid color bars on any side. The scene extends fully to all four edges with NO empty space. NOT a photo of artwork on paper/desk.`

// Style-specific prompts
const STYLE_PROMPTS: Record<ImageStyle, string> = {
  dreamy: `Dreamy soft anime watercolor illustration in the style of Studio Ghibli and Frieren. Soft pastel colors: pale pink, warm peach, soft green, cream, lavender. Painterly watercolor texture with soft diffused edges. Ethereal glowing light, gentle atmosphere. Minimal detail, lots of breathing room. Serene and peaceful mood. ${CANVAS_RULES}`,

  vibrant: `Bold colorful anime illustration with rich saturated colors. Warm oranges, deep teals, vibrant pinks, golden yellows. Dynamic composition with energy and movement. Cel-shaded anime style with clean lines. Bright optimistic mood. Sunset or golden hour lighting. ${CANVAS_RULES}`,

  minimal: `Ultra minimal abstract illustration. Simple geometric shapes, clean lines. Soft neutral tones: warm whites, pale grays, subtle blush. Lots of negative space. Modern and sophisticated. Barely there details, whisper-quiet aesthetic. Zen-like calm. ${CANVAS_RULES}`,

  nature: `Lush nature illustration in soft watercolor style. Rolling green hills, wildflowers, gentle clouds. Warm golden sunlight filtering through. Soft greens, sky blues, warm yellows, touches of pink flowers. Peaceful pastoral scene. Studio Ghibli countryside aesthetic. ${CANVAS_RULES}`,
}

// Simple universal scenes that work across all styles
const UNIVERSAL_SCENES = [
  'a peaceful landscape at golden hour',
  'soft rolling hills under a gentle sky',
  'a serene horizon with warm light',
  'gentle clouds in a pastel sky',
  'a quiet meadow with soft lighting',
]

/**
 * Generate a featured image for a blog post using DALL-E 3
 * Supports multiple style options
 */
export async function generateBlogImage(
  category: BlogCategory,
  altText: string,
  style: ImageStyle = 'dreamy'
): Promise<{ url: string; storedUrl: string } | null> {
  const openai = getOpenAIClient()
  if (!openai) {
    console.warn('OPENAI_API_KEY not set, skipping image generation')
    return null
  }

  try {
    // Select a random scene
    const scene = UNIVERSAL_SCENES[Math.floor(Math.random() * UNIVERSAL_SCENES.length)]

    // Get style-specific prompt
    const stylePrompt = STYLE_PROMPTS[style]

    // Build final prompt
    const prompt = `${scene}. ${stylePrompt}`

    console.log('Scene:', scene)
    console.log('Style:', style)
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
    'design-news': '/blog/fallback-design-news.jpg',
    'ux-design': '/blog/fallback-ux-design.jpg',
    'product-design': '/blog/fallback-product-design.jpg',
    'graphic-design': '/blog/fallback-graphic-design.jpg',
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
