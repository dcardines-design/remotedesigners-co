import { Metadata } from 'next'
import { regionalPages } from '@/config/seo-pages'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SEOLandingPage } from '@/components/seo-landing-page'

const page = regionalPages['latam']

export const metadata: Metadata = {
  title: page.title,
  description: page.metaDescription,
  openGraph: {
    title: page.title,
    description: page.metaDescription,
    type: 'website',
  },
  alternates: {
    canonical: 'https://remotedesigners.co/remote-design-jobs-latam',
  },
}

export default async function Page() {
  const supabase = createServerSupabaseClient()
  const orConditions = page.locationKeywords.map(k => `location.ilike.%${k}%`).join(',')

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
      currentSlug="latam"
      pageType="regional"
    />
  )
}
