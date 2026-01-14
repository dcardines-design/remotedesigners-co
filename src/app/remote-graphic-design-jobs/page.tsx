import { Metadata } from 'next'
import { jobTypePages } from '@/config/seo-pages'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SEOLandingPage } from '@/components/seo-landing-page'

const page = jobTypePages['graphic-design']

export const metadata: Metadata = {
  title: page.title,
  description: page.metaDescription,
  openGraph: {
    title: page.title,
    description: page.metaDescription,
    type: 'website',
  },
  alternates: {
    canonical: 'https://remotedesigners.co/remote-graphic-design-jobs',
  },
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

  return (
    <SEOLandingPage
      h1={page.h1}
      intro={page.intro}
      jobs={jobs || []}
      totalCount={count || 0}
      currentSlug="graphic-design"
      pageType="jobType"
    />
  )
}
