/**
 * AI Image Generation for Blog Posts using DALL-E 3
 * With GPT-4 Vision for style consistency
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

// Soft anime watercolor style - dreamy and minimal
const BASE_STYLE = `Dreamy soft anime watercolor illustration. Gentle pastel colors: soft greens, warm peach, pale pink, cream. Minimal detail, soft diffused edges, no hard lines. Ethereal and serene atmosphere. Subtle solarpunk elements (small wind turbines, glass domes) in soft focus. Light airy composition with lots of breathing room. Soft gradient sky fills background. Painterly watercolor texture throughout. NO borders, NO dark edges, NO margins, NO vignette, NO frame - artwork fills entire canvas edge to edge. NOT a photo of artwork. NOT realistic. Soft, dreamy, minimal anime aesthetic like Frieren or Violet Evergarden backgrounds.`

const SHOT_STYLES = [
  {
    name: 'Landscape',
    prompt: `Soft dreamy landscape. Gentle rolling hills, distant mountains in pale hues. Soft clouds, warm golden light. Tiny figures in distance. ${BASE_STYLE}`
  },
  {
    name: 'Wide',
    prompt: `Wide serene scene. Soft nature environment with gentle lighting. Minimal elements, lots of sky and open space. Peaceful mood. ${BASE_STYLE}`
  },
  {
    name: 'Medium',
    prompt: `Medium shot with soft blurred background. Gentle natural setting. Warm diffused lighting. Simple composition. ${BASE_STYLE}`
  },
  {
    name: 'Close',
    prompt: `Close view with very soft bokeh background. Warm pastel tones. Dreamy out of focus nature elements. Ethereal glow. ${BASE_STYLE}`
  }
]

// Randomly select shot style
function getAnimeStyle(): { name: string; prompt: string } {
  return SHOT_STYLES[Math.floor(Math.random() * SHOT_STYLES.length)]
}

// Simple scene descriptions - minimal and dreamy
const TOPIC_SCENES: Record<BlogCategory, string[]> = {
  'job-market-insights': [
    'a single figure gazing at a distant glowing horizon',
    'soft hills with tiny paths leading to different directions',
    'a peaceful valley with gentle morning mist',
  ],
  'remote-work-tips': [
    'a cozy window seat with soft light streaming in',
    'a quiet balcony overlooking misty mountains',
    'a peaceful room with plants and warm sunlight',
  ],
  'career-advice': [
    'a winding path through soft rolling hills',
    'a figure standing on a gentle hilltop at sunrise',
    'stepping stones across a calm reflective pond',
  ],
  'design-news': [
    'soft clouds parting to reveal warm light',
    'a peaceful morning sky with gentle colors',
    'birds flying across a pastel gradient sky',
  ],
  'ux-design': [
    'soft flowing ribbons in a gentle breeze',
    'delicate paper planes floating in soft light',
    'a calm stream reflecting the sky',
  ],
  'product-design': [
    'soft geometric shapes floating in dreamy space',
    'gentle light filtering through glass',
    'minimalist forms in warm pastel tones',
  ],
  'graphic-design': [
    'soft watercolor washes blending together',
    'gentle abstract shapes in warm hues',
    'delicate brushstrokes in pastel colors',
  ],
}

/**
 * Generate a featured image for a blog post using DALL-E 3
 * Uses unified Ghibli watercolor style with topic-relevant scenes
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

    // Build prompt: Frieren anime style + topic scene + random shot type
    const shotStyle = getAnimeStyle()
    const prompt = `${topicScene}. Solarpunk setting with wind turbines and glass domes visible. ${shotStyle.prompt}`

    console.log('Scene:', topicScene)
    console.log('Shot:', shotStyle.name)
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
