// AI-powered job processing using OpenRouter

interface ProcessedJob {
  cleanTitle: string
  summary: string
  formattedDescription: string
  skills: string[]
  jobType: string
  experienceLevel: string
}

interface RawJobData {
  title: string
  company: string
  description: string
  location: string
  job_type?: string
  experience_level?: string
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

async function callAI(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 8000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('OpenRouter API error:', error)
    throw new Error(`OpenRouter API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

export async function processJobWithAI(job: RawJobData): Promise<ProcessedJob> {
  const systemPrompt = `You are a job listing processor. Parse job data and return clean, structured information.
Always respond with valid JSON only, no markdown or explanation.`

  const prompt = `Process this job listing and return JSON:

Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Current Job Type: ${job.job_type || 'unknown'}
Current Experience Level: ${job.experience_level || 'unknown'}
Description: ${job.description || 'No description provided'}

IMPORTANT: Preserve ALL content from the description. Do NOT summarize or shorten. Include EVERY bullet point, requirement, benefit, and detail from the original.

Return this exact JSON structure:
{
  "cleanTitle": "Clean job title without company name, location, or prefixes like 'hiring for' or 'position of'",
  "summary": "1-2 sentence summary of the role (max 150 chars)",
  "formattedDescription": "Format ALL content with emoji headers. Include EVERY detail:\n\n📄 Description\n• Include ALL about/overview content\n• Include ALL responsibilities\n• Every single bullet point\n\n🎯 Requirements\n• ALL qualifications\n• ALL nice-to-haves\n• ALL experience requirements\n\n💰 Benefits\n• EVERY benefit listed\n• ALL perks and offerings\n\nDo NOT truncate or summarize. Preserve the complete job posting.",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "jobType": "full-time OR part-time OR contract OR freelance OR internship",
  "experienceLevel": "entry OR junior OR mid OR senior OR lead OR executive"
}`

  try {
    const result = await callAI(prompt, systemPrompt)

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = result.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
    }

    const parsed = JSON.parse(jsonStr) as ProcessedJob

    // Validate and provide defaults
    return {
      cleanTitle: parsed.cleanTitle || job.title,
      summary: parsed.summary || '',
      formattedDescription: parsed.formattedDescription || job.description || '',
      skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 10) : [],
      jobType: normalizeJobType(parsed.jobType),
      experienceLevel: normalizeExperienceLevel(parsed.experienceLevel),
    }
  } catch (error) {
    console.error('AI processing error for job:', job.title, error)
    // Return original data on error
    return {
      cleanTitle: cleanTitleFallback(job.title),
      summary: '',
      formattedDescription: job.description || '',
      skills: [],
      jobType: job.job_type || 'full-time',
      experienceLevel: job.experience_level || 'mid',
    }
  }
}

// Process multiple jobs with rate limiting
export async function processJobsWithAI(jobs: RawJobData[]): Promise<ProcessedJob[]> {
  const results: ProcessedJob[] = []
  const batchSize = 5 // Process 5 at a time to avoid rate limits

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(job => processJobWithAI(job))
    )
    results.push(...batchResults)

    // Small delay between batches
    if (i + batchSize < jobs.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return results
}

// Fallback title cleaner without AI
function cleanTitleFallback(title: string): string {
  return title
    .replace(/^for a position of\s+/i, '')
    .replace(/^looking for\s+(?:a\s+)?/i, '')
    .replace(/^hiring\s+(?:a\s+)?/i, '')
    .replace(/^seeking\s+(?:a\s+)?/i, '')
    .replace(/\s+in\s+[A-Za-z\s,]+(?:,\s*[A-Z]{2})?$/i, '')
    .trim()
}

function normalizeJobType(type: string): string {
  const normalized = type?.toLowerCase().replace(/[^a-z]/g, '') || ''
  const mapping: Record<string, string> = {
    'fulltime': 'full-time',
    'parttime': 'part-time',
    'contract': 'contract',
    'freelance': 'freelance',
    'internship': 'internship',
  }
  return mapping[normalized] || 'full-time'
}

function normalizeExperienceLevel(level: string): string {
  const normalized = level?.toLowerCase().replace(/[^a-z]/g, '') || ''
  const mapping: Record<string, string> = {
    'entry': 'entry',
    'junior': 'junior',
    'mid': 'mid',
    'middle': 'mid',
    'senior': 'senior',
    'lead': 'lead',
    'principal': 'lead',
    'executive': 'executive',
    'director': 'executive',
  }
  return mapping[normalized] || 'mid'
}
