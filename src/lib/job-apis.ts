// Job API integrations - Multiple free sources

export interface NormalizedJob {
  id: string
  source: 'remotive' | 'remoteok' | 'arbeitnow' | 'jsearch' | 'himalayas' | 'jobicy' | 'greenhouse' | 'lever' | 'ashby' | 'adzuna' | 'authenticjobs' | 'workingnomads' | 'themuse' | 'glints' | 'tokyodev' | 'nodeflairsg'
  title: string
  company: string
  company_logo?: string
  location: string
  salary_min?: number
  salary_max?: number
  salary_text?: string
  description: string
  job_type: string
  experience_level?: string
  skills: string[]
  apply_url: string
  posted_at: string
  is_featured: boolean
}

// ============ TOP 100 DESIGN KEYWORDS ============
// Used to identify legitimate design jobs
const DESIGN_KEYWORDS = [
  // Job Titles
  'designer', 'design', 'ux', 'ui', 'ui/ux', 'ux/ui', 'product designer',
  'graphic designer', 'visual designer', 'brand designer', 'web designer',
  'interaction designer', 'experience designer', 'creative director',
  'art director', 'design director', 'design lead', 'design manager',
  'motion designer', 'motion graphics', 'animator', 'illustrator',
  'icon designer', 'layout designer', 'print designer', 'packaging designer',
  'environmental designer', 'exhibition designer', 'signage designer',
  'presentation designer', 'email designer', 'marketing designer',
  'digital designer', 'multimedia designer', 'communication designer',

  // Design Specializations
  'user experience', 'user interface', 'human centered', 'human-centered',
  'service design', 'design thinking', 'design systems', 'design ops',
  'designops', 'design operations', 'content design', 'conversational design',
  'game designer', 'level designer', 'character designer', 'concept artist',
  'storyboard artist', 'visual development', 'texture artist',

  // Tools & Software
  'figma', 'sketch', 'adobe xd', 'invision', 'framer', 'principle',
  'origami', 'protopie', 'axure', 'balsamiq', 'marvel', 'zeplin',
  'photoshop', 'illustrator', 'indesign', 'after effects', 'premiere',
  'lightroom', 'xd', 'creative cloud', 'creative suite',
  'cinema 4d', 'blender', 'maya', '3ds max', 'zbrush',
  'procreate', 'affinity', 'canva', 'webflow', 'readymag',

  // Design Skills & Methods
  'wireframe', 'wireframing', 'prototype', 'prototyping', 'mockup',
  'user research', 'usability', 'usability testing', 'a/b testing',
  'user testing', 'heuristic', 'accessibility', 'wcag', 'ada compliant',
  'information architecture', 'ia', 'sitemap', 'user flow', 'user journey',
  'persona', 'empathy map', 'card sorting', 'tree testing',
  'typography', 'typographic', 'color theory', 'visual hierarchy',
  'gestalt', 'grid system', 'responsive design', 'mobile first',
  'atomic design', 'component library', 'style guide', 'brand guidelines',
  'moodboard', 'mood board', 'storyboard', 'artboard',

  // Design Outputs
  'branding', 'brand identity', 'logo', 'logotype', 'wordmark',
  'icon', 'iconography', 'illustration', 'infographic', 'data viz',
  'data visualization', 'dashboard design', 'app design', 'web design',
  'landing page', 'marketing collateral', 'social media design',
  'banner', 'advertisement', 'ad design', 'campaign design',
  'packaging', 'label design', 'book design', 'editorial design',
  'publication design', 'poster', 'flyer', 'brochure'
]

// ============ ENGINEERING/NON-DESIGN KEYWORDS TO EXCLUDE ============
// Jobs with these keywords in title are filtered out (unless also has design keywords)
const EXCLUDE_KEYWORDS = [
  // Engineering roles
  'software engineer', 'backend engineer', 'frontend engineer', 'full stack engineer',
  'fullstack engineer', 'devops engineer', 'sre', 'site reliability',
  'platform engineer', 'infrastructure engineer', 'data engineer',
  'machine learning engineer', 'ml engineer', 'ai engineer',
  'security engineer', 'network engineer', 'systems engineer',
  'qa engineer', 'test engineer', 'automation engineer',
  'embedded engineer', 'firmware engineer', 'hardware engineer',
  'cloud engineer', 'solutions engineer', 'sales engineer',

  // Developer roles
  'software developer', 'web developer', 'mobile developer',
  'ios developer', 'android developer', 'react developer',
  'node developer', 'python developer', 'java developer',
  'ruby developer', 'php developer', 'golang developer',
  '.net developer', 'c++ developer', 'rust developer',

  // Other technical roles
  'data scientist', 'data analyst', 'business analyst',
  'product manager', 'project manager', 'program manager',
  'scrum master', 'agile coach', 'technical writer',
  'system administrator', 'database administrator', 'dba',
  'architect', 'solutions architect', 'technical architect',

  // Operations & Support
  'customer support', 'customer success', 'account manager',
  'sales representative', 'business development', 'recruiter',
  'hr manager', 'people operations', 'office manager',
  'finance', 'accountant', 'bookkeeper', 'controller',
  'legal', 'paralegal', 'compliance', 'attorney',

  // Marketing (non-design)
  'seo specialist', 'sem specialist', 'ppc specialist',
  'growth hacker', 'performance marketing', 'email marketing',
  'content writer', 'copywriter', 'content strategist',
  'social media manager', 'community manager',

  // Specific exclusions
  'accelerator', 'manager api', 'api development',
  'reliability', 'instructor', 'teacher', 'professor',
  'researcher', 'scientist', 'analyst',

  // More exclusions
  'ai developer', 'growth marketer', 'content manager',
  'content specialist', 'social media specialist', 'cloud expert',
  'cloud-experte', 'aws', 'azure', 'gcp', 'kubernetes',
  'data ops', 'dataops', 'mlops', 'technical lead',
  'tech lead', 'engineering manager', 'cto', 'cio',
  'vp engineering', 'head of engineering', 'director of engineering',
  'marketing manager', 'marketing director', 'head of marketing',
  'operations manager', 'operations director', 'coo',
  'chief', 'officer', 'president', 'founder', 'co-founder',
  'consultant', 'advisor', 'strategist', 'coordinator',
  'assistant', 'intern', 'trainee', 'apprentice',
  'mentor', 'coach', 'trainer'
]

// ============ DESIGN TITLE PATTERNS ============
// Specific patterns that strongly indicate design roles
const DESIGN_TITLE_PATTERNS = [
  /\bdesigner\b/i,
  /\bux\b/i,
  /\bui\b/i,
  /\bux\/ui\b/i,
  /\bui\/ux\b/i,
  /\bart director\b/i,
  /\bcreative director\b/i,
  /\bdesign lead\b/i,
  /\bdesign manager\b/i,
  /\bhead of design\b/i,
  /\bvp design\b/i,
  /\billustrator\b/i,
  /\banimator\b/i,
  /\bmotion\s*(designer|graphics)\b/i,
  /\bbrand\s*(designer|design)\b/i,
  /\bvisual\s*(designer|design)\b/i,
  /\bgraphic\s*(designer|design)\b/i,
  /\bproduct\s*designer\b/i,
  /\bweb\s*designer\b/i,
  /\binteraction\s*designer\b/i,
  /\bexperience\s*designer\b/i,
]

