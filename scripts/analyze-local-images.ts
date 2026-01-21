/**
 * Analyze local reference images with GPT-4 Vision
 */

import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'

dotenv.config({ path: '.env.local' })

const imagePaths = [
  '/Users/DGC/Downloads/ChatGPT Image Jan 18, 2026, 05_59_33 PM.png',
  '/Users/DGC/Downloads/ChatGPT Image Jan 15, 2026, 03_53_20 PM.png',
  '/Users/DGC/Downloads/ChatGPT Image Jan 16, 2026, 11_22_21 PM.png',
  '/Users/DGC/Downloads/ChatGPT Image Jan 15, 2026, 12_14_05 AM.png',
  '/Users/DGC/Downloads/ChatGPT Image Jan 14, 2026, 04_11_34 PM.png',
]

async function analyzeImages() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // Read all images as base64
  const imageContents: OpenAI.Chat.Completions.ChatCompletionContentPart[] = []

  for (const imgPath of imagePaths) {
    if (fs.existsSync(imgPath)) {
      const imageData = fs.readFileSync(imgPath)
      const base64 = imageData.toString('base64')
      imageContents.push({
        type: 'image_url',
        image_url: { url: `data:image/png;base64,${base64}` },
      })
      console.log('Loaded:', path.basename(imgPath))
    } else {
      console.log('Not found:', imgPath)
    }
  }

  console.log(`\nAnalyzing ${imageContents.length} images with GPT-4 Vision...\n`)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze these ${imageContents.length} images and extract their COMMON visual style elements to create a unified style description for DALL-E image generation.

Focus on what's CONSISTENT across all images:
1. Art medium and technique (watercolor, painting style)
2. Color palette (specific colors, saturation, warmth/coolness)
3. Lighting quality and atmosphere
4. Texture and brush stroke characteristics
5. Level of detail and rendering style
6. Overall mood and aesthetic

Output a single, detailed style description paragraph that can be appended to ANY DALL-E prompt to recreate this exact visual style. Start with "Art style:" and make it specific enough to reproduce consistently.

Do NOT describe the subject matter - only the artistic technique and visual qualities.`,
          },
          ...imageContents,
        ],
      },
    ],
    max_tokens: 800,
  })

  const styleDescription = response.choices[0]?.message?.content || ''

  console.log('=== EXTRACTED STYLE DESCRIPTION ===\n')
  console.log(styleDescription)

  console.log('\n\n=== COPY FOR CODE ===\n')
  // Escape for use in code
  const escaped = styleDescription.replace(/`/g, '\\`').replace(/\$/g, '\\$')
  console.log(`const VISION_STYLE_REFERENCE = \`${escaped}\``)
}

analyzeImages().catch(console.error)
