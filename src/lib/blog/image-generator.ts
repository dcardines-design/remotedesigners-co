/**
 * AI Image Generation for Blog Posts using DALL-E 3
 * Three-part configuration: Variant, Context, Shot
 */

import OpenAI from 'openai'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { BlogCategory } from './seo-helpers'

// Types
export type Variant = 'dreamy' | 'vibrant' | 'minimal' | 'nature'
export type Context = 'contextual' | 'abstract'
export type Shot = 'wide' | 'medium' | 'closeup' | 'portrait'

interface GenerateOptions {
  category: BlogCategory
  title: string
  variant: Variant
  context: Context
  shot: Shot
}

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
const BASE_STYLE = `dreamy solarpunk illustration in a soft anime watercolor style. Subtle futuristic eco elements like solar panels, wind turbines, floating structures, or green architecture blend naturally into the background. Painterly textures, no hard edges, gentle diffused lighting. Calm, optimistic, and airy mood, minimal clutter, high detail but soft and serene. Watercolor anime aesthetic. ${CANVAS_RULES}`

// Variant color/mood modifiers
const VARIANT_PROMPTS: Record<Variant, string> = {
  dreamy: 'Pastel greens with accents of orange and pink. Soft morning light, ethereal glow. Frieren/Violet Evergarden mood. Extra soft and hazy.',
  vibrant: 'Lush orange and pink and green palette. Golden hour sunset lighting. Warm and glowing. Rich saturated watercolor washes while staying soft.',
  minimal: 'Muted pastel palette with lots of breathing room. Extra minimal clutter, vast open spaces. Whisper-quiet serene mood. Soft cream and pale green tones.',
  nature: 'Emphasis on lush greenery, wildflowers, and natural elements. Soft greens, sky blues, touches of pink flowers. Rolling hills and gentle clouds. Pastoral and peaceful.',
}

// Shot style modifiers
const SHOT_PROMPTS: Record<Shot, (title: string) => string> = {
  wide: () => 'Wide landscape shot. Environment is the main focus. Expansive view with tiny figures in distance if any. Lots of sky and horizon.',
  medium: () => 'Medium shot. Balanced composition showing both environment and subject. Natural framing.',
  closeup: (title) => `Close-up shot focusing on objects, hands, or people that visually represent "${title}". Soft bokeh solarpunk background. Intimate detailed view of topic-relevant items.`,
  portrait: () => 'Portrait composition with people or characters as focus. Soft blurred solarpunk background. Warm and inviting.',
}

// Abstract scenes (generic beautiful scenes)
const ABSTRACT_SCENES = [
  'a peaceful solarpunk landscape at golden hour',
  'soft rolling hills with distant wind turbines',
  'a serene horizon with floating structures',
  'gentle clouds over green architecture',
  'a quiet meadow with solar panels in soft focus',
]

/**
 * Generate a featured image for a blog post using DALL-E 3
 * Configurable via variant, context, and shot options
 */
export async function generateBlogImage(options: GenerateOptions): Promise<{ url: string; storedUrl: string } | null> {
  const { category, title, variant, context, shot } = options

  const openai = getOpenAIClient()
  if (!openai) {
    console.warn('OPENAI_API_KEY not set, skipping image generation')
    return null
  }

  try {
    // Build the prompt from all three parts
    let sceneDescription: string

    if (context === 'contextual') {
      // Use blog title to create topic-specific scene
      sceneDescription = `For this blog topic "${title}" - create imagery that visually represents this concept within a solarpunk setting.`
    } else {
      // Use generic abstract scene
      sceneDescription = ABSTRACT_SCENES[Math.floor(Math.random() * ABSTRACT_SCENES.length)]
    }

    const prompt = `${sceneDescription} ${BASE_STYLE} ${VARIANT_PROMPTS[variant]} ${SHOT_PROMPTS[shot](title)}`

    console.log('Context:', context)
    console.log('Variant:', variant)
    console.log('Shot:', shot)
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