function isDesignJob(title: string, tags?: string[], description?: string): boolean {
  const lowerTitle = title.toLowerCase()

  // First, check if title contains excluded keywords - immediate rejection
  const hasExcludedKeyword = EXCLUDE_KEYWORDS.some(keyword =>
    lowerTitle.includes(keyword.toLowerCase())
  )

  if (hasExcludedKeyword) {
    return false
  }

  // Check if title matches strong design patterns (most reliable)
  const matchesDesignPattern = DESIGN_TITLE_PATTERNS.some(pattern =>
    pattern.test(title)
  )

  if (matchesDesignPattern) {
    return true
  }

  // Check for core design job titles (must have one of these)
  const CORE_DESIGN_TITLES = [
    'designer', 'design lead', 'design manager', 'design director',
    'head of design', 'vp of design', 'creative director', 'art director',
    'illustrator', 'animator', 'motion graphics'
  ]

  const hasCoreDesignTitle = CORE_DESIGN_TITLES.some(keyword =>
    lowerTitle.includes(keyword)
  )

  if (hasCoreDesignTitle) {
    return true
  }

  // For jobs without clear design titles, check tags more strictly
  if (tags && tags.length > 0) {
    const lowerTags = tags.map(t => t.toLowerCase())

    // Must have 'design' or 'designer' in tags
    const hasDesignTag = lowerTags.some(tag =>
      tag === 'design' || tag === 'designer' || tag.includes('designer')
    )

    if (hasDesignTag) {
      // Also check for design tools
      const hasDesignTool = lowerTags.some(tag =>
        ['figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'xd', 'invision', 'framer'].includes(tag)
      )
      if (hasDesignTool) {
        return true
      }
    }
  }

  return false
}

// ============ SKILL FILTERING ============
// Filter out generic terms that aren't actual skills
const EXCLUDED_SKILL_TERMS = [
  'designer', 'design', 'digital nomad', 'lead', 'senior', 'junior',
  'entry', 'mid', 'technical', 'remote', 'hybrid', 'onsite', 'full-time',
  'part-time', 'contract', 'freelance', 'manager', 'director', 'intern',
  'system', 'mobile', 'marketing', 'content', 'engineering'
]

function filterSkills(skills: string[]): string[] {
  return skills.filter(skill => {
    const normalized = skill.trim().toLowerCase()
    return normalized && !EXCLUDED_SKILL_TERMS.includes(normalized)
  })
}

function extractSkills(text: string): string[] {
  const skillPatterns = [
    'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'After Effects',
    'InVision', 'Framer', 'Principle', 'Webflow', 'HTML', 'CSS', 'JavaScript',
    'React', 'Vue', 'Design Systems', 'Prototyping', 'User Research',
    'Wireframing', 'UI Design', 'UX Design', 'Visual Design', 'Brand Design',
    'Motion Design', 'Interaction Design', 'Typography', 'Accessibility'
  ]

  return skillPatterns.filter(skill =>
    text.toLowerCase().includes(skill.toLowerCase())
  )
}

function parseExperienceLevel(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('senior') || lower.includes('sr.') || lower.includes('lead')) return 'senior'
  if (lower.includes('junior') || lower.includes('jr.') || lower.includes('entry')) return 'entry'
  if (lower.includes('principal') || lower.includes('staff') || lower.includes('director')) return 'lead'
  return 'mid'
}

// ============ REMOTIVE API ============
// Docs: https://remotive.com/api/remote-jobs (no auth needed)

interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  company_logo: string
  category: string
  job_type: string
  publication_date: string
  candidate_required_location: string
  salary: string
  description: string
  tags: string[]
}

export async function fetchRemotiveJobs(): Promise<NormalizedJob[]> {
  try {
    // Fetch design category jobs
    const response = await fetch('https://remotive.com/api/remote-jobs?category=design')

    if (!response.ok) {
      console.error('Remotive API error:', response.status)
      return []
    }

    const data = await response.json()
    const jobs: RemotiveJob[] = data.jobs || []

    return jobs.map(job => ({
      id: `remotive-${job.id}`,
      source: 'remotive' as const,
      title: job.title,
      company: job.company_name,
      company_logo: job.company_logo || undefined,
      location: job.candidate_required_location || 'Remote',
      salary_text: job.salary || undefined,
      description: job.description,
      job_type: job.job_type?.toLowerCase() || 'full-time',
      experience_level: parseExperienceLevel(job.title),
      skills: filterSkills([...new Set([...job.tags, ...extractSkills(job.description)])]),
      apply_url: job.url,
      posted_at: job.publication_date,
      is_featured: false,
    }))
  } catch (error) {
    console.error('Remotive fetch error:', error)
    return []
  }
}

// ============ REMOTEOK API ============
// Docs: https://remoteok.com/api (no auth needed)

interface RemoteOKJob {
  id: string
  slug: string
  company: string
  company_logo: string
  position: string
  tags: string[]
  location: string
  salary_min: number
  salary_max: number
  date: string
  description: string
  url: string
}

export async function fetchRemoteOKJobs(): Promise<NormalizedJob[]> {
  try {
    const response = await fetch('https://remoteok.com/api?tag=design', {
      headers: {
        'User-Agent': 'RemoteDesigners.co Job Aggregator'
      }
    })

    if (!response.ok) {
      console.error('RemoteOK API error:', response.status)
      return []
    }

    const data = await response.json()
    // First item is legal notice, rest are jobs
    const jobs: RemoteOKJob[] = Array.isArray(data) ? data.slice(1) : []

    return jobs
      .filter(job => job.position && isDesignJob(job.position, job.tags))
      .map(job => ({
        id: `remoteok-${job.id}`,
        source: 'remoteok' as const,
        title: job.position,
        company: job.company,
        company_logo: job.company_logo || undefined,
        location: job.location || 'Remote',
        salary_min: job.salary_min || undefined,
        salary_max: job.salary_max || undefined,
        description: job.description || '',
        job_type: 'full-time',
        experience_level: parseExperienceLevel(job.position),
        skills: filterSkills([...new Set([...(job.tags || []), ...extractSkills(job.description || '')])]),
        apply_url: job.url || `https://remoteok.com/l/${job.slug}`,
        posted_at: job.date,
        is_featured: false,
      }))
  } catch (error) {
    console.error('RemoteOK fetch error:', error)
    return []
  }
}

// ============ ARBEITNOW API ============
// Docs: https://arbeitnow.com/api (no auth needed)

interface ArbeitnowJob {
  slug: string
  company_name: string
  title: string
  description: string
  remote: boolean
  url: string
  tags: string[]
  job_types: string[]
  location: string
  created_at: number
}

export async function fetchArbeitnowJobs(): Promise<NormalizedJob[]> {
  try {
    const response = await fetch('https://arbeitnow.com/api/job-board-api')

    if (!response.ok) {
      console.error('Arbeitnow API error:', response.status)
      return []
    }

    const data = await response.json()
    const jobs: ArbeitnowJob[] = data.data || []

    // Filter for remote design jobs
    return jobs
      .filter(job => job.remote && isDesignJob(job.title, job.tags))
      .map(job => ({
        id: `arbeitnow-${job.slug}`,
        source: 'arbeitnow' as const,
        title: job.title,
        company: job.company_name,
        company_logo: getClearbitLogoUrl(job.company_name),
        location: job.location || 'Remote (EU)',
        description: job.description,
        job_type: job.job_types?.[0]?.toLowerCase() || 'full-time',
        experience_level: parseExperienceLevel(job.title),
        skills: filterSkills([...new Set([...(job.tags || []), ...extractSkills(job.description)])]),
        apply_url: job.url,
        posted_at: new Date(job.created_at * 1000).toISOString(),
        is_featured: false,
      }))
  } catch (error) {
    console.error('Arbeitnow fetch error:', error)
    return []
  }
}

// ============ JSEARCH API (RapidAPI) ============
// Docs: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
// Free tier: 500 requests/month

