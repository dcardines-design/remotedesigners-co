import { Metadata } from 'next'
import { jobTypePages, generalFAQs } from '@/config/seo-pages'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SEOLandingPage } from '@/components/seo-landing-page'

const BASE_URL = 'https://remotedesigners.co'
const page = jobTypePages['product-design']
const pageUrl = `${BASE_URL}/remote-product-design-jobs`
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
      { '@type': 'ListItem', position: 2, name: 'Remote Design Jobs', item: BASE_URL },
      { '@type': 'ListItem', position: 3, name: page.title, item: pageUrl },
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
  const orConditions = page.filterKeywords.map(k => `title.ilike.%${k}%`).join(',')

  const { data: jobs, count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .or(orConditions)
    .order('posted_at', { ascending: false })
    .limit(50)

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
        currentSlug="product-design"
        pageType="jobType"
        faqs={allFaqs}
        breadcrumbLabel="Product Design"
      />
    </>
  )
}
