import { Metadata } from 'next'
import { combinationPages, jobTypePages, regionalPages, generalFAQs } from '@/config/seo-pages'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SEOLandingPage } from '@/components/seo-landing-page'

const BASE_URL = 'https://remotedesigners.co'
const page = combinationPages['interaction-design-worldwide']
const jobTypeConfig = jobTypePages['interaction-design']
const regionConfig = regionalPages['worldwide']
const pageUrl = `${BASE_URL}/remote-interaction-design-jobs-worldwide`
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

export default async function Page() {
  const supabase = createServerSupabaseClient()
  
  const titleConditions = jobTypeConfig.filterKeywords.map(k => `title.ilike.%${k}%`).join(',')
  const locationConditions = regionConfig.locationKeywords.map(k => `location.ilike.%${k}%`).join(',')

  const { data: jobs, count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .or(titleConditions)
    .or(locationConditions)
    .order('posted_at', { ascending: false })
    .limit(50)

  const jobTypeName = jobTypeConfig.h1.replace('Remote ', '').replace(' Jobs', '')
  const regionName = 'worldwide' === 'worldwide' ? 'Worldwide' : regionConfig.h1.replace('Remote Design Jobs in ', '')

  return (
    <SEOLandingPage
      h1={page.h1}
      intro={page.intro}
      jobs={jobs || []}
      totalCount={count || 0}
      currentSlug={page.slug}
      pageType="jobType"
      faqs={allFaqs}
      breadcrumbLabel={regionName}
      parentPage={{ label: `${jobTypeName} Jobs`, href: `/remote-interaction-design-jobs` }}
    />
  )
}
