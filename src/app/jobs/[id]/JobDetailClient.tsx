'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

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
}

const getInitials = (company: string) => company.substring(0, 2).toUpperCase()

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
          <div className="space-y-3 text-neutral-600">
            {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        )}
        {bullets.length > 0 && (
          <ul className="space-y-2">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-neutral-600">
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
              <div className="space-y-3 text-neutral-600 mb-4">
                {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
            {bullets.length > 0 && (
              <ul className="space-y-2">
                {bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3 text-neutral-600">
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

const benefits = [
  'Competitive salary and equity',
  'Health, dental, and vision insurance',
  'Unlimited PTO',
  '401(k) matching',
  'Home office stipend',
  'Professional development budget',
]

const ctaFeatures = [
  {
    title: 'Discover hidden jobs',
    description: 'We scan the internet everyday and find jobs not posted on traditional job boards.',
  },
  {
    title: 'Head start against the competition',
    description: "We find jobs as soon as they're posted, so you can apply before anyone else.",
  },
  {
    title: 'Be the first to know',
    description: 'Daily emails with new job openings straight to your inbox.',
  },
]

const testimonials = [
  {
    name: 'Guilherme',
    role: 'Systems Engineer',
    text: 'A great way to find remote job leads!',
    date: 'Jan 13, 2026',
    color: 'bg-green-500',
  },
  {
    name: 'Mitch',
    role: 'Go Engineer',
    text: "Hi everyone! I started using this application recently, and here's what I can say so far: It offers a lot of opportunities — there are many job vacancies, and it's not spam. Most of the listings are relevant and worth checking out.",
    date: 'Jan 10, 2026',
    color: 'bg-violet-500',
  },
  {
    name: 'Hayley Hassler',
    role: 'Bioinformatician',
    text: "Remote Rocketship is a sigh of relief in an otherwise arduous process. I've found high quality job listings here",
    date: 'Dec 18, 2025',
    color: 'bg-blue-500',
  },
  {
    name: 'Rebeca Gradinaru',
    role: 'Personal assistant',
    text: "Lior is an amazing helper, I highly recommend to a friend or family to find jobs on RemoteRocketship. I like how all the jobs I want to find have a detailed description and are very easy to understand",
    date: 'Jan 12, 2026',
    color: 'bg-purple-500',
  },
  {
    name: 'charley',
    role: 'QA Engineer',
    text: "Its great to see a site that is easier to navigate and has a good selection of filters, would recommend",
    date: 'Dec 30, 2025',
    color: 'bg-cyan-500',
  },
  {
    name: 'Dhruv Jalota',
    role: 'Project Manager',
    text: "Remote Rocketship is great for job hunters since you find openings not listed on other sites like LinkedIn etc. And it makes the application targeting easier with the help of AI scoring for personalized CVs",
    date: 'Jan 5, 2026',
    color: 'bg-indigo-500',
  },
  {
    name: 'Jason Bryant',
    role: 'Senior Data & Growth Plat...',
    text: 'Great aggregating tool! Moreover, a personal follow up email from Founder (I assume creator) was a really nice touch.',
    date: 'Jan 12, 2026',
    color: 'bg-yellow-500',
  },
  {
    name: 'Niki',
    role: 'Staff Engineer',
    text: "I nuked my LinkedIn because it became rubbish, completely useless. Remote Rocketship is the only site I'm on now to monitor all the jobs openings.",
    date: 'Jan 10, 2026',
    color: 'bg-teal-500',
  },
  {
    name: 'Kylie Harper',
    role: 'Still looking',
    text: 'I love all the opportunities this app gives you, and brings you straight to the application process, very neat and useful',
    date: 'Dec 14, 2025',
    color: 'bg-pink-500',
  },
]

const faqs = [
  {
    question: 'How do I post a job on Remote Designers?',
    answer: 'You can post a job by clicking the "Post a job" button in the top navigation. Fill out the job details including title, location, salary, and description. Your job will be reviewed and published within 24 hours.',
  },
  {
    question: 'Is Remote Designers free to use?',
    answer: 'Yes, browsing and applying to jobs is completely free for job seekers. Employers pay a one-time fee of $299 to post a job listing.',
  },
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
  const error = initialError

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
              className="inline-block px-6 py-3 rounded-lg text-white shadow-[0px_4px_0px_0px_rgba(0,0,0,0.3),0px_1px_2px_0px_rgba(0,0,0,0.1)] hover:translate-y-[1px] hover:shadow-[0px_3px_0px_0px_rgba(0,0,0,0.3)] transition-all"
              style={{ backgroundImage: 'linear-gradient(165deg, #3a3a3a 0%, #1a1a1a 100%)' }}
            >
              Browse all jobs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const salary = formatSalary(job)

  // Generate JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || `${job.title} position at ${job.company}`,
    datePosted: job.posted_at,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      logo: job.company_logo,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
      },
    },
    employmentType: job.job_type?.toUpperCase().replace('-', '_'),
    ...(job.salary_min && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: {
          '@type': 'QuantitativeValue',
          minValue: job.salary_min,
          maxValue: job.salary_max || job.salary_min,
          unitText: 'YEAR',
        },
      },
    }),
  }

  return (
    <>
      {/* SEO JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-neutral-50 min-h-screen">
        {/* Back to Jobs Bar */}
        <div className="bg-white border-b border-neutral-200">
          <div className="max-w-6xl mx-auto px-8">
            <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-700 transition-colors py-5"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 3L5 7.5L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to jobs
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Main Content */}
        <div className="flex gap-12">
          {/* Left Column - Job Description */}
          <div className="flex-1">
            {/* Job Title - H1 for SEO */}
            <h1 className="text-3xl font-semibold text-neutral-900 mb-2">{job.title}</h1>
            <p className="text-lg text-neutral-500 mb-8">{job.company} · {job.location}</p>

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

            {/* Benefits - only show if not already in description */}
            {!job.description?.includes('💰') && (
              <section>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-900 mb-4">
                  <span className="text-xl">💰</span>
                  Benefits
                </h2>
                <ul className="space-y-2">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3 text-neutral-600">
                      <span className="text-neutral-400 mt-1.5">•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Right Column - Job Sidebar */}
          <div className="w-[360px] flex-shrink-0">
            <div className="bg-white border border-neutral-200 rounded-xl p-6 sticky top-24">
              {/* Company Logo */}
              {job.company_logo ? (
                <img
                  src={job.company_logo}
                  alt={job.company}
                  className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-200 object-contain mb-6"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  <span className="text-2xl font-medium text-white">{job.company.charAt(0).toUpperCase()}</span>
                </div>
              )}

              {/* Featured Badge */}
              {job.is_featured && (
                <span className="inline-block bg-yellow-400 text-neutral-900 text-xs font-medium px-3 py-1 rounded mb-4">
                  Featured
                </span>
              )}

              {/* Job Title in Sidebar */}
              <h2 className="text-2xl font-medium text-neutral-900 mb-6">{job.title}</h2>

              {/* Job Details */}
              <div className="space-y-4 mb-6">
                {/* Company */}
                <div className="flex items-center gap-3 text-neutral-600">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 flex-shrink-0">
                    <path d="M7.5 1.5L13.5 4.5V13.5H1.5V4.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M5.5 13.5V8.5H9.5V13.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                  {job.company}
                </div>

                {/* Location */}
                <div className="flex items-center gap-3 text-neutral-600">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-400 flex-shrink-0">
                    <path d="M7.5 8C8.60457 8 9.5 7.10457 9.5 6C9.5 4.89543 8.60457 4 7.5 4C6.39543 4 5.5 4.89543 5.5 6C5.5 7.10457 6.39543 8 7.5 8Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7.5 13.5C7.5 13.5 12.5 9.5 12.5 6C12.5 3.23858 10.2614 1 7.5 1C4.73858 1 2.5 3.23858 2.5 6C2.5 9.5 7.5 13.5 7.5 13.5Z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  {job.location}
                </div>

                {/* Salary */}
                {salary && (
                  <div className="flex items-center gap-3 text-neutral-600">
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

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all cursor-default"
                    >
                      {toTitleCase(skill)}
                    </span>
                  ))}
                </div>
              )}

              {/* Apply Button */}
              <a
                href={job.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-6 py-3 rounded-lg text-white font-medium shadow-[0px_4px_0px_0px_rgba(0,0,0,0.3),0px_1px_2px_0px_rgba(0,0,0,0.1)] hover:translate-y-[1px] hover:shadow-[0px_3px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-[2px] active:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.3)] transition-all"
                style={{ backgroundImage: 'linear-gradient(165deg, #3a3a3a 0%, #1a1a1a 100%)' }}
              >
                Apply now
              </a>

              {/* Posted Date & Source */}
              <div className="text-xs text-neutral-400 text-center mt-4 space-y-1">
                <p>Posted {formatPostedDate(job.posted_at)}</p>
                <p>via {job.source}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Card Section */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="bg-neutral-100 rounded-2xl p-12">
          <h2 className="text-3xl font-medium text-neutral-900 text-center mb-10">
            Join now to find your dream remote job
          </h2>

          <div className="max-w-2xl mx-auto space-y-6 mb-10">
            {ctaFeatures.map((feature, index) => (
              <div key={index} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                  {index === 0 && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M12 12L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                  {index === 1 && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 1L11 7H17L12 11L14 17L9 13L4 17L6 11L1 7H7L9 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {index === 2 && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="4" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M2 6L9 10L16 6" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 mb-1">{feature.title}</h3>
                  <p className="text-neutral-500 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium shadow-[0px_4px_0px_0px_rgba(0,0,0,0.3),0px_1px_2px_0px_rgba(0,0,0,0.1)] hover:translate-y-[1px] hover:shadow-[0px_3px_0px_0px_rgba(0,0,0,0.3)] transition-all"
              style={{ backgroundImage: 'linear-gradient(165deg, #3a3a3a 0%, #1a1a1a 100%)' }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Find Your Dream Remote Job
            </Link>

            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="flex -space-x-2">
                {['bg-violet-500', 'bg-blue-500', 'bg-cyan-500', 'bg-green-500', 'bg-yellow-500'].map((color, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-white`} />
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#FBBF24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 1L8.5 5H13L9.5 8L11 13L7 10L3 13L4.5 8L1 5H5.5L7 1Z"/>
                  </svg>
                ))}
              </div>
              <span className="text-sm text-neutral-500">Loved by 10,000+ remote workers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="break-inside-avoid bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full ${testimonial.color} flex items-center justify-center`}>
                  <span className="text-white font-medium">{testimonial.name.charAt(0)}</span>
                </div>
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

      {/* FAQ Section */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <h2 className="text-5xl font-normal text-neutral-900 mb-12">
          Questions,<br />answered.
        </h2>

        <div className="space-y-0">
          {faqs.map((faq, index) => (
            <div key={index} className="border-t border-neutral-200">
              <button
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                className="w-full py-6 flex items-center justify-between text-left"
              >
                <span className="font-medium text-neutral-900">{faq.question}</span>
                <div className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center flex-shrink-0">
                  {openFaq === index ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
              </button>
              {openFaq === index && (
                <p className="pb-6 text-neutral-600 pr-12">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>
    </>
  )
}
