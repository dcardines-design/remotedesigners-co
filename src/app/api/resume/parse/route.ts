import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/openrouter'
import { extractText } from 'unpdf'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('resume') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No resume file provided' },
        { status: 400 }
      )
    }

    // Check file type
    const validTypes = ['application/pdf', 'text/plain']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF or TXT file.' },
        { status: 400 }
      )
    }

    // Get file buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Extract text from PDF
    let resumeText = ''
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        const { text } = await extractText(new Uint8Array(buffer), { mergePages: true })
        resumeText = text
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError)
        return NextResponse.json(
          { error: 'Failed to parse PDF. Please try a different file.' },
          { status: 400 }
        )
      }
    } else {
      // Plain text file
      resumeText = buffer.toString('utf-8')
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract text from resume. Please try a different file.' },
        { status: 400 }
      )
    }

    // First try regex-based parsing for basic fields
    const regexParsed = parseResumeWithRegex(resumeText)

    // Try AI parsing if API key is available
    let aiParsed = null
    if (process.env.OPENROUTER_API_KEY) {
      try {
        aiParsed = await parseResumeWithAI(resumeText)
      } catch (aiError) {
        console.error('AI parsing failed, using regex fallback:', aiError)
      }
    }

    // Merge results, preferring AI results when available
    const parsedData = {
      fullName: aiParsed?.fullName || regexParsed.fullName,
      email: aiParsed?.email || regexParsed.email,
      phone: aiParsed?.phone || regexParsed.phone,
      location: aiParsed?.location || regexParsed.location,
      headline: aiParsed?.headline || regexParsed.headline,
      summary: aiParsed?.summary || regexParsed.summary,
      skills: aiParsed?.skills?.length ? aiParsed.skills : regexParsed.skills,
      yearsOfExperience: aiParsed?.yearsOfExperience || regexParsed.yearsOfExperience,
      currentCompany: aiParsed?.currentCompany || regexParsed.currentCompany,
      currentTitle: aiParsed?.currentTitle || regexParsed.currentTitle,
      portfolioUrl: aiParsed?.portfolioUrl || regexParsed.portfolioUrl,
      linkedinUrl: aiParsed?.linkedinUrl || regexParsed.linkedinUrl,
      experiences: aiParsed?.experiences?.length ? aiParsed.experiences : regexParsed.experiences,
      education: aiParsed?.education?.length ? aiParsed.education : regexParsed.education,
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      rawText: resumeText.substring(0, 500) + '...',
      method: aiParsed ? 'ai' : 'regex'
    })

  } catch (error) {
    console.error('Resume parse error:', error)
    return NextResponse.json(
      { error: 'Failed to parse resume' },
      { status: 500 }
    )
  }
}

