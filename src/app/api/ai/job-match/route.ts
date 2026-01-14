import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const { resume, job } = await request.json()

    if (!resume || !job) {
      return NextResponse.json(
        { error: 'Resume and job data are required' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      // Return demo data if no API key
      return NextResponse.json({
        matchScore: 75,
        matchingSkills: ['Figma', 'UI Design', 'Prototyping'],
        missingSkills: ['Design Systems', 'User Research'],
        suggestions: [
          'Highlight any experience with design systems in your resume',
          'Add examples of user research you\'ve conducted',
          'Consider getting certified in the missing skill areas',
        ],
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
            content: `You are a job matching expert. Analyze how well a candidate matches a job posting.
Return a JSON object with exactly these fields:
- matchScore: number from 0-100
- matchingSkills: array of skills the candidate has that match the job
- missingSkills: array of required skills the candidate lacks
- suggestions: array of 2-3 actionable tips to improve their application

Return ONLY valid JSON, no other text or markdown formatting.`,
          },
          {
            role: 'user',
            content: `Analyze this job match:

CANDIDATE RESUME:
- Skills: ${resume.skills?.join(', ') || 'Not specified'}
- Experience: ${resume.experience?.map((e: any) => `${e.title}: ${e.description}`).join('\n') || 'Not specified'}

JOB POSTING:
- Title: ${job.title}
- Description: ${job.description || 'Not specified'}
- Requirements: ${job.requirements?.join(', ') || 'Not specified'}
- Skills: ${job.skills?.join(', ') || 'Not specified'}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenRouter API error')
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    // Parse the JSON response
    const matchResult = JSON.parse(content)

    return NextResponse.json(matchResult)
  } catch (error) {
    console.error('Job match analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze job match' },
      { status: 500 }
    )
  }
}