interface JSearchJob {
  job_id: string
  employer_name: string
  employer_logo: string
  job_title: string
  job_description: string
  job_city: string
  job_country: string
  job_employment_type: string
  job_min_salary: number
  job_max_salary: number
  job_apply_link: string
  job_posted_at_datetime_utc: string
  job_required_skills: string[]
  job_is_remote: boolean
}

export async function fetchJSearchJobs(): Promise<NormalizedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY

  if (!apiKey) {
    console.log('JSearch: No RapidAPI key configured, skipping')
    return []
  }

  try {
    const queries = ['remote designer', 'remote UI UX designer', 'remote product designer']
    const allJobs: NormalizedJob[] = []

    for (const query of queries) {
      const response = await fetch(
        `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&remote_jobs_only=true`,
        {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
          }
        }
      )

      if (!response.ok) {
        console.error('JSearch API error:', response.status)
        continue
      }

      const data = await response.json()
      const jobs: JSearchJob[] = data.data || []

      const normalized = jobs
        .filter(job => job.job_is_remote && isDesignJob(job.job_title, job.job_required_skills))
        .map(job => ({
          id: `jsearch-${job.job_id}`,
          source: 'jsearch' as const,
          title: job.job_title,
          company: job.employer_name,
          company_logo: job.employer_logo || undefined,
          location: job.job_city ? `Remote (${job.job_city}, ${job.job_country})` : 'Remote',
          salary_min: job.job_min_salary || undefined,
          salary_max: job.job_max_salary || undefined,
          description: job.job_description,
          job_type: job.job_employment_type?.toLowerCase() || 'full-time',
          experience_level: parseExperienceLevel(job.job_title),
          skills: filterSkills([...new Set([...(job.job_required_skills || []), ...extractSkills(job.job_description)])]),
          apply_url: job.job_apply_link,
          posted_at: job.job_posted_at_datetime_utc,
          is_featured: false,
        }))

      allJobs.push(...normalized)
    }

    // Deduplicate by title + company
    const seen = new Set<string>()
    return allJobs.filter(job => {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  } catch (error) {
    console.error('JSearch fetch error:', error)
    return []
  }
}

// ============ HIMALAYAS API ============
// Docs: https://himalayas.app/api (no auth needed)

interface HimalayasJob {
  id: string
  title: string
  companyName: string
  companyLogo: string
  locationRestrictions: string[]
  categories: string[]
  pubDate: string
  link: string
  description: string
  seniority: string
}

export async function fetchHimalayasJobs(): Promise<NormalizedJob[]> {
  try {
    const response = await fetch('https://himalayas.app/jobs/api?category=design', {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      console.error('Himalayas API error:', response.status)
      return []
    }

    const data = await response.json()
    const jobs: HimalayasJob[] = data.jobs || []

    return jobs
      .filter(job => isDesignJob(job.title, job.categories))
      .map(job => ({
        id: `himalayas-${job.id}`,
        source: 'himalayas' as const,
        title: job.title,
        company: job.companyName,
        company_logo: job.companyLogo || undefined,
        location: job.locationRestrictions?.join(', ') || 'Remote',
        description: job.description || '',
        job_type: 'full-time',
        experience_level: job.seniority?.toLowerCase() || parseExperienceLevel(job.title),
        skills: filterSkills(extractSkills(job.description || '')),
        apply_url: job.link,
        posted_at: job.pubDate || new Date().toISOString(),
        is_featured: false,
      }))
  } catch (error) {
    console.error('Himalayas fetch error:', error)
    return []
  }
}

// ============ JOBICY API ============
// Docs: https://jobicy.com/api/v2/remote-jobs (no auth needed)

interface JobicyJob {
  id: number
  url: string
  jobTitle: string
  companyName: string
  companyLogo: string
  jobIndustry: string[]
  jobType: string[]
  jobGeo: string
  jobLevel: string
  jobExcerpt: string
  pubDate: string
}

export async function fetchJobicyJobs(): Promise<NormalizedJob[]> {
  try {
    const response = await fetch('https://jobicy.com/api/v2/remote-jobs?count=50&industry=design')

    if (!response.ok) {
      console.error('Jobicy API error:', response.status)
      return []
    }

    const data = await response.json()
    const jobs: JobicyJob[] = data.jobs || []

    return jobs
      .filter(job => isDesignJob(job.jobTitle, job.jobIndustry))
      .map(job => ({
        id: `jobicy-${job.id}`,
        source: 'jobicy' as const,
        title: job.jobTitle,
        company: job.companyName,
        company_logo: job.companyLogo || undefined,
        location: job.jobGeo || 'Remote',
        description: job.jobExcerpt || '',
        job_type: job.jobType?.[0]?.toLowerCase() || 'full-time',
        experience_level: job.jobLevel?.toLowerCase() || parseExperienceLevel(job.jobTitle),
        skills: filterSkills(extractSkills(job.jobExcerpt || '')),
        apply_url: job.url,
        posted_at: job.pubDate || new Date().toISOString(),
        is_featured: false,
      }))
  } catch (error) {
    console.error('Jobicy fetch error:', error)
    return []
  }
}

// ============ WEWORKREMOTELY RSS ============
// Design category RSS feed

function parseRSSDate(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function extractFromCDATA(text: string): string {
  return text.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').trim()
}

// Helper to convert HTML to structured text preserving sections
function htmlToStructuredText(html: string): string {
  return html
    // Decode unicode escapes
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\u0026/g, '&')
    // Convert headers to markdown-style
    .replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, '\n\n## $1\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    // Convert list items to bullets
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    // Convert paragraphs and divs to newlines
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    // Remove remaining tags
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

// ============ AUTHENTIC JOBS RSS ============
// Design & development focused job board

export async function fetchAuthenticJobs(): Promise<NormalizedJob[]> {
  try {
    const response = await fetch('https://authenticjobs.com/?feed=job_feed')

    if (!response.ok) {
      console.error('Authentic Jobs RSS error:', response.status)
      return []
    }

    const xml = await response.text()
    const items: NormalizedJob[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1]

      const getTag = (tag: string): string => {
        const tagMatch = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
        return tagMatch ? extractFromCDATA(tagMatch[1]) : ''
      }

      const title = getTag('title')
      const link = getTag('link')
      const pubDate = getTag('pubDate')
      const description = getTag('description')
      const guid = getTag('guid')

      // Extract company from title or description
      const companyMatch = title.match(/at\s+(.+)$/i) || description.match(/company:\s*([^<\n]+)/i)
      const company = companyMatch ? companyMatch[1].trim() : 'Unknown'
      const jobTitle = title.replace(/\s+at\s+.+$/i, '').trim()

      if (isDesignJob(jobTitle)) {
        items.push({
          id: `authentic-${Buffer.from(guid || link).toString('base64').slice(0, 20)}`,
          source: 'authenticjobs' as const,
          title: jobTitle,
          company: company,
          company_logo: company !== 'Unknown' ? getClearbitLogoUrl(company) : undefined,
          location: 'Remote',
          description: description.replace(/<[^>]*>/g, '').slice(0, 500),
          job_type: 'full-time',
          experience_level: parseExperienceLevel(jobTitle),
          skills: filterSkills(extractSkills(description)),
          apply_url: link,
          posted_at: parseRSSDate(pubDate),
          is_featured: false,
        })
      }
    }

    return items
  } catch (error) {
    console.error('Authentic Jobs fetch error:', error)
    return []
  }
}

// ============ WORKING NOMADS RSS ============
// Remote jobs focused board

export async function fetchWorkingNomadsJobs(): Promise<NormalizedJob[]> {
  try {
    const response = await fetch('https://www.workingnomads.com/jobs?category=design&format=rss')

    if (!response.ok) {
      console.error('Working Nomads RSS error:', response.status)
      return []
    }

    const xml = await response.text()
    const items: NormalizedJob[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1]

      const getTag = (tag: string): string => {
        const tagMatch = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
        return tagMatch ? extractFromCDATA(tagMatch[1]) : ''
      }

      const title = getTag('title')
      const link = getTag('link')
      const pubDate = getTag('pubDate')
      const description = getTag('description')
      const guid = getTag('guid')

      // Extract company - often in format "Job Title at Company"
      const atMatch = title.match(/^(.+?)\s+at\s+(.+)$/i)
      const jobTitle = atMatch ? atMatch[1].trim() : title
      const company = atMatch ? atMatch[2].trim() : 'Unknown'

      if (isDesignJob(jobTitle)) {
        items.push({
          id: `workingnomads-${Buffer.from(guid || link).toString('base64').slice(0, 20)}`,
          source: 'workingnomads' as const,
          title: jobTitle,
          company: company,
          company_logo: company !== 'Unknown' ? getClearbitLogoUrl(company) : undefined,
          location: 'Remote',
          description: description.replace(/<[^>]*>/g, '').slice(0, 500),
          job_type: 'full-time',
          experience_level: parseExperienceLevel(jobTitle),
          skills: filterSkills(extractSkills(description)),
          apply_url: link,
          posted_at: parseRSSDate(pubDate),
          is_featured: false,
        })
      }
    }

    return items
  } catch (error) {
    console.error('Working Nomads fetch error:', error)
    return []
  }
}

