const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterOptions {
  model?: string
  temperature?: number
  max_tokens?: number
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: OpenRouterOptions = {}
) {
  const {
    model = 'anthropic/claude-3.5-sonnet', // Default to Claude 3.5 Sonnet
    temperature = 0.7,
    max_tokens = 2000,
  } = options

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'RemoteDesigners.co',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'OpenRouter API error')
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// Resume Enhancement
export async function enhanceResumeBulletPoint(
  bulletPoint: string,
  context: { jobTitle: string; company: string }
): Promise<string> {
  const messages: ChatMessage[] = [
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
      content: `Enhance this bullet point for a ${context.jobTitle} role at ${context.company}:\n\n"${bulletPoint}"`,
    },
  ]

  return chatCompletion(messages, { temperature: 0.6 })
}

// Cover Letter Generation
export async function generateCoverLetter(
  resume: {
    fullName: string
    experience: Array<{ title: string; company: string; description: string }>
    skills: string[]
  },
  job: {
    title: string
    company: string
    description: string
    requirements: string[]
  }
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are an expert cover letter writer for design professionals. Write compelling, personalized cover letters that:
- Match the candidate's experience to job requirements
- Highlight relevant design skills and achievements
- Show genuine interest in the company
- Are professional but personable
- Are 3-4 paragraphs long
Write in first person from the candidate's perspective.`,
    },
    {
      role: 'user',
      content: `Write a cover letter for:

CANDIDATE:
Name: ${resume.fullName}
Skills: ${resume.skills.join(', ')}
Experience: ${resume.experience.map(e => `${e.title} at ${e.company}: ${e.description}`).join('\n')}

JOB:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Requirements: ${job.requirements.join(', ')}`,
    },
  ]

  return chatCompletion(messages, { temperature: 0.7, max_tokens: 1500 })
}

// Job Match Analysis
export async function analyzeJobMatch(
  resume: {
    skills: string[]
    experience: Array<{ title: string; description: string }>
  },
  job: {
    title: string
    description: string
    requirements: string[]
    skills: string[]
  }
): Promise<{
  matchScore: number
  matchingSkills: string[]
  missingSkills: string[]
  suggestions: string[]
}> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a job matching expert. Analyze how well a candidate matches a job posting.
Return a JSON object with:
- matchScore: 0-100 percentage
- matchingSkills: array of skills the candidate has that match the job
- missingSkills: array of required skills the candidate lacks
- suggestions: array of 2-3 tips to improve their application

Return ONLY valid JSON, no other text.`,
    },
    {
      role: 'user',
      content: `CANDIDATE:
Skills: ${resume.skills.join(', ')}
Experience: ${resume.experience.map(e => `${e.title}: ${e.description}`).join('\n')}

JOB:
Title: ${job.title}
Description: ${job.description}
Requirements: ${job.requirements.join(', ')}
Skills: ${job.skills.join(', ')}`,
    },
  ]

  const response = await chatCompletion(messages, { temperature: 0.3 })
  return JSON.parse(response)
}
