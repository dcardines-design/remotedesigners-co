import { Metadata } from 'next'
import { experienceLevelPages, generalFAQs } from '@/config/seo-pages'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SEOLandingPage } from '@/components/seo-landing-page'

const BASE_URL = 'https://remotedesigners.co'
const page = experienceLevelPages['junior-designer']
const pageUrl = `${BASE_URL}/junior-designer-jobs`
const allFaqs = [...page.faqs, ...generalFAQs]

export const metadata: Metadata = {
  title: page.title,
  description: page.metaDescription,
  openGraph: {
    title: page.title,
    description: page.metaDescription,
    type: 'website',
  },
  alternates: {
    canonical: pageUrl,
  },
}

function generateStructuredData() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: page.h1, item: pageUrl },
    ],
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFaqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return { breadcrumbSchema, faqSchema }
}

export default async function Page() {
  const supabase = createServerSupabaseClient()

  const { data: jobs, count } = await supabase
    .from('jobs')
    .select('id, title, company, company_logo, location, salary_min, salary_max, salary_text, job_type, experience_level, skills, apply_url, posted_at, source, is_featured, is_sticky, is_rainbow, sticky_until', { count: 'exact' })
    .eq('is_active', true)
    .eq('experience_level', page.filterValue)
    .order('posted_at', { ascending: false })
    .limit(20)

  const { breadcrumbSchema, faqSchema } = generateStructuredData()

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <SEOLandingPage
        h1={page.h1}
        intro={page.intro}
        jobs={jobs || []}
        totalCount={count || 0}
        currentSlug="junior-designer"
        pageType="experienceLevel"
        faqs={allFaqs}
        breadcrumbLabel="Junior"
      experienceLevel={page.filterValue}
      />
    </>
  )
}