// ============ THE MUSE API ============
// Large job board with 400k+ jobs, free API

interface MuseJob {
  id: number
  name: string
  short_name: string
  contents: string
  type: string
  publication_date: string
  locations: { name: string }[]
  categories: { name: string }[]
  levels: { name: string; short_name: string }[]
  company: {
    id: number
    name: string
    short_name: string
  }
  refs: {
    landing_page: string
  }
}

export async function fetchMuseJobs(): Promise<NormalizedJob[]> {
  try {
    // Search for design-related jobs
    const designKeywords = ['designer', 'design', 'UX', 'UI', 'creative', 'graphic']
    const allJobs: NormalizedJob[] = []

    for (const keyword of designKeywords.slice(0, 3)) { // Limit to avoid rate limits
      const response = await fetch(
        `https://www.themuse.com/api/public/jobs?page=1&descending=true&query=${encodeURIComponent(keyword)}`
      )

      if (!response.ok) {
        console.error(`Muse API error for ${keyword}:`, response.status)
        continue
      }

      const data = await response.json()
      const jobs: MuseJob[] = data.results || []

      for (const job of jobs) {
        // Check if it's a design job
        const isDesign = isDesignJob(job.name) ||
          job.categories?.some(c => c.name.toLowerCase().includes('design')) ||
          job.contents?.toLowerCase().includes('design')

        if (isDesign) {
          const location = job.locations?.[0]?.name || 'Remote'
          const isRemote = location.toLowerCase().includes('remote') ||
            location.toLowerCase().includes('flexible') ||
            location.toLowerCase().includes('anywhere') ||
            location.toLowerCase().includes('work from home') ||
            job.locations?.some(l =>
              l.name.toLowerCase().includes('remote') ||
              l.name.toLowerCase().includes('flexible')
            )

          // Include remote jobs OR jobs from flexible locations
          if (isRemote || job.locations?.length === 0) {
            const companyName = job.company?.name || 'Unknown'
            allJobs.push({
              id: `muse-${job.id}`,
              source: 'themuse' as const,
              title: job.name,
              company: companyName,
              company_logo: companyName !== 'Unknown' ? getClearbitLogoUrl(companyName) : undefined,
              location: location,
              description: job.contents?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000) || '',
              job_type: job.type?.toLowerCase().replace(' ', '-') || 'full-time',
              experience_level: parseMuseLevel(job.levels?.[0]?.short_name),
              skills: filterSkills(extractSkills(job.contents || '')),
              apply_url: job.refs?.landing_page || `https://www.themuse.com/jobs/${job.company?.short_name}/${job.short_name}`,
              posted_at: job.publication_date || new Date().toISOString(),
              is_featured: false,
            })
          }
        }
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Deduplicate by job ID
    const seen = new Set<string>()
    return allJobs.filter(job => {
      if (seen.has(job.id)) return false
      seen.add(job.id)
      return true
    })
  } catch (error) {
    console.error('Muse fetch error:', error)
    return []
  }
}

function parseMuseLevel(level?: string): string {
  if (!level) return 'mid'
  const l = level.toLowerCase()
  if (l.includes('intern')) return 'entry'
  if (l.includes('entry') || l.includes('junior')) return 'junior'
  if (l.includes('mid')) return 'mid'
  if (l.includes('senior')) return 'senior'
  if (l.includes('manager') || l.includes('director')) return 'lead'
  if (l.includes('executive') || l.includes('vp')) return 'executive'
  return 'mid'
}

// ============ GREENHOUSE JOBS ============
// Direct scraping from top design companies' Greenhouse boards
// The Greenhouse URL IS the apply URL (form is embedded)

const GREENHOUSE_COMPANIES = [
  // Top Design Tools & Creative
  { name: 'Figma', slug: 'figma' },
  { name: 'Canva', slug: 'canva' },
  { name: 'Webflow', slug: 'webflow' },
  { name: 'Framer', slug: 'framer' },
  { name: 'InVision', slug: 'invision' },
  { name: 'Abstract', slug: 'abstract' },
  { name: 'Sketch', slug: 'sketch' },
  { name: 'Mural', slug: 'mural' },

  // Big Tech
  { name: 'Stripe', slug: 'stripe' },
  { name: 'Airbnb', slug: 'airbnb' },
  { name: 'Spotify', slug: 'spotify' },
  { name: 'Dropbox', slug: 'dropbox' },
  { name: 'Pinterest', slug: 'pinterest' },
  { name: 'Snap', slug: 'snap' },
  { name: 'Reddit', slug: 'reddit' },
  { name: 'Lyft', slug: 'lyft' },
  { name: 'Uber', slug: 'uber' },
  { name: 'Twitter', slug: 'twitter' },
  { name: 'Square', slug: 'squareup' },
  { name: 'Block', slug: 'block' },
  { name: 'Cash App', slug: 'cashapp' },

  // Productivity & SaaS
  { name: 'Notion', slug: 'notion' },
  { name: 'Linear', slug: 'linear06' },
  { name: 'Vercel', slug: 'vercel' },
  { name: 'Supabase', slug: 'supabase' },
  { name: 'Retool', slug: 'retool' },
  { name: 'Coda', slug: 'coda' },
  { name: 'Asana', slug: 'asana' },
  { name: 'Monday', slug: 'mondaycom' },
  { name: 'ClickUp', slug: 'clickup' },
  { name: 'Calendly', slug: 'calendly' },
  { name: 'Loom', slug: 'loom' },
  { name: 'Typeform', slug: 'typeform' },
  { name: 'Grammarly', slug: 'grammarly' },
  { name: '1Password', slug: '1password' },
  { name: 'Dashlane', slug: 'dashlane' },

  // E-commerce & Delivery
  { name: 'Shopify', slug: 'shopify' },
  { name: 'Instacart', slug: 'instacart' },
  { name: 'DoorDash', slug: 'doordash' },
  { name: 'Etsy', slug: 'etsy' },
  { name: 'Faire', slug: 'faire' },
  { name: 'Flexport', slug: 'flexport' },

  // Fintech
  { name: 'Coinbase', slug: 'coinbase' },
  { name: 'Plaid', slug: 'plaid' },
  { name: 'Ramp', slug: 'ramp' },
  { name: 'Brex', slug: 'brex' },
  { name: 'Robinhood', slug: 'robinhood' },
  { name: 'Affirm', slug: 'affirm' },
  { name: 'Chime', slug: 'chime' },
  { name: 'Mercury', slug: 'mercury' },
  { name: 'Wise', slug: 'wise' },
  { name: 'Revolut', slug: 'revolut' },
  { name: 'Nubank', slug: 'nubank' },
  { name: 'Klarna', slug: 'klarna' },

  // HR & Recruiting
  { name: 'Rippling', slug: 'rippling' },
  { name: 'Gusto', slug: 'gusto' },
  { name: 'Deel', slug: 'deel' },
  { name: 'Remote', slug: 'remote' },
  { name: 'Lattice', slug: 'lattice' },
  { name: 'Culture Amp', slug: 'cultureamp' },

  // Developer Tools
  { name: 'GitLab', slug: 'gitlab' },
  { name: 'GitHub', slug: 'github' },
  { name: 'Datadog', slug: 'datadog' },
  { name: 'HashiCorp', slug: 'hashicorp' },
  { name: 'Grafana', slug: 'grafana' },
  { name: 'PlanetScale', slug: 'planetscale' },
  { name: 'Cockroach Labs', slug: 'cockroachlabs' },
  { name: 'Temporal', slug: 'temporal' },

  // AI & ML
  { name: 'OpenAI', slug: 'openai' },
  { name: 'Anthropic', slug: 'anthropic' },
  { name: 'Hugging Face', slug: 'huggingface' },
  { name: 'Runway', slug: 'runwayml' },
  { name: 'Jasper', slug: 'jasper' },
  { name: 'Copy.ai', slug: 'copyai' },
  { name: 'Midjourney', slug: 'midjourney' },

  // Communication
  { name: 'Intercom', slug: 'intercom' },
  { name: 'Zendesk', slug: 'zendesk' },
  { name: 'HubSpot', slug: 'hubspot' },
  { name: 'Twilio', slug: 'twilio' },
  { name: 'MessageBird', slug: 'messagebird' },

  // Health & Wellness
  { name: 'Headspace', slug: 'headspace' },
  { name: 'Peloton', slug: 'peloton' },
  { name: 'Noom', slug: 'noom' },
  { name: 'Ro', slug: 'ro' },
  { name: 'Hims & Hers', slug: 'himshers' },
  { name: 'One Medical', slug: 'onemedical' },

  // Gaming & Entertainment
  { name: 'Roblox', slug: 'roblox' },
  { name: 'Epic Games', slug: 'epicgames' },
  { name: 'Niantic', slug: 'niantic' },
  { name: 'Unity', slug: 'unity' },
]

// Helper to get Clearbit logo URL
function getClearbitLogoUrl(companyName: string): string {
  const cleanName = companyName.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
  return `https://logo.clearbit.com/${cleanName}.com`
}

export async function fetchGreenhouseJobs(): Promise<NormalizedJob[]> {
  console.log('Fetching jobs from Greenhouse boards...')
  const allJobs: NormalizedJob[] = []

  for (const company of GREENHOUSE_COMPANIES) {
    try {
      const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs?content=true`)
      if (!response.ok) continue

      const data = await response.json()
      const jobs = data.jobs || []

      // Get company logo URL using Clearbit
      const companyLogo = getClearbitLogoUrl(company.name)

      for (const job of jobs) {
        const title = job.title || ''
        // Only include design-related jobs
        if (!isDesignJob(title)) continue

        // Extract location
        let location = 'Remote'
        if (job.location?.name) {
          location = job.location.name
        }

        // The apply URL is the Greenhouse job page (form is embedded)
        const applyUrl = job.absolute_url

        allJobs.push({
          id: `gh-${company.slug}-${job.id}`,
          source: 'greenhouse' as any,
          title: title,
          company: company.name,
          company_logo: companyLogo,
          location: location,
          description: job.content ? htmlToStructuredText(job.content) : '',
          job_type: 'full-time',
          experience_level: parseExperienceLevel(title),
          skills: filterSkills(extractSkills(job.content || '')),
          apply_url: applyUrl,  // Direct apply URL!
          posted_at: job.updated_at || new Date().toISOString(),
          is_featured: false,
        })
      }
    } catch (error) {
      console.error(`Greenhouse ${company.name} error:`, error)
    }
  }

  console.log(`Greenhouse: Found ${allJobs.length} design jobs`)
  return allJobs
}

// ============ LEVER JOBS ============
// Direct scraping from top design companies' Lever boards
// The Lever URL IS the apply URL (form is embedded)

const LEVER_COMPANIES = [
  // Big Tech & Streaming
  { name: 'Netflix', slug: 'netflix' },
  { name: 'Twitch', slug: 'twitch' },
  { name: 'Discord', slug: 'discord' },
  { name: 'Palantir', slug: 'palantir' },
  { name: 'Cloudflare', slug: 'cloudflare' },
  { name: 'Netlify', slug: 'netlify' },
  { name: 'Fastly', slug: 'fastly' },

  // Productivity & Collaboration
  { name: 'Miro', slug: 'miro' },
  { name: 'Airtable', slug: 'airtable' },
  { name: 'Zapier', slug: 'zapier' },
  { name: 'Superhuman', slug: 'superhuman' },
  { name: 'Front', slug: 'frontapp' },
  { name: 'Pitch', slug: 'pitch' },
  { name: 'Descript', slug: 'descript' },
  { name: 'Loom', slug: 'useloom' },
  { name: 'Figma', slug: 'figma' },
  { name: 'Lucid', slug: 'lucid' },
  { name: 'Slite', slug: 'slite' },

  // Developer Tools
  { name: 'Liveblocks', slug: 'liveblocks' },
  { name: 'Clerk', slug: 'clerk' },
  { name: 'Railway', slug: 'railway' },
  { name: 'Render', slug: 'render' },
  { name: 'Fly.io', slug: 'flyio' },
  { name: 'Sentry', slug: 'sentry' },
  { name: 'LaunchDarkly', slug: 'launchdarkly' },
  { name: 'CircleCI', slug: 'circleci' },
  { name: 'Postman', slug: 'postman' },

  // Health & Wellness
  { name: 'Calm', slug: 'calm' },
  { name: 'Headspace', slug: 'headspace' },
  { name: 'Teladoc', slug: 'teladoc' },
  { name: 'Tempus', slug: 'tempus' },
  { name: 'Oscar Health', slug: 'oscar' },
  { name: 'Devoted Health', slug: 'devoted' },

  // Fintech
  { name: 'Carta', slug: 'carta' },
  { name: 'AngelList', slug: 'angellist' },
  { name: 'Pipe', slug: 'pipe' },
  { name: 'Bolt', slug: 'bolt' },
  { name: 'Marqeta', slug: 'marqeta' },
  { name: 'Melio', slug: 'melio' },
  { name: 'Divvy', slug: 'divvy' },

  // E-commerce & Marketplaces
  { name: 'Depop', slug: 'depop' },
  { name: 'Whatnot', slug: 'whatnot' },
  { name: 'Goat', slug: 'goat' },
  { name: 'StockX', slug: 'stockx' },
  { name: 'Poshmark', slug: 'poshmark' },
  { name: 'Mercari', slug: 'mercari' },

  // AI & ML
  { name: 'Scale AI', slug: 'scaleai' },
  { name: 'Weights & Biases', slug: 'wandb' },
  { name: 'Cohere', slug: 'cohere' },
  { name: 'Adept', slug: 'adept' },
  { name: 'Character.AI', slug: 'character' },
  { name: 'Stability AI', slug: 'stability' },
  { name: 'Inflection', slug: 'inflection' },

  // Security
  { name: 'Snyk', slug: 'snyk' },
  { name: 'Lacework', slug: 'lacework' },
  { name: 'Orca Security', slug: 'orca' },
  { name: 'Wiz', slug: 'wiz' },

  // Media & Content
  { name: 'Substack', slug: 'substack' },
  { name: 'Patreon', slug: 'patreon' },
  { name: 'Medium', slug: 'medium' },
  { name: 'Spotify', slug: 'spotify' },
  { name: 'SoundCloud', slug: 'soundcloud' },

  // Real Estate & PropTech
  { name: 'Opendoor', slug: 'opendoor' },
  { name: 'Zillow', slug: 'zillow' },
  { name: 'Compass', slug: 'compass' },

  // Travel & Hospitality
  { name: 'Hopper', slug: 'hopper' },
  { name: 'Getaround', slug: 'getaround' },
  { name: 'Sonder', slug: 'sonder' },
]

export async function fetchLeverJobs(): Promise<NormalizedJob[]> {
  console.log('Fetching jobs from Lever boards...')
  const allJobs: NormalizedJob[] = []

  for (const company of LEVER_COMPANIES) {
    try {
      const response = await fetch(`https://api.lever.co/v0/postings/${company.slug}?mode=json`)
      if (!response.ok) continue

      const jobs = await response.json()
      if (!Array.isArray(jobs)) continue

      // Get company logo URL using Clearbit
      const companyLogo = getClearbitLogoUrl(company.name)

      for (const job of jobs) {
        const title = job.text || ''
        // Only include design-related jobs
        if (!isDesignJob(title)) continue

        // Extract location
        let location = 'Remote'
        if (job.categories?.location) {
          location = job.categories.location
        }

        // The apply URL is the Lever job page
        const applyUrl = job.hostedUrl || job.applyUrl

        // Get description from lists
        let description = ''
        if (job.descriptionPlain) {
          description = job.descriptionPlain
        } else if (job.lists) {
          description = job.lists.map((list: any) =>
            `**${list.text}**\n${list.content}`
          ).join('\n\n')
        }

        allJobs.push({
          id: `lever-${company.slug}-${job.id}`,
          source: 'lever' as any,
          title: title,
          company: company.name,
          company_logo: companyLogo,
          location: location,
          description: htmlToStructuredText(description),
          job_type: job.categories?.commitment?.toLowerCase() || 'full-time',
          experience_level: parseExperienceLevel(title),
          skills: filterSkills(extractSkills(description)),
          apply_url: applyUrl,  // Direct apply URL!
          posted_at: new Date(job.createdAt).toISOString(),
          is_featured: false,
        })
      }
    } catch (error) {
      console.error(`Lever ${company.name} error:`, error)
    }
  }

  console.log(`Lever: Found ${allJobs.length} design jobs`)
  return allJobs
}

// ============ ASHBY JOBS ============
// Direct scraping from companies using Ashby ATS
// The Ashby URL IS the apply URL (form is embedded)

const ASHBY_COMPANIES = [
  // AI & ML
  { name: 'OpenAI', slug: 'openai' },
  { name: 'Anthropic', slug: 'anthropic' },
  { name: 'Cohere', slug: 'cohere' },
  { name: 'Perplexity', slug: 'perplexity' },
  { name: 'Mistral AI', slug: 'mistralai' },
  { name: 'Adept', slug: 'adept' },
  { name: 'Glean', slug: 'glean' },
  { name: 'Pinecone', slug: 'pinecone' },
  { name: 'Writer', slug: 'writer' },

  // Developer Tools
  { name: 'Vercel', slug: 'vercel' },
  { name: 'Supabase', slug: 'supabase' },
  { name: 'Railway', slug: 'railway' },
  { name: 'Render', slug: 'render' },
  { name: 'Neon', slug: 'neon' },
  { name: 'Resend', slug: 'resend' },
  { name: 'Axiom', slug: 'axiom' },
  { name: 'Prisma', slug: 'prisma' },
  { name: 'Trigger.dev', slug: 'triggerdev' },
  { name: 'Inngest', slug: 'inngest' },
  { name: 'Tinybird', slug: 'tinybird' },

  // Fintech
  { name: 'Mercury', slug: 'mercury' },
  { name: 'Ramp', slug: 'ramp' },
  { name: 'Brex', slug: 'brex' },
  { name: 'Vanta', slug: 'vanta' },
  { name: 'Anduril', slug: 'anduril' },
  { name: 'Atomic', slug: 'atomic' },

  // Productivity
  { name: 'Linear', slug: 'linear' },
  { name: 'Notion', slug: 'notion' },
  { name: 'Coda', slug: 'coda' },
  { name: 'Loom', slug: 'loom' },
  { name: 'Grain', slug: 'grain' },
  { name: 'Pitch', slug: 'pitch' },

  // Security & Infra
  { name: 'Tailscale', slug: 'tailscale' },
  { name: 'Teleport', slug: 'teleport' },
  { name: 'CrowdStrike', slug: 'crowdstrike' },
  { name: 'Drata', slug: 'drata' },
  { name: 'Vanta', slug: 'vanta' },

  // Other Hot Startups
  { name: 'Retool', slug: 'retool' },
  { name: 'Figma', slug: 'figma' },
  { name: 'Webflow', slug: 'webflow' },
  { name: 'Cal.com', slug: 'calcom' },
  { name: 'PostHog', slug: 'posthog' },
  { name: 'Raycast', slug: 'raycast' },
  { name: 'Arc Browser', slug: 'thebrowsercompany' },
  { name: 'Warp', slug: 'warp' },
  { name: 'Replit', slug: 'replit' },
  { name: 'Sourcegraph', slug: 'sourcegraph' },
]

export async function fetchAshbyJobs(): Promise<NormalizedJob[]> {
  console.log('Fetching jobs from Ashby boards...')
  const allJobs: NormalizedJob[] = []

  for (const company of ASHBY_COMPANIES) {
    try {
      const response = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${company.slug}`)
      if (!response.ok) continue

      const data = await response.json()
      const jobs = data.jobs || []

      // Get company logo URL using Clearbit
      const companyLogo = getClearbitLogoUrl(company.name)

      for (const job of jobs) {
        const title = job.title || ''
        // Only include design-related jobs
        if (!isDesignJob(title)) continue

        // Extract location
        let location = 'Remote'
        if (job.location) {
          location = job.location
        } else if (job.locationName) {
          location = job.locationName
        }

        // The apply URL is the Ashby job page
        const applyUrl = job.jobUrl || `https://jobs.ashbyhq.com/${company.slug}/${job.id}`

        allJobs.push({
          id: `ashby-${company.slug}-${job.id}`,
          source: 'ashby' as const,
          title: title,
          company: company.name,
          company_logo: companyLogo,
          location: location,
          description: job.descriptionPlain || job.description || '',
          job_type: job.employmentType?.toLowerCase() || 'full-time',
          experience_level: parseExperienceLevel(title),
          skills: filterSkills(extractSkills(job.descriptionPlain || job.description || '')),
          apply_url: applyUrl,  // Direct apply URL!
          posted_at: job.publishedAt || new Date().toISOString(),
          is_featured: false,
        })
      }
    } catch (error) {
      // Silently skip companies that don't have Ashby boards
    }
  }

  console.log(`Ashby: Found ${allJobs.length} design jobs`)
  return allJobs
}

