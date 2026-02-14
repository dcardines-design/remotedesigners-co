import { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import { generateJobSlug } from '@/lib/slug'
import { jobTypeSlugs, regionalSlugs, combinationSlugs, combinationPages, experienceLevelPages, employmentTypePages } from '@/config/seo-pages'
import { BLOG_CATEGORIES } from '@/lib/blog/seo-helpers'

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
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cover-letter`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Note: login and signup pages are excluded from sitemap (noindex)
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

  // SEO Landing Pages - Combination (Job Type + Region)
  const combinationLandingPages: MetadataRoute.Sitemap = combinationSlugs.map((slug) => {
    const page = combinationPages[slug]
    return {
      url: `${BASE_URL}/remote-${page.jobTypeSlug}-jobs-${page.regionSlug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }
  })

  // SEO Landing Pages - Experience Level
  const experienceLevelLandingPages: MetadataRoute.Sitemap = Object.values(experienceLevelPages).map((page) => ({
    url: `${BASE_URL}/${page.slug === 'entry-level' ? 'entry-level-design-jobs' : page.slug === 'junior-designer' ? 'junior-designer-jobs' : page.slug === 'mid-level-designer' ? 'mid-level-designer-jobs' : page.slug === 'senior-designer' ? 'senior-designer-jobs' : page.slug === 'design-lead' ? 'design-lead-jobs' : 'design-director-jobs'}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }))

  // SEO Landing Pages - Employment Type
  const employmentTypeLandingPages: MetadataRoute.Sitemap = Object.values(employmentTypePages).map((page) => ({
    url: `${BASE_URL}/${page.slug === 'full-time' ? 'full-time-design-jobs' : page.slug === 'part-time' ? 'part-time-design-jobs' : page.slug === 'contract' ? 'contract-design-jobs' : page.slug === 'freelance' ? 'freelance-design-jobs' : 'design-internships'}`,
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

  // Blog pages
  const blogMainPage: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Blog category pages
  const blogCategoryPages: MetadataRoute.Sitemap = Object.keys(BLOG_CATEGORIES).map((category) => ({
    url: `${BASE_URL}/blog/category/${category}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Blog post pages
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('slug, published_at, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(500)

  const blogPostPages: MetadataRoute.Sitemap = (blogPosts || []).map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.published_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...jobTypePages, ...regionalLandingPages, ...combinationLandingPages, ...experienceLevelLandingPages, ...employmentTypeLandingPages, ...jobPages, ...blogMainPage, ...blogCategoryPages, ...blogPostPages]
}
