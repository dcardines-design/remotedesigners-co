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

// Different art style prompts for variety
const ART_STYLE_PROMPTS = [
  // Style 1: Soft watercolor solarpunk
  (scene: string) => `soft watercolor illustration of a dreamy solarpunk landscape. ${scene}. delicate pastel color palette with golden yellows, sage greens, pale sky blues, coral pinks, and cream whites. rolling hills covered in wildflower meadows. glass geodesic domes and floating structures with trailing plants. wind turbines and solar panels nestled among vegetation. misty mountains in background. golden hour diffused lighting. textured paper quality with soft brushstrokes. peaceful, hopeful mood. absolutely no text or words in the image.`,

  // Style 2: Studio Ghibli inspired
  (scene: string) => `studio ghibli inspired illustration of ${scene}. lush green landscapes with fluffy clouds. warm afternoon sunlight casting long shadows. detailed hand-painted background style. soft edges and dreamy atmosphere. vintage anime aesthetic from the 1990s. cozy and nostalgic feeling. vibrant but not oversaturated colors. small details like butterflies and floating seeds. absolutely no text or words in the image.`,

  // Style 3: Isometric cozy
  (scene: string) => `isometric 3D illustration of ${scene}. cute miniature diorama style. soft pastel colors with mint green, peachy pink, lavender, and warm cream. tiny detailed props and furniture. gentle ambient occlusion shadows. playful and whimsical mood. clean minimalist aesthetic. toy-like quality. warm natural lighting from above. absolutely no text or words in the image.`,

  // Style 4: Retro futurism
  (scene: string) => `retro futurism illustration of ${scene}. 1960s space age optimism meets sustainable future. warm oranges, teals, and cream whites. rounded organic shapes and curved architecture. vintage mid-century modern furniture. optimistic and bright atmosphere. subtle grain texture. atomic age meets eco-friendly design. absolutely no text or words in the image.`,

  // Style 5: Paper cut collage
  (scene: string) => `paper cut collage art style illustration of ${scene}. layered paper textures with subtle shadows between layers. earthy terracotta, sage green, dusty blue, and warm sand colors. geometric shapes with organic elements. handcrafted artisanal quality. depth created through overlapping cutouts. warm diffused lighting. modern craft aesthetic. absolutely no text or words in the image.`,
]

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

    // Select a random art style for variety
    const stylePrompt = ART_STYLE_PROMPTS[Math.floor(Math.random() * ART_STYLE_PROMPTS.length)]
    const prompt = stylePrompt(topicScene)

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