// ============ ADZUNA API ============
// Large job aggregator with millions of jobs
// Docs: https://developer.adzuna.com/
// Requires free API key (ADZUNA_APP_ID & ADZUNA_API_KEY env vars)

interface AdzunaJob {
  id: string
  title: string
  description: string
  redirect_url: string
  created: string
  company: {
    display_name: string
  }
  location: {
    display_name: string
    area: string[]
  }
  salary_min?: number
  salary_max?: number
  contract_type?: string
  category: {
    label: string
    tag: string
  }
}

export async function fetchAdzunaJobs(): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID
  const apiKey = process.env.ADZUNA_API_KEY

  if (!appId || !apiKey) {
    console.log('Adzuna: No API credentials configured (ADZUNA_APP_ID, ADZUNA_API_KEY), skipping')
    return []
  }

  console.log('Fetching jobs from Adzuna...')
  const allJobs: NormalizedJob[] = []

  // Search for design jobs in US and UK (remote-friendly markets)
  const queries = ['designer', 'ux designer', 'ui designer', 'product designer', 'graphic designer']
  const countries = ['us', 'gb'] // US and UK

  for (const country of countries) {
    for (const query of queries) {
      try {
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${apiKey}&results_per_page=50&what=${encodeURIComponent(query)}&what_or=${encodeURIComponent('remote design figma')}&content-type=application/json`

        const response = await fetch(url)
        if (!response.ok) {
          console.error(`Adzuna API error for ${country}/${query}:`, response.status)
          continue
        }

        const data = await response.json()
        const jobs: AdzunaJob[] = data.results || []

        for (const job of jobs) {
          // Filter for design jobs
          if (!isDesignJob(job.title)) continue

          // Check if likely remote
          const locationLower = (job.location?.display_name || '').toLowerCase()
          const descLower = job.description.toLowerCase()
          const isRemote = locationLower.includes('remote') ||
            descLower.includes('remote') ||
            descLower.includes('work from home') ||
            descLower.includes('work from anywhere')

          // Skip if not remote (we want remote jobs)
          if (!isRemote) continue

          const companyName = job.company?.display_name || 'Unknown'
          allJobs.push({
            id: `adzuna-${job.id}`,
            source: 'adzuna' as const,
            title: job.title,
            company: companyName,
            company_logo: companyName !== 'Unknown' ? getClearbitLogoUrl(companyName) : undefined,
            location: job.location?.display_name || 'Remote',
            description: job.description,
            job_type: job.contract_type?.toLowerCase() || 'full-time',
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            experience_level: parseExperienceLevel(job.title),
            skills: filterSkills(extractSkills(job.description)),
            apply_url: job.redirect_url,  // Direct apply URL!
            posted_at: job.created || new Date().toISOString(),
            is_featured: false,
          })
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Adzuna fetch error for ${country}/${query}:`, error)
      }
    }
  }

  // Deduplicate by job ID
  const seen = new Set<string>()
  const deduped = allJobs.filter(job => {
    if (seen.has(job.id)) return false
    seen.add(job.id)
    return true
  })

  console.log(`Adzuna: Found ${deduped.length} remote design jobs`)
  return deduped
}

