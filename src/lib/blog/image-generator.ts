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

// Frieren-style anime prompts - four shot variations
const BASE_STYLE = `STRICT STYLE - This IS the artwork, not a photo of artwork:
- Style: Studio Ghibli background art, Frieren anime aesthetic, watercolor painting
- The image itself is the watercolor painting - NOT a photo of a painting on a desk
- Colors: Lush greens, soft pinks, warm oranges, cream and golden tones throughout the ENTIRE image
- Linework: Thin delicate sepia outlines
- Lighting: Golden hour, warm and dreamy, evenly lit across full frame
- Mood: Peaceful solarpunk utopia with wind turbines and glass domes
- Small figures in scene, environment is the focus
- DO NOT: photo of artwork, artwork on paper/desk, art supplies visible, frame/border, photorealistic, 3D, dark edges, dark bars, vignette, letterboxing, solid color borders, black/blue/dark margins
COMPOSITION: Wide 16:9 horizontal landscape. The scene MUST fill the ENTIRE canvas from edge to edge with no empty space, no solid color bars, no dark borders on any side. The artwork extends fully to all four edges. No text, no watermarks.`

const SHOT_STYLES = [
  {
    name: 'Far/Landscape',
    prompt: `Far landscape shot with environment as the main subject. Lush nature foreground with flowers and plants framing the scene. Small distant figures. Solarpunk architecture (glass domes, wind turbines, solar panels) in background. Scenic and atmospheric. ${BASE_STYLE}`
  },
  {
    name: 'Wide',
    prompt: `Wide shot showing full scene. Characters visible but environment equally important. Lush nature and solarpunk elements throughout. ${BASE_STYLE}`
  },
  {
    name: 'Medium',
    prompt: `Medium shot showing characters from waist up with environment visible behind them. Lush nature and solarpunk setting. ${BASE_STYLE}`
  },
  {
    name: 'Close',
    prompt: `Close shot focusing on character upper body and face. Soft blurred background with hints of nature and solarpunk elements. ${BASE_STYLE}`
  }
]

// Randomly select shot style
function getAnimeStyle(): { name: string; prompt: string } {
  return SHOT_STYLES[Math.floor(Math.random() * SHOT_STYLES.length)]
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
  'design-news': [
    'a busy creative newsroom with designers reading holographic news feeds',
    'a town square with floating design news bulletins and excited readers',
    'a designer discovering something exciting on a magical newspaper',
    'a messenger bird delivering design news scrolls to a creative village',
    'a community gathering around a glowing announcement board in a garden',
  ],
  'ux-design': [
    'a designer crafting user journey maps on a large magical canvas',
    'wireframes and prototypes floating in an enchanted design studio',
    'a person conducting user research in a cozy cafe setting',
    'designers collaborating on interface designs in a glass workshop',
    'a creative workspace with user personas displayed on wooden boards',
  ],
  'product-design': [
    'a designer sculpting a 3D product prototype in a magical workshop',
    'a team whiteboarding product ideas in a sunlit collaborative space',
    'design systems and components floating in an organized studio',
    'a designer iterating on product mockups with magical tools',
    'a product launch celebration in a creative garden courtyard',
  ],
  'graphic-design': [
    'a village square with colorful banners and creative signage everywhere',
    'floating typography and letters drifting through a flower garden',
    'a peaceful meadow with glowing brand symbols hovering in the air',
    'an artistic treehouse village with vibrant decorations and patterns',
    'a serene landscape with colorful hot air balloons and creative patterns in the sky',
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