async function parseResumeWithAI(resumeText: string): Promise<{
  fullName: string
  email: string
  phone?: string
  location?: string
  headline?: string
  summary?: string
  skills: string[]
  yearsOfExperience?: number
  currentCompany?: string
  currentTitle?: string
  portfolioUrl?: string
  linkedinUrl?: string
  experiences: {
    company: string
    title: string
    location?: string
    startDate: string
    endDate?: string
    isCurrent: boolean
    description?: string
    highlights: string[]
  }[]
  education: {
    institution: string
    degree: string
    fieldOfStudy?: string
    startDate?: string
    endDate?: string
    gpa?: string
  }[]
}> {
  const prompt = `Parse the following resume text and extract structured information. Return ONLY a valid JSON object with no additional text.

Resume text:
"""
${resumeText.substring(0, 4000)}
"""

Return a JSON object with this exact structure:
{
  "fullName": "Full name of the person",
  "email": "email@example.com",
  "phone": "phone number if found",
  "location": "city, state/country if found",
  "headline": "professional headline like 'Senior Product Designer' - create one based on their most recent role",
  "summary": "brief professional summary, max 2-3 sentences",
  "skills": ["skill1", "skill2", "skill3"],
  "yearsOfExperience": 5,
  "currentCompany": "most recent company",
  "currentTitle": "most recent job title",
  "portfolioUrl": "portfolio or personal website URL if found",
  "linkedinUrl": "LinkedIn URL if found",
  "experiences": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "location": "City, State",
      "startDate": "Jan 2020",
      "endDate": "Present",
      "isCurrent": true,
      "description": "Brief role description",
      "highlights": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Arts",
      "fieldOfStudy": "Graphic Design",
      "startDate": "2012",
      "endDate": "2016",
      "gpa": "3.8"
    }
  ]
}

Important:
- Extract all available information
- For skills, focus on technical and design skills
- For experiences, include the most recent 3-4 positions
- Calculate yearsOfExperience based on work history
- If information is not found, use null for optional fields or empty arrays
- Return ONLY the JSON object, no markdown formatting or explanations`

  try {
    const response = await chatCompletion([
      {
        role: 'system',
        content: 'You are a resume parser. Extract structured data from resume text and return only valid JSON. No markdown, no explanations.'
      },
      {
        role: 'user',
        content: prompt
      }
    ])

    // Clean up the response - remove any markdown formatting
    let cleanedResponse = response.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.slice(7)
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3)
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(0, -3)
    }
    cleanedResponse = cleanedResponse.trim()

    const parsed = JSON.parse(cleanedResponse)

    // Ensure required fields have defaults
    return {
      fullName: parsed.fullName || '',
      email: parsed.email || '',
      phone: parsed.phone || undefined,
      location: parsed.location || undefined,
      headline: parsed.headline || undefined,
      summary: parsed.summary || undefined,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      yearsOfExperience: typeof parsed.yearsOfExperience === 'number' ? parsed.yearsOfExperience : undefined,
      currentCompany: parsed.currentCompany || undefined,
      currentTitle: parsed.currentTitle || undefined,
      portfolioUrl: parsed.portfolioUrl || undefined,
      linkedinUrl: parsed.linkedinUrl || undefined,
      experiences: Array.isArray(parsed.experiences) ? parsed.experiences.map((exp: any) => ({
        company: exp.company || '',
        title: exp.title || '',
        location: exp.location,
        startDate: exp.startDate || '',
        endDate: exp.endDate,
        isCurrent: exp.isCurrent || false,
        description: exp.description,
        highlights: Array.isArray(exp.highlights) ? exp.highlights : []
      })) : [],
      education: Array.isArray(parsed.education) ? parsed.education.map((edu: any) => ({
        institution: edu.institution || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate,
        gpa: edu.gpa
      })) : []
    }

  } catch (error) {
    console.error('AI parsing error:', error)
    // Return empty structure if AI parsing fails
    return {
      fullName: '',
      email: '',
      skills: [],
      experiences: [],
      education: []
    }
  }
}