// ============ GLINTS API (Southeast Asia) ============
// Major job board in SEA (Singapore, Indonesia, Malaysia, Vietnam, Taiwan)
// Public API endpoint for job listings

interface GlintsJob {
  id: string
  title: string
  companyName: string
  companyLogo?: string
  city?: { name: string }
  country?: { name: string }
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  description: string
  createdAt: string
  links?: { web: string }
}

export async function fetchGlintsJobs(): Promise<NormalizedJob[]> {
  console.log('Fetching jobs from Glints...')
  const allJobs: NormalizedJob[] = []

  try {
    // Search for design-related jobs
    const searchQueries = ['designer', 'ux', 'ui', 'graphic design', 'product design']

    for (const query of searchQueries) {
      const response = await fetch(
        `https://glints.com/api/jobs?keyword=${encodeURIComponent(query)}&limit=50&offset=0&includeExternalJobs=false`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'RemoteDesigners.co Job Aggregator'
          }
        }
      )

      if (!response.ok) {
        console.error(`Glints API error for ${query}:`, response.status)
        continue
      }

      const data = await response.json()
      const jobs: GlintsJob[] = data.data || data.jobs || []

      for (const job of jobs) {
        const title = job.title || ''
        if (!isDesignJob(title)) continue

        // Build location string
        const locationParts = []
        if (job.city?.name) locationParts.push(job.city.name)
        if (job.country?.name) locationParts.push(job.country.name)
        const location = locationParts.length > 0 ? locationParts.join(', ') : 'Southeast Asia'

        // Check if remote
        const isRemote = title.toLowerCase().includes('remote') ||
          job.description?.toLowerCase().includes('remote') ||
          location.toLowerCase().includes('remote')

        // Build salary text
        let salaryText: string | undefined
        if (job.salaryMin && job.salaryMax) {
          const currency = job.salaryCurrency || 'SGD'
          salaryText = `${currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
        }

        allJobs.push({
          id: `glints-${job.id}`,
          source: 'glints' as const,
          title: title,
          company: job.companyName || 'Unknown',
          company_logo: job.companyLogo || getClearbitLogoUrl(job.companyName || ''),
          location: isRemote ? `Remote (${location})` : location,
          salary_text: salaryText,
          salary_min: job.salaryMin,
          salary_max: job.salaryMax,
          description: job.description || '',
          job_type: 'full-time',
          experience_level: parseExperienceLevel(title),
          skills: filterSkills(extractSkills(job.description || '')),
          apply_url: job.links?.web || `https://glints.com/job/${job.id}`,
          posted_at: job.createdAt || new Date().toISOString(),
          is_featured: false,
        })
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  } catch (error) {
    console.error('Glints fetch error:', error)
  }

  // Deduplicate
  const seen = new Set<string>()
  const deduped = allJobs.filter(job => {
    if (seen.has(job.id)) return false
    seen.add(job.id)
    return true
  })

  console.log(`Glints: Found ${deduped.length} design jobs`)
  return deduped
}

