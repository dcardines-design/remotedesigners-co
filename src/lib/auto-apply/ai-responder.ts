import { chatCompletion } from '../openrouter'

export interface UserProfile {
  fullName: string
  email: string
  headline?: string
  summary?: string
  skills: string[]
  yearsOfExperience?: number
  currentCompany?: string
  currentTitle?: string
  experiences?: {
    company: string
    title: string
    description?: string
    highlights: string[]
  }[]
}

export interface JobContext {
  title: string
  company: string
  description: string
  requirements?: string[]
}

export interface CustomQuestion {
  question: string
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox'
  options?: string[]
  maxLength?: number
}

export async function generateCustomResponses(
  questions: CustomQuestion[],
  userProfile: UserProfile,
  jobContext: JobContext,
  coverLetter?: string
): Promise<Record<string, string>> {
  const responses: Record<string, string> = {}

  for (const question of questions) {
    const response = await generateSingleResponse(question, userProfile, jobContext, coverLetter)
    responses[question.question] = response
  }

  return responses
}

async function generateSingleResponse(
  question: CustomQuestion,
  userProfile: UserProfile,
  jobContext: JobContext,
  coverLetter?: string
): Promise<string> {
  // For select/radio with options, pick the best match
  if ((question.type === 'select' || question.type === 'radio') && question.options) {
    return await selectBestOption(question.question, question.options, userProfile, jobContext)
  }

  // For text/textarea, generate a response
  const prompt = buildPrompt(question, userProfile, jobContext, coverLetter)

  try {
    const response = await chatCompletion([
      {
        role: 'system',
        content: `You are helping a job applicant answer application questions.
Provide concise, professional responses that highlight relevant experience and skills.
Be genuine and specific - avoid generic statements.
Match the tone to the company and role.
Keep responses focused and to the point.`
      },
      {
        role: 'user',
        content: prompt
      }
    ])

    let answer = response.trim()

    // Respect max length if specified
    if (question.maxLength && answer.length > question.maxLength) {
      answer = answer.substring(0, question.maxLength - 3) + '...'
    }

    return answer
  } catch (error) {
    console.error('AI response generation failed:', error)
    return getDefaultResponse(question.question, userProfile)
  }
}

async function selectBestOption(
  question: string,
  options: string[],
  userProfile: UserProfile,
  jobContext: JobContext
): Promise<string> {
  const questionLower = question.toLowerCase()

  // Common question patterns with direct answers
  if (questionLower.includes('authorized') && questionLower.includes('work')) {
    const yesOptions = options.filter(o => /yes|authorized|eligible/i.test(o))
    if (yesOptions.length > 0) return yesOptions[0]
  }

  if (questionLower.includes('sponsorship') || questionLower.includes('visa')) {
    const noOptions = options.filter(o => /no|not\s*require/i.test(o))
    if (noOptions.length > 0) return noOptions[0]
  }

  if (questionLower.includes('how did you hear') || questionLower.includes('source')) {
    const jobBoardOptions = options.filter(o => /job\s*board|online|website|linkedin/i.test(o))
    if (jobBoardOptions.length > 0) return jobBoardOptions[0]
  }

  if (questionLower.includes('years') && questionLower.includes('experience')) {
    const years = userProfile.yearsOfExperience || 3
    // Find the option that matches closest
    for (const option of options) {
      const match = option.match(/(\d+)/)
      if (match) {
        const optionYears = parseInt(match[1])
        if (years >= optionYears) return option
      }
    }
    return options[options.length - 1] // Return highest if we exceed all
  }

  if (questionLower.includes('willing') && questionLower.includes('relocate')) {
    // For remote jobs, usually "No" or "Remote only" is appropriate
    const remoteOptions = options.filter(o => /no|remote|prefer\s*not/i.test(o))
    if (remoteOptions.length > 0) return remoteOptions[0]
    return options[0]
  }

  if (questionLower.includes('start') || questionLower.includes('available')) {
    const immediateOptions = options.filter(o => /immediate|asap|2\s*week|right\s*away/i.test(o))
    if (immediateOptions.length > 0) return immediateOptions[0]
    return options[0]
  }

  // Use AI for complex selections
  try {
    const prompt = `
Question: "${question}"
Available options: ${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Applicant profile:
- Name: ${userProfile.fullName}
- Current role: ${userProfile.currentTitle || 'Designer'}
- Years of experience: ${userProfile.yearsOfExperience || 'Not specified'}
- Skills: ${userProfile.skills.slice(0, 10).join(', ')}

Job: ${jobContext.title} at ${jobContext.company}

Based on this information, which option number (1-${options.length}) is the most appropriate answer?
Respond with just the number.`

    const response = await chatCompletion([
      { role: 'user', content: prompt }
    ])

    const match = response.match(/(\d+)/)
    if (match) {
      const index = parseInt(match[1]) - 1
      if (index >= 0 && index < options.length) {
        return options[index]
      }
    }
  } catch (error) {
    console.error('AI option selection failed:', error)
  }

  // Default to first non-empty option
  return options.find(o => o.trim().length > 0) || options[0]
}