// Regex-based resume parser (fallback when AI is not available)
function parseResumeWithRegex(text: string): {
  fullName: string
  email: string
  phone?: string
  location?: string
  headline?: string
  summary?: string
  skills: string[]
  yearsOfExperience?: number
  currentCompany?: string
  currentTitle?: string
  portfolioUrl?: string
  linkedinUrl?: string
  experiences: any[]
  education: any[]
} {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)

  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i)
  const email = emailMatch ? emailMatch[0] : ''

  // Extract phone
  const phoneMatch = text.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  const phone = phoneMatch ? phoneMatch[0] : undefined

  // Extract LinkedIn
  const linkedinMatch = text.match(/(?:linkedin\.com\/in\/[\w-]+|linkedin\.com\/[\w-]+)/i)
  const linkedinUrl = linkedinMatch ? `https://${linkedinMatch[0]}` : undefined

  // Extract portfolio/website
  const urlMatch = text.match(/(?:portfolio|website|site):\s*(https?:\/\/[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}[^\s]*)/i)
  const portfolioUrl = urlMatch ? (urlMatch[1].startsWith('http') ? urlMatch[1] : `https://${urlMatch[1]}`) : undefined

  // Extract location (common patterns)
  const locationMatch = text.match(/(?:location|city|address):\s*([^\n]+)/i) ||
                        text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*(?:[A-Z]{2}|[A-Z][a-z]+)(?:\s+\d{5})?)/m)
  const location = locationMatch ? locationMatch[1].trim() : undefined

  // Extract name (usually first non-empty line that's not an email/phone)
  let fullName = ''
  for (const line of lines.slice(0, 5)) {
    if (!line.includes('@') && !line.match(/^\d/) && !line.match(/^[\+\(]?\d/) && line.length < 50) {
      // Check if it looks like a name (mostly letters)
      if (line.match(/^[A-Za-z\s\-'\.]+$/) && line.split(' ').length >= 2) {
        fullName = line
        break
      }
    }
  }

  // Extract headline (usually right after name)
  let headline: string | undefined
  const nameIndex = lines.indexOf(fullName)
  if (nameIndex >= 0 && nameIndex < lines.length - 1) {
    const nextLine = lines[nameIndex + 1]
    if (nextLine && !nextLine.includes('@') && !nextLine.match(/^\d/) && nextLine.length < 100) {
      // Check if it looks like a job title
      if (nextLine.match(/designer|developer|engineer|manager|lead|director|architect|analyst|consultant|specialist/i)) {
        headline = nextLine
      }
    }
  }

  // Extract skills (look for skills section or common skill keywords)
  const skills: string[] = []
  const skillsMatch = text.match(/(?:skills|technologies|tools|expertise)[\s:]+([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]|$)/i)
  if (skillsMatch) {
    const skillsText = skillsMatch[1]
    // Split by common delimiters
    const skillItems = skillsText.split(/[,\n•·|]/).map(s => s.trim()).filter(s => s && s.length < 50)
    skills.push(...skillItems)
  }

  // Also look for common design skills in the text
  const commonSkills = [
    'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'InDesign', 'After Effects',
    'UI Design', 'UX Design', 'Product Design', 'Visual Design', 'Interaction Design',
    'Prototyping', 'Wireframing', 'User Research', 'Design Systems', 'Typography',
    'HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'Angular'
  ]
  for (const skill of commonSkills) {
    if (text.toLowerCase().includes(skill.toLowerCase()) && !skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      skills.push(skill)
    }
  }

  // Extract summary (look for summary/about section)
  let summary: string | undefined
  const summaryMatch = text.match(/(?:summary|about|profile|objective)[\s:]+([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]{2,}|$)/i)
  if (summaryMatch) {
    summary = summaryMatch[1].trim().substring(0, 500)
  }

  // Try to extract current title and company from experience
  let currentTitle: string | undefined
  let currentCompany: string | undefined
  const experienceMatch = text.match(/(?:experience|employment|work history)[\s:]+([^\n]+(?:\n[^\n]+)*?)(?=\n\n[A-Z]|education|skills|$)/i)
  if (experienceMatch) {
    const expText = experienceMatch[1]
    // Look for pattern: "Title | Company" or "Title at Company" or "Company - Title"
    const titleCompanyMatch = expText.match(/([A-Za-z\s]+(?:Designer|Developer|Engineer|Manager|Lead|Director))\s*(?:\||at|-|@)\s*([A-Za-z\s&.]+)/i)
    if (titleCompanyMatch) {
      currentTitle = titleCompanyMatch[1].trim()
      currentCompany = titleCompanyMatch[2].trim()
    }
  }

  // Calculate years of experience by looking for year ranges
  let yearsOfExperience: number | undefined
  const yearMatches = text.matchAll(/(?:19|20)\d{2}\s*[-–]\s*(?:(?:19|20)\d{2}|present|current)/gi)
  let totalYears = 0
  for (const match of yearMatches) {
    const range = match[0]
    const years = range.match(/(\d{4})/g)
    if (years && years.length >= 1) {
      const startYear = parseInt(years[0])
      const endYear = years[1] ? parseInt(years[1]) : new Date().getFullYear()
      totalYears += endYear - startYear
    }
  }
  if (totalYears > 0) {
    yearsOfExperience = totalYears
  }

  return {
    fullName,
    email,
    phone,
    location,
    headline,
    summary,
    skills: skills.slice(0, 20), // Limit to 20 skills
    yearsOfExperience,
    currentCompany,
    currentTitle,
    portfolioUrl,
    linkedinUrl,
    experiences: [], // Would need more complex parsing
    education: [] // Would need more complex parsing
  }
}
