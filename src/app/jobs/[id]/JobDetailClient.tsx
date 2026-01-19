'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { SocialProof, RainbowButton } from '@/components/ui'
import { useSignupModal } from '@/context/signup-modal-context'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { isCompMember } from '@/lib/admin'

interface Job {
  id: string
  title: string
  company: string
  company_logo?: string
  location: string
  salary_min?: number
  salary_max?: number
  salary_text?: string
  description?: string
  job_type: string
  experience_level?: string
  skills?: string[]
  apply_url: string
  source: string
  external_id?: string
  posted_at: string
  is_featured: boolean
  is_active: boolean
  is_sticky?: boolean
  sticky_until?: string
  is_rainbow?: boolean
}

const getInitials = (company: string) => company.substring(0, 2).toUpperCase()

// Generate company logo URL using Clearbit
const getCompanyLogoUrl = (company: string): string => {
  const cleanName = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
  return `https://logo.clearbit.com/${cleanName}.com`
}

// Google Favicon fallback
const getGoogleFaviconUrl = (company: string): string => {
  const cleanName = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
  return `https://www.google.com/s2/favicons?domain=${cleanName}.com&sz=128`
}

const toTitleCase = (str: string) =>
  str.toLowerCase().replace(/(?:^|[\s-])\w/g, match => match.toUpperCase())

