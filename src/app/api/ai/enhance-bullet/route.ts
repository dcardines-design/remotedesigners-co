import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const { bulletPoint, jobTitle, company } = await request.json()

    if (!bulletPoint) {
      return NextResponse.json(
        { error: 'Bullet point is required' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      // Return enhanced demo version if no API key
      return NextResponse.json({
        enhanced: `Led ${bulletPoint.toLowerCase().includes('design') ? 'design initiatives' : 'key projects'} that improved user engagement by 40%, collaborating with cross-functional teams to deliver impactful solutions`,
      })
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'RemoteDesigners.co',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume writer specializing in design roles. Enhance bullet points to be more impactful by:
- Starting with strong action verbs
- Including quantifiable results when possible
- Highlighting design skills and tools
- Keeping it concise (under 2 lines)
Only return the enhanced bullet point, nothing else.`,
          },
          {
            role: 'user',
            content: `Enhance this bullet point for a ${jobTitle || 'Designer'} role at ${company || 'a company'}:\n\n"${bulletPoint}"`,
          },
        ],
        temperature: 0.6,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenRouter API error')
    }

    const data = await response.json()
    const enhanced = data.choices[0].message.content

    return NextResponse.json({ enhanced })
  } catch (error) {
    console.error('Enhance bullet error:', error)
    return NextResponse.json(
      { error: 'Failed to enhance bullet point' },
      { status: 500 }
    )
  }
}
