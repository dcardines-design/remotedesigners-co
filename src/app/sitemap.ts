import { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import { generateJobSlug } from '@/lib/slug'
import { jobTypeSlugs, regionalSlugs } from '@/config/seo-pages'

const BASE_URL = 'https://remotedesigners.co'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerSupabaseClient()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/resume-builder`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/cover-letter`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // SEO Landing Pages - Job Types
  const jobTypePages: MetadataRoute.Sitemap = jobTypeSlugs.map((slug) => ({
    url: `${BASE_URL}/remote-${slug}-jobs`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }))

  // SEO Landing Pages - Regional
  const regionalLandingPages: MetadataRoute.Sitemap = regionalSlugs.map((slug) => ({
    url: `${BASE_URL}/remote-design-jobs-${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }))

  // Fetch all jobs for dynamic pages
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, company, posted_at')
    .order('posted_at', { ascending: false })
    .limit(5000) // Reasonable limit for sitemap

  if (error) {
    console.error('Error fetching jobs for sitemap:', error)
    return staticPages
  }

  // Generate job page URLs
  const jobPages: MetadataRoute.Sitemap = (jobs || []).map((job) => ({
    url: `${BASE_URL}/jobs/${generateJobSlug(job.title, job.company, job.id)}`,
    lastModified: new Date(job.posted_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...jobTypePages, ...regionalLandingPages, ...jobPages]
}