const formatPostedDate = (posted_at: string): string => {
  const date = new Date(posted_at)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatSalary = (job: Job): string | null => {
  if (job.salary_text) return job.salary_text
  if (job.salary_min && job.salary_max) {
    return `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
  }
  if (job.salary_min) return `$${job.salary_min.toLocaleString()}+`
  if (job.salary_max) return `Up to $${job.salary_max.toLocaleString()}`
  return null
}

// Clean HTML tags from text
const cleanHtml = (text: string) => {
  return text
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '$1')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '$1')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '$1')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .trim()
}

// Render job description with proper formatting
const renderDescription = (description: string) => {
  // Clean HTML first
  const cleaned = cleanHtml(description)

  // If no clear sections, just render as paragraphs with a header
  const hasStructure = /📄|🎯|💰|[A-Z]{4,}\n/.test(cleaned)

  if (!hasStructure) {
    const lines = cleaned.split('\n').filter(l => l.trim())
    const bullets = lines.filter(l => /^[•\-\*]\s/.test(l.trim()))
    const paragraphs = lines.filter(l => !/^[•\-\*]\s/.test(l.trim()))

    return (
      <div className="space-y-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-900 mb-4">
          <span className="text-xl">📄</span>
          Description
        </h2>
        {paragraphs.length > 0 && (
          <div className="space-y-3 text-neutral-600 text-[17px] leading-relaxed">
            {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        )}
        {bullets.length > 0 && (
          <ul className="space-y-2">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-neutral-600 text-[17px] leading-relaxed">
                <span className="text-neutral-400 mt-1.5">•</span>
                <span>{b.replace(/^[•\-\*]\s*/, '')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  // Split by section headers: emoji headers OR CAPITALIZED HEADERS
  const sections = cleaned.split(/\n(?=📄|🎯|💰|📋|✨|🏢|💼|[A-Z][A-Z\s]{3,}:?\n)/).filter(Boolean)

  return (
    <div className="space-y-8">
      {sections.map((section, index) => {
        const lines = section.trim().split('\n')
        const firstLine = lines[0]

        // Check if first line is a header
        const emojiMatch = firstLine.match(/^(📄|🎯|💰|📋|✨|🏢|💼)\s*(.*)$/)
        const capsMatch = firstLine.match(/^([A-Z][A-Z\s']{3,}):?$/)

        let emoji = ''
        let title = ''
        let contentLines = lines

        if (emojiMatch) {
          emoji = emojiMatch[1]
          title = emojiMatch[2]
          contentLines = lines.slice(1)
        } else if (capsMatch) {
          title = capsMatch[1]
          contentLines = lines.slice(1)
          // Add emoji based on section name
          if (/RESPONSIBILIT|DUTIES|OVERVIEW|ABOUT/i.test(title)) emoji = '📄'
          else if (/REQUIREMENT|QUALIFICATION|EXPERIENCE|EDUCATION|SKILLS|NICE TO HAVE/i.test(title)) emoji = '🎯'
          else if (/BENEFIT|SALARY|COMPENSATION|PERKS/i.test(title)) emoji = '💰'
          else if (/PHYSICAL|OTHER DUTIES/i.test(title)) emoji = '📋'
          else emoji = '✨'
        }

        // Separate bullets from paragraphs
        const bullets: string[] = []
        const paragraphs: string[] = []

        contentLines.forEach(line => {
          const trimmed = line.trim()
          if (!trimmed) return
          if (/^[•\-\*]\s/.test(trimmed)) {
            bullets.push(trimmed.replace(/^[•\-\*]\s*/, ''))
          } else {
            paragraphs.push(trimmed)
          }
        })

        return (
          <div key={index}>
            {title && (
              <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-900 mb-4">
                {emoji && <span className="text-xl">{emoji}</span>}
                {title}
              </h2>
            )}
            {paragraphs.length > 0 && (
              <div className="space-y-3 text-neutral-600 text-[17px] leading-relaxed mb-4">
                {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
            {bullets.length > 0 && (
              <ul className="space-y-2">
                {bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3 text-neutral-600 text-[17px] leading-relaxed">
                    <span className="text-neutral-400 mt-1.5">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

const ctaFeatures = [
  {
    emoji: '🎯',
    title: 'Direct from Source',
    description: 'Jobs pulled straight from company career pages, not recycled from other boards.',
  },
  {
    emoji: '⚡',
    title: 'First to Apply',
    description: 'See jobs before they hit LinkedIn or Indeed. Less competition, more callbacks.',
  },
  {
    emoji: '📬',
    title: 'Daily Job Alerts',
    description: 'Get matched jobs delivered to your inbox every morning.',
  },
]

const testimonials = [
  {
    name: 'mei lin',
    role: 'product designer @ fintech startup',
    text: 'ok so i was mass applying on linkedin for like 3 weeks with zero responses. found this site, applied to 4 jobs and got 2 interviews?? one of them was a company i literally never heard of before. starting there next month lol',
    date: 'Jan 13, 2026',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    name: 'Marcus J',
    role: 'Senior UI Designer',
    text: "The early access thing actually works. Applied to a role at 6am, recruiter told me I was one of the first 10 applicants. That never happens on other sites",
    date: 'Jan 10, 2026',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    name: 'em',
    role: 'Brand Designer',
    text: "finally a job board thats not 90% engineering roles. i dont have to scroll past \"senior backend engineer\" 50 times to find actual design jobs anymore thank god",
    date: 'Dec 18, 2025',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
  },
  {
    name: 'James',
    role: 'Motion/Video',
    text: "Was super skeptical paying for a job board tbh. But the listings here are different - found 3 motion design roles I didnt see anywhere else. Got an offer from one of them",
    date: 'Jan 12, 2026',
    avatar: 'https://randomuser.me/api/portraits/men/68.jpg',
  },
  {
    name: 'Liv Park',
    role: 'Visual Designer',
    text: "the filters!! they actually work lmao. remote only + senior level + $120k minimum = exactly what i needed. no more wading through irrelevant postings",
    date: 'Dec 30, 2025',
    avatar: 'https://randomuser.me/api/portraits/women/54.jpg',
  },
  {
    name: 'D. Martinez',
    role: 'Product Designer',
    text: "Landed at a series B startup that wasnt even on my radar. They posted here exclusively before going to linkedin. Thats the whole value prop right there",
    date: 'Jan 5, 2026',
    avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
  },
  {
    name: 'Aisha',
    role: 'UX Designer',
    text: "love the daily email. just 5-6 jobs every morning that are actually relevant. not like indeed where you get 100 notifications for roles you'd never apply to",
    date: 'Jan 12, 2026',
    avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
  },
  {
    name: 'Chris A.',
    role: 'Design Lead',
    text: "Been in the industry 12 years. This is the first job board that feels like it was made by someone who actually understands what designers are looking for. Simple as that.",
    date: 'Jan 10, 2026',
    avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
  },
  {
    name: 'nina w',
    role: 'IxD',
    text: '5 applications, 3 interviews. my linkedin ratio is like 50 apps = 2 interviews maybe. the quality here is just different idk how else to explain it',
    date: 'Dec 14, 2025',
    avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
  },
  {
    name: 'Tom R.',
    role: 'Design Systems',
    text: "Somehow every job here feels hand-picked? Like someone actually looked at it before posting. Rare for job boards these days.",
    date: 'Jan 8, 2026',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
  },
  {
    name: 'sofia',
    role: 'freelance ui/ux',
    text: "i use this mainly for contract gigs. way better selection than upwork and the companies are actually legit. found 2 long-term clients here already",
    date: 'Dec 28, 2025',
    avatar: 'https://randomuser.me/api/portraits/women/71.jpg',
  },
  {
    name: 'K. Thompson',
    role: 'Senior Product Designer',
    text: "Left my FAANG job last year. This site helped me find a fully remote role at a smaller company with way better work-life balance. No regrets",
    date: 'Jan 6, 2026',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
  },
  {
    name: 'rachel m',
    role: 'UX Researcher',
    text: "not strictly a designer but the ux research roles here are solid. found my current job through here - fully remote, great team, good pay. 10/10",
    date: 'Jan 11, 2026',
    avatar: 'https://randomuser.me/api/portraits/women/89.jpg',
  },
  {
    name: 'Andre',
    role: 'UI Designer',
    text: "my only complaint is i wish i found this sooner lol. spent months on linkedin applying to jobs that probably had 500+ applicants already",
    date: 'Dec 22, 2025',
    avatar: 'https://randomuser.me/api/portraits/men/78.jpg',
  },
  {
    name: 'Jen Liu',
    role: 'Product Designer',
    text: "The fact that its designer-focused makes such a difference. I actually trust that when I click on a job its gonna be relevant to what I do",
    date: 'Jan 9, 2026',
    avatar: 'https://randomuser.me/api/portraits/women/42.jpg',
  },
  {
    name: 'mike',
    role: 'graphic design / illustration',
    text: "as someone whos not strictly in tech/product design, i appreciate that theres actually graphic design and illustration roles here too. hard to find elsewhere",
    date: 'Jan 4, 2026',
    avatar: 'https://randomuser.me/api/portraits/men/36.jpg',
  },
  {
    name: 'Priya S',
    role: 'Design Lead',
    text: "Used to spend hours filtering through garbage on other sites. Now I just check here once a day. Saves so much time and mental energy honestly",
    date: 'Dec 31, 2025',
    avatar: 'https://randomuser.me/api/portraits/women/63.jpg',
  },
  {
    name: 'alex t',
    role: 'product designer',
    text: "got my job through here. applied on a tuesday, had a call thursday, offer the next week. the whole process was surprisingly fast",
    date: 'Jan 14, 2026',
    avatar: 'https://randomuser.me/api/portraits/men/91.jpg',
  },
]

const faqs = [
  {
    question: 'How do I post a job on Remote Designers?',
    answer: 'You can post a job by clicking the "Post a job" button in the top navigation. Fill out the job details including title, location, salary, and description. Your job will be reviewed and published within 24 hours.',
  },
  // {
  //   question: 'Is Remote Designers free to use?',
  //   answer: 'Yes, browsing and applying to jobs is completely free for job seekers. Employers pay a one-time fee of $99 to post a job listing.',
  // },
  {
    question: 'What types of design roles are available?',
    answer: 'We feature a wide range of design roles including UI/UX Design, Product Design, Graphic Design, Brand Design, Motion Design, and more.',
  },
  {
    question: 'How often are new jobs posted?',
    answer: 'New jobs are posted daily. We aggregate listings from multiple sources and our own job board to ensure you have access to the latest opportunities.',
  },
  {
    question: 'Can I apply directly through the platform?',
    answer: 'Job applications are handled through the employer\'s website or application system. We provide a direct link to apply for each position.',
  },
]

interface JobDetailClientProps {
  initialJob: Job | null
  error?: string
}

export default function JobDetailClient({ initialJob, error: initialError }: JobDetailClientProps) {
  const [job] = useState<Job | null>(initialJob)
  const [openFaq, setOpenFaq] = useState<number>(0)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [similarJobs, setSimilarJobs] = useState<Job[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const { openSignupModal } = useSignupModal()
  const router = useRouter()
  const error = initialError

  // Track page view
  useEffect(() => {
    if (!initialJob) return
    fetch(`/api/jobs/${initialJob.id}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'view' })
    }).catch(() => {}) // Silent fail
  }, [initialJob])

  // Check auth status, subscription, and saved state
  useEffect(() => {
    const checkAuthAndStatus = async () => {
      if (!initialJob) return

      const supabase = createBrowserSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)

        // Comp member bypass - auto-subscribe complimentary members
        if (isCompMember(user.email)) {
          setIsSubscribed(true)
        } else {
          // Check subscription status
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single()

          setIsSubscribed(!!subscription)
        }

        // Check saved status
        const { data } = await supabase
          .from('saved_jobs')
          .select('id')
          .eq('user_id', user.id)
          .eq('job_id', initialJob.id)
          .single()

        setIsSaved(!!data)
      }
    }

    checkAuthAndStatus()
  }, [initialJob])

  // Fetch similar jobs
  useEffect(() => {
    const fetchSimilarJobs = async () => {
      if (!initialJob) return

      try {
        // Extract keywords from job title for matching
        const designKeywords = ['product', 'ui', 'ux', 'graphic', 'visual', 'brand', 'motion', 'web', 'interaction', 'senior', 'lead', 'staff', 'principal', 'junior']
        const titleWords = initialJob.title.toLowerCase().split(/[\s,\/\-]+/)
        const matchedKeywords = titleWords.filter(word =>
          designKeywords.some(kw => word.includes(kw)) || word === 'designer' || word === 'design'
        ).slice(0, 3)

        const params = new URLSearchParams({
          limit: '6',
          title_keywords: matchedKeywords.join(',') || 'designer',
        })

        const res = await fetch(`/api/jobs?${params}`)
        const data = await res.json()

        // Filter out current job and take 3
        const filtered = (data.jobs || []).filter((j: Job) => j.id !== initialJob.id).slice(0, 3)
        setSimilarJobs(filtered)
      } catch (err) {
        console.error('Failed to fetch similar jobs:', err)
      }
    }

    fetchSimilarJobs()
  }, [initialJob])

  const handleSaveJob = async () => {
    if (!job) return

    if (!userId) {
      openSignupModal()
      return
    }

    setIsSaving(true)
    const supabase = createBrowserSupabaseClient()

    try {
      if (isSaved) {
        await supabase
          .from('saved_jobs')
          .delete()
          .eq('user_id', userId)
          .eq('job_id', job.id)
        setIsSaved(false)
        window.dispatchEvent(new Event('saved-jobs-changed'))
      } else {
        await supabase
          .from('saved_jobs')
          .insert({ user_id: userId, job_id: job.id })
        setIsSaved(true)
        window.dispatchEvent(new Event('saved-jobs-changed'))
      }
    } catch (err) {
      console.error('Failed to save job:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (error || !job) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-700 transition-colors mb-8"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 3L5 7.5L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to jobs
          </Link>
          <div className="text-center py-16">
            <h1 className="text-2xl font-medium text-neutral-900 mb-4">Job not found</h1>
            <p className="text-neutral-500 mb-8">This job may have been removed or is no longer available.</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg text-white bg-neutral-800 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.3),0px_1px_2px_0px_rgba(0,0,0,0.1)] hover:translate-y-[1px] hover:shadow-[0px_3px_0px_0px_rgba(0,0,0,0.3)] transition-all"
            >
              Browse all jobs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const salary = formatSalary(job)

  // Parse location for structured data
  const parseLocation = (location: string) => {
    const isRemote = location.toLowerCase().includes('remote')
    const loc = location.replace(/\s*\(?remote\)?\s*/gi, '').trim()

    // Try to extract country
    let country = 'US' // Default
    if (loc.toLowerCase().includes('uk') || loc.toLowerCase().includes('united kingdom')) country = 'GB'
    else if (loc.toLowerCase().includes('canada')) country = 'CA'
    else if (loc.toLowerCase().includes('germany')) country = 'DE'
    else if (loc.toLowerCase().includes('australia')) country = 'AU'
    else if (loc.toLowerCase().includes('france')) country = 'FR'
    else if (loc.toLowerCase().includes('spain')) country = 'ES'
    else if (loc.toLowerCase().includes('netherlands')) country = 'NL'
    else if (loc.toLowerCase().includes('ireland')) country = 'IE'
    else if (loc.toLowerCase().includes('worldwide') || loc.toLowerCase().includes('anywhere')) country = ''

    return { isRemote, locality: loc || location, country }
  }

  const locationInfo = parseLocation(job.location)

  // Calculate validThrough (30 days from posted date)
  const postedDate = new Date(job.posted_at)
  const validThrough = new Date(postedDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

  // Generate JSON-LD structured data for SEO
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || `${job.title} position at ${job.company}`,
    datePosted: job.posted_at,
    validThrough: validThrough,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      ...(job.company_logo && { logo: job.company_logo }),
    },
    employmentType: job.job_type?.toUpperCase().replace('-', '_') || 'FULL_TIME',
  }

  // Add job location
  if (locationInfo.isRemote) {
    jsonLd.jobLocationType = 'TELECOMMUTE'
    if (locationInfo.country) {
      jsonLd.applicantLocationRequirements = {
        '@type': 'Country',
        name: locationInfo.country,
      }
    }
  }

  jsonLd.jobLocation = {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressLocality: locationInfo.locality || 'Remote',
      addressRegion: locationInfo.locality || 'Remote',
      addressCountry: locationInfo.country || 'US',
    },
  }

  // Add base salary if available
  if (job.salary_min || job.salary_max) {
    jsonLd.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: {
        '@type': 'QuantitativeValue',
        ...(job.salary_min && { minValue: job.salary_min }),
        ...(job.salary_max && { maxValue: job.salary_max }),
        ...(!job.salary_min && job.salary_max && { value: job.salary_max }),
        ...(!job.salary_max && job.salary_min && { value: job.salary_min }),
        unitText: 'YEAR',
      },
    }
  }

  return (
    <>
      {/* SEO JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-neutral-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-2 md:pb-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-neutral-500">
            <li>
              <Link href="/" className="hover:text-neutral-900 transition-colors">
                Home
              </Link>
            </li>
            <li className="text-neutral-300">/</li>
            <li>
              <Link href="/" className="hover:text-neutral-900 transition-colors">
                Jobs
              </Link>
            </li>
            <li className="text-neutral-300">/</li>
            <li className="text-neutral-900 font-medium truncate max-w-[300px]">
              {job.title}
            </li>
          </ol>
        </nav>

        {/* Main Content */}
        <div className="flex flex-col-reverse md:flex-row gap-6 md:gap-12">
          {/* Left Column - Job Description */}
          <div className="flex-1">
            {/* Job Title - H1 for SEO (hidden on mobile, shown in sidebar) */}
            <h1 className="hidden md:block text-3xl font-semibold text-neutral-900 mb-2 tracking-tight">{job.title}</h1>
            <p className="hidden md:block text-lg text-neutral-500 mb-8">{job.company} · {job.location}</p>

            {/* Job Description */}
            <section className="mb-12">
              {job.description ? (
                renderDescription(job.description)
              ) : (
                <>
                  <h2 className="text-xl font-medium text-neutral-900 mb-6">Job Description</h2>
                  <p className="text-neutral-500 italic">
                    No description available. Visit the company's website for more details.
                  </p>
                </>
              )}
            </section>

          </div>

          {/* Right Column - Job Sidebar */}
          <div className="w-full md:w-[360px] flex-shrink-0">
            <div className="bg-white border border-neutral-200 rounded-xl rounded-tr-[80px] md:rounded-tr-[100px] p-5 md:p-6 md:sticky md:top-24">
              {/* Company Logo */}
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white border border-neutral-200 flex items-center justify-center mb-4 md:mb-6 overflow-hidden">
                <img
                  src={job.company_logo || getCompanyLogoUrl(job.company)}
                  alt={job.company}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = 'true'
                      target.src = getGoogleFaviconUrl(job.company)
                    } else {
                      target.style.display = 'none'
                      target.parentElement!.innerHTML = `<span class="text-xl font-medium text-neutral-400">${getInitials(job.company)}</span>`
                    }
                  }}
                />
              </div>

              {/* Badges */}
              {job.is_featured && (
                <div className="mb-4">
                  <span className="inline-block bg-yellow-400 text-neutral-900 text-xs font-medium px-3 py-1 rounded">
                    Featured
                  </span>
                </div>
              )}

              {/* Company Name */}
              <p className="text-sm md:text-base text-neutral-500 mb-1 md:mb-2">{job.company}</p>

              {/* Job Title in Sidebar */}
              <h2 className="text-xl md:text-2xl font-medium text-neutral-900 mb-4 md:mb-6">{job.title}</h2>

              {/* Job Details */}
              <div className="space-y-1.5 md:space-y-2 mb-4 md:mb-6">
                {/* Location */}
                <div className="flex items-center gap-2 md:gap-3 text-sm md:text-base text-neutral-600">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 flex-shrink-0">
                    <path d="M7.5 8C8.60457 8 9.5 7.10457 9.5 6C9.5 4.89543 8.60457 4 7.5 4C6.39543 4 5.5 4.89543 5.5 6C5.5 7.10457 6.39543 8 7.5 8Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7.5 13.5C7.5 13.5 12.5 9.5 12.5 6C12.5 3.23858 10.2614 1 7.5 1C4.73858 1 2.5 3.23858 2.5 6C2.5 9.5 7.5 13.5 7.5 13.5Z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  {job.location}
                </div>

                {/* Salary */}
                {salary && (
                  <div className="flex items-center gap-2 md:gap-3 text-sm md:text-base text-neutral-600">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 flex-shrink-0">
                      <path d="M7.5 1V14M10.5 3.5H6C4.61929 3.5 3.5 4.61929 3.5 6C3.5 7.38071 4.61929 8.5 6 8.5H9C10.3807 8.5 11.5 9.61929 11.5 11C11.5 12.3807 10.3807 13.5 9 13.5H4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {salary}
                  </div>
                )}

                {/* Job Type */}
                {job.job_type && (
                  <div className="flex items-center gap-3 text-neutral-600">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 flex-shrink-0">
                      <rect x="1.5" y="3.5" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M4.5 3.5V2.5C4.5 1.94772 4.94772 1.5 5.5 1.5H9.5C10.0523 1.5 10.5 1.94772 10.5 2.5V3.5" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <span>{toTitleCase(job.job_type)}</span>
                  </div>
                )}

                {/* Experience Level */}
                {job.experience_level && (
                  <div className="flex items-center gap-3 text-neutral-600">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 flex-shrink-0">
                      <path d="M7.5 1L9.18 5.82L14 6.24L10.36 9.44L11.46 14.2L7.5 11.67L3.54 14.2L4.64 9.44L1 6.24L5.82 5.82L7.5 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                    <span>{toTitleCase(job.experience_level)}</span>
                  </div>
                )}
              </div>

              {/* Chips - hidden on mobile since icon list shows same info */}
              <div className="hidden md:flex flex-wrap gap-2 mb-6">
                {job.is_featured && (
                  <Link
                    href="/?featured=true"
                    className="bg-yellow-400 text-neutral-900 text-xs font-medium px-2.5 py-1 rounded border border-yellow-500 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                  >
                    Featured
                  </Link>
                )}
                {job.job_type && (
                  <Link
                    href={`/?type=${job.job_type.toLowerCase()}`}
                    className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                  >
                    {toTitleCase(job.job_type)}
                  </Link>
                )}
                {job.experience_level && (
                  <Link
                    href={`/?experience=${job.experience_level.toLowerCase()}`}
                    className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                  >
                    {toTitleCase(job.experience_level)}
                  </Link>
                )}
                {salary && (
                  <span className="bg-neutral-100 text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 cursor-default">
                    {salary}
                  </span>
                )}
                {job.location.toLowerCase().includes('remote') && (
                  <Link
                    href="/?remote_type=remote"
                    className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                  >
                    Remote
                  </Link>
                )}
                {job.skills && job.skills.map((skill, index) => (
                  <Link
                    key={index}
                    href={`/?skill=${encodeURIComponent(skill)}`}
                    className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                  >
                    {toTitleCase(skill)}
                  </Link>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <RainbowButton
                  href={isSubscribed ? job.apply_url : undefined}
                  external={isSubscribed}
                  fullWidth
                  size="sm"
                  onClick={() => {
                    if (!isSubscribed) {
                      router.push(`/membership?skip_url=${encodeURIComponent(window.location.href)}`)
                      return
                    }
                    fetch(`/api/jobs/${job.id}/track`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'click' })
                    }).catch(() => {})
                  }}
                >
                  Apply now
                </RainbowButton>

                <button
                  onClick={handleSaveJob}
                  disabled={isSaving}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base font-medium border transition-all ${
                    isSaved
                      ? 'bg-white text-neutral-700 border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)]'
                      : 'bg-white text-neutral-700 border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[1px]'
                  } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={isSaved ? '#ef4444' : 'none'}
                    stroke={isSaved ? '#ef4444' : 'currentColor'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  {isSaved ? 'Saved' : 'Save job'}
                </button>
              </div>

              {/* Posted Date & Source */}
              <div className="text-xs text-neutral-400 text-center mt-4 space-y-1">
                <p>Posted {formatPostedDate(job.posted_at)}</p>
                <p>via {job.source}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Jobs Section */}
      {similarJobs.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-0 pb-4 md:py-12">
          <h2 className="text-xl md:text-2xl font-medium text-neutral-900 mb-4 md:mb-6">Similar Jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {similarJobs.map((similarJob) => (
              <Link
                key={similarJob.id}
                href={`/jobs/${similarJob.id}`}
                className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={similarJob.company_logo || getCompanyLogoUrl(similarJob.company)}
                      alt={similarJob.company}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (!target.dataset.triedFallback) {
                          target.dataset.triedFallback = 'true'
                          target.src = getGoogleFaviconUrl(similarJob.company)
                        } else if (!target.dataset.triedInitials) {
                          target.dataset.triedInitials = 'true'
                          target.style.display = 'none'
                          target.parentElement!.innerHTML = `<span class="text-sm font-medium text-neutral-400">${getInitials(similarJob.company)}</span>`
                        }
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-neutral-500 truncate">{similarJob.company}</p>
                    <h3 className="font-medium text-neutral-900 line-clamp-2">{similarJob.title}</h3>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2" onClick={(e) => e.preventDefault()}>
                  <Link
                    href={similarJob.location.toLowerCase().includes('remote') ? '/?remote_type=remote' : `/?location=${encodeURIComponent(similarJob.location)}`}
                    className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                  >
                    {similarJob.location}
                  </Link>
                  {similarJob.job_type && (
                    <Link
                      href={`/?type=${similarJob.job_type.toLowerCase()}`}
                      className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                    >
                      {toTitleCase(similarJob.job_type)}
                    </Link>
                  )}
                  {similarJob.experience_level && (
                    <Link
                      href={`/?experience=${similarJob.experience_level.toLowerCase()}`}
                      className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                    >
                      {toTitleCase(similarJob.experience_level)}
                    </Link>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA Card Section - Hidden for subscribed users */}
      {!isSubscribed && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-12 pb-8">
          <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4">
            {/* Left Content Card */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 pb-8 md:p-12 w-full md:w-1/2 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)]">
              <h2 className="text-3xl md:text-4xl font-medium text-neutral-900 text-center md:text-left mb-4 md:mb-10 font-dm-sans">
                Land Your Dream<br />Remote Design Job
              </h2>

              <div className="space-y-4 md:space-y-5 mb-4 md:mb-10">
                {ctaFeatures.map((feature, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-2 md:gap-4 items-center md:items-start">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 text-lg md:text-xl">
                      {feature.emoji}
                    </div>
                    <div className="text-center md:text-left">
                      <h3 className="font-medium text-neutral-900 mb-0.5 md:mb-1 text-base md:text-base">{feature.title}</h3>
                      <p className="text-neutral-500 text-xs md:text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center md:text-left">
                <Link href="/membership">
                  <RainbowButton fullWidth size="sm">
                    Get Membership — Unlock Full Access
                  </RainbowButton>
                </Link>

                <SocialProof className="mt-6 md:mt-10" />
              </div>
            </div>

            {/* Right Image Card */}
            <div className="w-full md:w-1/2 h-40 md:h-auto rounded-2xl overflow-hidden">
              <img
                src="/hero-bg.png"
                alt="Remote designers working"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* Testimonials Grid - Hidden for subscribed users */}
      {!isSubscribed && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-8 md:pb-12">
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-3 md:space-y-4">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="break-inside-avoid bg-white border border-neutral-200 rounded-xl p-4 md:p-6 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-neutral-900">{testimonial.name}</p>
                    <p className="text-sm text-neutral-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#FBBF24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 1L8.5 5H13L9.5 8L11 13L7 10L3 13L4.5 8L1 5H5.5L7 1Z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-neutral-600 text-sm mb-3">{testimonial.text}</p>
                <p className="text-xs text-neutral-400">{testimonial.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Section - Hidden for subscribed users */}
      {!isSubscribed && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-4 md:pb-12">
          <h2 className="text-xl md:text-2xl font-medium text-neutral-900 mb-4 md:mb-6">
            Questions, answered.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 items-start">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <button
                  key={index}
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="w-full border-t border-neutral-200 hover:bg-neutral-100/50 transition-colors duration-150 py-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900">{faq.question}</span>
                    <div className={`w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="transition-transform duration-150"
                      >
                        <path
                          d="M3 7H11"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M7 3V11"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          className={`origin-center transition-transform duration-150 ${isOpen ? 'scale-y-0' : 'scale-y-100'}`}
                        />
                      </svg>
                    </div>
                  </div>
                  <div
                    className={`grid transition-all duration-150 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-neutral-600 pr-12">{faq.answer}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
      </div>
    </>
  )
}
