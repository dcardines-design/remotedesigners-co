/**
 * Regenerate blog image with custom topic-relevant prompt + Vision style
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import OpenAI from 'openai'

const VISION_STYLE = `Studio Ghibli inspired anime watercolor painting style. Soft and dreamy painting technique, seamlessly blending gentle hues. Pastel shades dominated by light blues, greens, and occasional warm earthy tones. Bright and airy lighting evoking a serene and uplifting atmosphere. Delicate brushstrokes contributing to smooth and fluid appearance. Moderate level of detail with clear and inviting forms. Tranquil and idyllic mood, soothing and refreshingly optimistic. Full bleed edge-to-edge composition with no borders or margins.`

async function regenerate() {
  const { createAdminSupabaseClient } = await import('../src/lib/supabase')

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const supabase = createAdminSupabaseClient()

  // Get the post
  const { data: post, error: fetchError } = await supabase
    .from('blog_posts')
    .select('id, slug, title, category')
    .eq('slug', 'remote-ux-research-methods-the-2026-playbook')
    .single()

  if (fetchError || !post) {
    console.error('Post not found:', fetchError)
    return
  }

  console.log('Found post:', post.title)

  // Custom prompt relevant to UX Research
  const prompt = `Studio Ghibli inspired anime watercolor painting of a serene solarpunk scene showing UX researchers conducting remote user interviews in a beautiful green meadow. Designers with laptops sit on blankets among wildflowers, video calling participants on screens that float gently in the air. Wind turbines and glass domes in the background. People taking notes, sticky notes floating around them like butterflies. Collaborative and peaceful atmosphere of remote research work in nature. ${VISION_STYLE}`

  console.log('\nGenerating with custom UX Research prompt...')
  console.log('Prompt:', prompt.substring(0, 200) + '...\n')

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
    style: 'vivid',
  })

  const tempUrl = response.data?.[0]?.url
  if (!tempUrl) {
    console.error('No URL returned')
    return
  }

  // Download and store
  console.log('Storing in Supabase...')
  const imageResponse = await fetch(tempUrl)
  const imageBuffer = await imageResponse.arrayBuffer()
  const uint8Array = new Uint8Array(imageBuffer)

  const filename = `blog/${post.category}/${Date.now()}.png`
  await supabase.storage.from('blog-images').upload(filename, uint8Array, {
    contentType: 'image/png',
    upsert: false,
  })

  const { data: publicUrlData } = supabase.storage.from('blog-images').getPublicUrl(filename)
  const storedUrl = publicUrlData.publicUrl

  console.log('New image URL:', storedUrl)

  // Update post
  await supabase.from('blog_posts').update({ featured_image: storedUrl }).eq('id', post.id)

  console.log('\n✅ Done!')
}

regenerate().catch(console.error)