function buildPrompt(
  question: CustomQuestion,
  userProfile: UserProfile,
  jobContext: JobContext,
  coverLetter?: string
): string {
  const maxWords = question.type === 'textarea' ? 150 : 50

  return `
Answer this job application question for the role of ${jobContext.title} at ${jobContext.company}.

Question: "${question.question}"

About the applicant:
- Name: ${userProfile.fullName}
- Headline: ${userProfile.headline || 'Designer'}
- Current/Recent role: ${userProfile.currentTitle || 'N/A'} at ${userProfile.currentCompany || 'N/A'}
- Skills: ${userProfile.skills.slice(0, 15).join(', ')}
- Summary: ${userProfile.summary || 'N/A'}

${userProfile.experiences && userProfile.experiences.length > 0 ? `
Recent experience:
${userProfile.experiences.slice(0, 2).map(exp =>
  `- ${exp.title} at ${exp.company}: ${exp.highlights.slice(0, 2).join('; ')}`
).join('\n')}
` : ''}

${coverLetter ? `
The applicant's cover letter provides additional context:
"${coverLetter.substring(0, 500)}${coverLetter.length > 500 ? '...' : ''}"
` : ''}

Job description excerpt:
"${jobContext.description.substring(0, 500)}${jobContext.description.length > 500 ? '...' : ''}"

Instructions:
- Keep your answer under ${maxWords} words
- Be specific and reference actual experience when possible
- Match the professional tone expected for ${jobContext.company}
- Answer naturally as the applicant would
- Do not include "I am" at the start - vary your sentence structure

Provide only the answer, no additional commentary.`
}

function getDefaultResponse(question: string, userProfile: UserProfile): string {
  const questionLower = question.toLowerCase()

  // Default responses for common questions
  if (questionLower.includes('why') && (questionLower.includes('company') || questionLower.includes('role'))) {
    return `I'm excited about this opportunity because it aligns with my experience in ${userProfile.skills.slice(0, 3).join(', ')}. I'm passionate about creating impactful design work and believe I can contribute meaningfully to the team.`
  }

  if (questionLower.includes('strength')) {
    return `My key strengths include ${userProfile.skills.slice(0, 3).join(', ')}. I'm also highly collaborative and committed to delivering high-quality work on time.`
  }

  if (questionLower.includes('salary') || questionLower.includes('compensation')) {
    return 'I\'m open to discussing compensation based on the full scope of the role and benefits package.'
  }

  if (questionLower.includes('start') || questionLower.includes('available')) {
    return 'I can start within two weeks of accepting an offer.'
  }

  // Generic fallback
  return `With my background in ${userProfile.headline || 'design'}, I believe I'd be a strong fit for this role. I'd be happy to discuss further in an interview.`
}

// Check if a question needs AI-generated response vs can be auto-filled
export function needsAIResponse(question: string): boolean {
  const questionLower = question.toLowerCase()

  // Questions that typically need AI
  const aiPatterns = [
    /why.*(interest|apply|company|role|position)/,
    /what.*(interest|excite|attract)/,
    /tell.*about.*yourself/,
    /describe.*(experience|background|project)/,
    /how.*would.*you/,
    /what.*make.*you/,
    /strength|weakness/,
    /accomplishment|achievement/,
    /challenge.*overcome/,
    /where.*see.*yourself/,
    /contribute.*team/,
    /unique.*bring/
  ]

  return aiPatterns.some(pattern => pattern.test(questionLower))
}

// Estimate response quality/confidence
export function estimateResponseConfidence(
  question: CustomQuestion,
  response: string,
  userProfile: UserProfile
): number {
  let confidence = 0.5

  // Higher confidence if response mentions user's actual skills/experience
  const userSkills = userProfile.skills.map(s => s.toLowerCase())
  const responseLower = response.toLowerCase()

  const skillMentions = userSkills.filter(skill => responseLower.includes(skill)).length
  confidence += Math.min(skillMentions * 0.1, 0.3)

  // Higher confidence for appropriate length
  const wordCount = response.split(/\s+/).length
  if (question.type === 'textarea' && wordCount >= 30 && wordCount <= 200) {
    confidence += 0.1
  } else if (question.type === 'text' && wordCount >= 5 && wordCount <= 50) {
    confidence += 0.1
  }

  // Lower confidence for generic phrases
  const genericPhrases = ['team player', 'hard worker', 'passionate', 'motivated']
  const genericCount = genericPhrases.filter(phrase => responseLower.includes(phrase)).length
  confidence -= genericCount * 0.05

  return Math.max(0.1, Math.min(1, confidence))
}
