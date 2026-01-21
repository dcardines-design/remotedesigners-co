/**
 * AI Image Generation for Blog Posts using DALL-E 3
 * Multiple style options available
 */

import OpenAI from 'openai'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { BlogCategory } from './seo-helpers'

// Available image styles
export type ImageStyle = 'contextual' | 'dreamy' | 'vibrant' | 'minimal' | 'nature'

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

// Base style - dreamy solarpunk anime watercolor
const BASE_STYLE = `dreamy solarpunk illustration in a soft anime watercolor style. Subtle futuristic eco elements like solar panels, wind turbines, floating structures, or green architecture blend naturally into the background. Painterly textures, no hard edges, gentle diffused lighting. Calm, optimistic, and airy mood, wide depth of field, minimal clutter, high detail but soft and serene. Watercolor anime aesthetic. ${CANVAS_RULES}`

// Style variants - all based on the same solarpunk watercolor aesthetic
const STYLE_PROMPTS: Record<Exclude<ImageStyle, 'contextual'>, string> = {
  dreamy: `${BASE_STYLE} Pastel greens with accents of orange and pink. Soft morning light, ethereal glow. Frieren/Violet Evergarden mood. Extra soft and hazy.`,

  vibrant: `${BASE_STYLE} Lush orange and pink and green palette. Golden hour sunset lighting. Warm and glowing. Rich saturated watercolor washes while staying soft.`,

  minimal: `${BASE_STYLE} Muted pastel palette with lots of breathing room. Extra minimal clutter, vast open spaces. Whisper-quiet serene mood. Soft cream and pale green tones.`,

  nature: `${BASE_STYLE} Emphasis on lush greenery, wildflowers, and natural elements. Soft greens, sky blues, touches of pink flowers. Rolling hills and gentle clouds. Pastoral and peaceful.`,
}

// Contextual style - uses blog title to generate topic-specific imagery
function getContextualPrompt(title: string): string {
  return `${BASE_STYLE} For this blog topic "${title}" - create imagery that visually represents this concept. The main focus should gently integrate into the solarpunk scene. Pastel greens with accents of orange and pink.`
}

// Simple universal scenes that work across all styles
const UNIVERSAL_SCENES = [
  'a peaceful solarpunk landscape at golden hour',
  'soft rolling hills with distant wind turbines',
  'a serene horizon with floating structures',
  'gentle clouds over green architecture',
  'a quiet meadow with solar panels in soft focus',
]

/**
 * Generate a featured image for a blog post using DALL-E 3
 * Supports multiple style options
 */
export async function generateBlogImage(
  category: BlogCategory,
  altText: string,
  style: ImageStyle = 'contextual',
  title?: string
): Promise<{ url: string; storedUrl: string } | null> {
  const openai = getOpenAIClient()
  if (!openai) {
    console.warn('OPENAI_API_KEY not set, skipping image generation')
    return null
  }

  try {
    let prompt: string

    if (style === 'contextual' && title) {
      // Contextual style uses the blog title directly
      prompt = getContextualPrompt(title)
      console.log('Title:', title)
    } else {
      // Other styles use random scenes
      const scene = UNIVERSAL_SCENES[Math.floor(Math.random() * UNIVERSAL_SCENES.length)]
      const stylePrompt = STYLE_PROMPTS[style === 'contextual' ? 'dreamy' : style]
      prompt = `${scene}. ${stylePrompt}`
      console.log('Scene:', scene)
    }

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