// ============ TOKYODEV RSS (Japan Remote Jobs) ============
// English-friendly remote jobs in Japan

export async function fetchTokyoDevJobs(): Promise<NormalizedJob[]> {
  console.log('Fetching jobs from TokyoDev...')

  try {
    const response = await fetch('https://www.tokyodev.com/jobs.rss', {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'RemoteDesigners.co Job Aggregator'
      }
    })

    if (!response.ok) {
      console.error('TokyoDev RSS error:', response.status)
      return []
    }

    const xml = await response.text()
    const items: NormalizedJob[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1]

      const getTag = (tag: string): string => {
        const tagMatch = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
        return tagMatch ? extractFromCDATA(tagMatch[1]) : ''
      }

      const title = getTag('title')
      const link = getTag('link')
      const pubDate = getTag('pubDate')
      const description = getTag('description')
      const guid = getTag('guid')

      // TokyoDev job titles are often "Job Title at Company"
      const atMatch = title.match(/^(.+?)\s+at\s+(.+)$/i)
      const jobTitle = atMatch ? atMatch[1].trim() : title
      const company = atMatch ? atMatch[2].trim() : 'Unknown'

      // Only include design jobs
      if (!isDesignJob(jobTitle)) continue

      items.push({
        id: `tokyodev-${Buffer.from(guid || link).toString('base64').slice(0, 20)}`,
        source: 'tokyodev' as const,
        title: jobTitle,
        company: company,
        company_logo: company !== 'Unknown' ? getClearbitLogoUrl(company) : undefined,
        location: 'Remote (Japan)',
        description: description.replace(/<[^>]*>/g, '').slice(0, 2000),
        job_type: 'full-time',
        experience_level: parseExperienceLevel(jobTitle),
        skills: filterSkills(extractSkills(description)),
        apply_url: link,
        posted_at: parseRSSDate(pubDate),
        is_featured: false,
      })
    }

    console.log(`TokyoDev: Found ${items.length} design jobs`)
    return items
  } catch (error) {
    console.error('TokyoDev fetch error:', error)
    return []
  }
}

