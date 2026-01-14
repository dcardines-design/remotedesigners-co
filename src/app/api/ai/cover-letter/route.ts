import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const {
      jobTitle,
      company,
      jobDescription,
      yourName,
      yourExperience,
      yourSkills,
      tone = 'professional',
    } = await request.json()

    if (!jobTitle || !company || !yourName) {
      return NextResponse.json(
        { error: 'Job title, company, and your name are required' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      )
    }

    const toneInstructions = {
      professional: 'Write in a professional, polished tone.',
      friendly: 'Write in a warm, friendly tone while remaining professional.',
      confident: 'Write in a confident, assertive tone that showcases expertise.',
      creative: 'Write in a creative, unique tone that stands out while remaining professional.',
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
            content: `You are an expert cover letter writer for design professionals. Write compelling, personalized cover letters that:
- Match the candidate's experience to job requirements
- Highlight relevant design skills and achievements
- Show genuine interest in the company
- Are 3-4 paragraphs long
- ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional}

Write in first person from the candidate's perspective. Do not include placeholder brackets like [Company] - use the actual values provided.`,
          },
          {
            role: 'user',
            content: `Write a cover letter for:

JOB DETAILS:
- Position: ${jobTitle}
- Company: ${company}
${jobDescription ? `- Job Description: ${jobDescription}` : ''}

CANDIDATE DETAILS:
- Name: ${yourName}
${yourSkills ? `- Skills: ${yourSkills}` : ''}
${yourExperience ? `- Experience: ${yourExperience}` : ''}

Write a complete cover letter that I can use directly.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenRouter API error')
    }

    const data = await response.json()
    const coverLetter = data.choices[0].message.content

    return NextResponse.json({ coverLetter })
  } catch (error) {
    console.error('Cover letter generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    )
  }
}