// ============ NODEFLAIR API (Singapore Tech Jobs) ============
// Major tech job board in Singapore

interface NodeFlairJob {
  id: string
  title: string
  company: {
    name: string
    logo?: string
  }
  location?: string
  salary?: {
    min?: number
    max?: number
    currency?: string
  }
  description: string
  createdAt: string
  url?: string
  jobType?: string
}

export async function fetchNodeFlairJobs(): Promise<NormalizedJob[]> {
  console.log('Fetching jobs from NodeFlair...')
  const allJobs: NormalizedJob[] = []

  try {
    // NodeFlair has a public jobs page we can scrape via their API
    const searchQueries = ['designer', 'ux', 'ui', 'product design']

    for (const query of searchQueries) {
      const response = await fetch(
        `https://nodeflair.com/api/v2/jobs?query=${encodeURIComponent(query)}&page=1&sort_by=date`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'RemoteDesigners.co Job Aggregator'
          }
        }
      )

      if (!response.ok) {
        console.error(`NodeFlair API error for ${query}:`, response.status)
        continue
      }

      const data = await response.json()
      const jobs: NodeFlairJob[] = data.jobs || data.data || []

      for (const job of jobs) {
        const title = job.title || ''
        if (!isDesignJob(title)) continue

        const companyName = job.company?.name || 'Unknown'
        const location = job.location || 'Singapore'

        // Check if remote
        const isRemote = location.toLowerCase().includes('remote') ||
          title.toLowerCase().includes('remote')

        // Build salary text
        let salaryText: string | undefined
        if (job.salary?.min && job.salary?.max) {
          const currency = job.salary.currency || 'SGD'
          salaryText = `${currency} ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`
        }

        allJobs.push({
          id: `nodeflair-${job.id}`,
          source: 'nodeflairsg' as const,
          title: title,
          company: companyName,
          company_logo: job.company?.logo || getClearbitLogoUrl(companyName),
          location: isRemote ? `Remote (${location})` : location,
          salary_text: salaryText,
          salary_min: job.salary?.min,
          salary_max: job.salary?.max,
          description: job.description || '',
          job_type: job.jobType?.toLowerCase() || 'full-time',
          experience_level: parseExperienceLevel(title),
          skills: filterSkills(extractSkills(job.description || '')),
          apply_url: job.url || `https://nodeflair.com/jobs/${job.id}`,
          posted_at: job.createdAt || new Date().toISOString(),
          is_featured: false,
        })
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  } catch (error) {
    console.error('NodeFlair fetch error:', error)
  }

  // Deduplicate
  const seen = new Set<string>()
  const deduped = allJobs.filter(job => {
    if (seen.has(job.id)) return false
    seen.add(job.id)
    return true
  })

  console.log(`NodeFlair: Found ${deduped.length} design jobs`)
  return deduped
}

// ============ FETCH ALL JOBS ============

export async function fetchAllJobs(): Promise<NormalizedJob[]> {
  console.log('Fetching jobs from all sources...')

  // Fetch from all sources in parallel
  const results = await Promise.allSettled([
    fetchRemotiveJobs(),
    fetchRemoteOKJobs(),
    fetchArbeitnowJobs(),
    fetchJSearchJobs(),
    fetchHimalayasJobs(),
    fetchJobicyJobs(),
    fetchGreenhouseJobs(),
    fetchLeverJobs(),
    fetchAshbyJobs(),
    fetchAdzunaJobs(),
    fetchAuthenticJobs(),
    fetchWorkingNomadsJobs(),
    fetchMuseJobs(),
    // Asia job boards
    fetchGlintsJobs(),
    fetchTokyoDevJobs(),
    fetchNodeFlairJobs(),
  ])

  // Extract successful results
  const [
    remotiveResult,
    remoteokResult,
    arbeitnowResult,
    jsearchResult,
    himalayasResult,
    jobicyResult,
    greenhouseResult,
    leverResult,
    ashbyResult,
    adzunaResult,
    authenticResult,
    nomadsResult,
    museResult,
    // Asia
    glintsResult,
    tokyodevResult,
    nodeflairResult,
  ] = results

  const remotiveJobs = remotiveResult.status === 'fulfilled' ? remotiveResult.value : []
  const remoteokJobs = remoteokResult.status === 'fulfilled' ? remoteokResult.value : []
  const arbeitnowJobs = arbeitnowResult.status === 'fulfilled' ? arbeitnowResult.value : []
  const jsearchJobs = jsearchResult.status === 'fulfilled' ? jsearchResult.value : []
  const himalayasJobs = himalayasResult.status === 'fulfilled' ? himalayasResult.value : []
  const jobicyJobs = jobicyResult.status === 'fulfilled' ? jobicyResult.value : []
  const greenhouseJobs = greenhouseResult.status === 'fulfilled' ? greenhouseResult.value : []
  const leverJobs = leverResult.status === 'fulfilled' ? leverResult.value : []
  const ashbyJobs = ashbyResult.status === 'fulfilled' ? ashbyResult.value : []
  const adzunaJobs = adzunaResult.status === 'fulfilled' ? adzunaResult.value : []
  const authenticJobs = authenticResult.status === 'fulfilled' ? authenticResult.value : []
  const nomadsJobs = nomadsResult.status === 'fulfilled' ? nomadsResult.value : []
  const museJobs = museResult.status === 'fulfilled' ? museResult.value : []
  // Asia
  const glintsJobs = glintsResult.status === 'fulfilled' ? glintsResult.value : []
  const tokyodevJobs = tokyodevResult.status === 'fulfilled' ? tokyodevResult.value : []
  const nodeflairJobs = nodeflairResult.status === 'fulfilled' ? nodeflairResult.value : []

  console.log(`Fetched: Remotive(${remotiveJobs.length}), RemoteOK(${remoteokJobs.length}), Arbeitnow(${arbeitnowJobs.length}), JSearch(${jsearchJobs.length}), Himalayas(${himalayasJobs.length}), Jobicy(${jobicyJobs.length}), Greenhouse(${greenhouseJobs.length}), Lever(${leverJobs.length}), Ashby(${ashbyJobs.length}), Adzuna(${adzunaJobs.length}), Authentic(${authenticJobs.length}), Nomads(${nomadsJobs.length}), Muse(${museJobs.length}), Glints(${glintsJobs.length}), TokyoDev(${tokyodevJobs.length}), NodeFlair(${nodeflairJobs.length})`)

  // Combine all jobs
  const allJobs = [
    ...remotiveJobs,
    ...remoteokJobs,
    ...arbeitnowJobs,
    ...jsearchJobs,
    ...himalayasJobs,
    ...jobicyJobs,
    ...greenhouseJobs,
    ...leverJobs,
    ...ashbyJobs,
    ...adzunaJobs,
    ...authenticJobs,
    ...nomadsJobs,
    ...museJobs,
    // Asia
    ...glintsJobs,
    ...tokyodevJobs,
    ...nodeflairJobs,
  ]

  // Sort by posted date (newest first)
  allJobs.sort((a, b) => {
    const dateA = new Date(a.posted_at).getTime()
    const dateB = new Date(b.posted_at).getTime()
    return dateB - dateA
  })

  // Deduplicate by similar title + company
  const seen = new Set<string>()
  const deduped = allJobs.filter(job => {
    const key = `${job.title.toLowerCase().slice(0, 30)}-${job.company.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`Total unique jobs: ${deduped.length}`)
  return deduped
}
