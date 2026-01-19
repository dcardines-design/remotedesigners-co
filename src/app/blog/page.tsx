import { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { BlogCard } from '@/components/blog-card'
import { BlogListSEO } from '@/components/blog-seo'
import { BLOG_CATEGORIES, BlogCategory } from '@/lib/blog/seo-helpers'

export const metadata: Metadata = {
  title: 'Blog - Remote Design Insights & Career Tips',
  description: 'Expert insights on remote design jobs, career advice, and productivity tips for designers. Stay updated with the latest trends in the design job market.',
  keywords: ['remote design jobs', 'design career advice', 'remote work tips', 'UX designer career', 'design job market'],
  alternates: {
    canonical: 'https://remotedesigners.co/blog',
  },
  openGraph: {
    title: 'Blog - Remote Design Insights & Career Tips | RemoteDesigners.co',
    description: 'Expert insights on remote design jobs, career advice, and productivity tips for designers.',
    url: 'https://remotedesigners.co/blog',
    type: 'website',
  },
}

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  category: BlogCategory
  tags: string[] | null
  featured_image: string | null
  featured_image_alt: string | null
  published_at: string
  reading_time_minutes: number | null
}

async function getBlogPosts(): Promise<BlogPost[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, category, tags, featured_image, featured_image_alt, published_at, reading_time_minutes')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }

  return data || []
}

export default async function BlogPage() {
  const posts = await getBlogPosts()
  const featuredPost = posts[0]
  const otherPosts = posts.slice(1)

  const categories = Object.entries(BLOG_CATEGORIES) as [BlogCategory, typeof BLOG_CATEGORIES[BlogCategory]][]

  return (
    <>
      <BlogListSEO />
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Remote Design Blog
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Insights on the remote design job market, career advice, and tips for thriving as a remote designer.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <Link
            href="/blog"
            className="px-4 py-2 text-sm font-medium rounded-full bg-neutral-900 text-white"
          >
            All Posts
          </Link>
          {categories.map(([slug, category]) => (
            <Link
              key={slug}
              href={`/blog/category/${slug}`}
              className="px-4 py-2 text-sm font-medium rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
            >
              {category.name}
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-lg">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <div className="mb-10">
                <BlogCard
                  post={{
                    id: featuredPost.id,
                    slug: featuredPost.slug,
                    title: featuredPost.title,
                    excerpt: featuredPost.excerpt || undefined,
                    category: featuredPost.category,
                    tags: featuredPost.tags || undefined,
                    featured_image: featuredPost.featured_image || undefined,
                    featured_image_alt: featuredPost.featured_image_alt || undefined,
                    published_at: featuredPost.published_at,
                    reading_time_minutes: featuredPost.reading_time_minutes || undefined,
                  }}
                  variant="featured"
                />
              </div>
            )}

            {/* Other Posts Grid */}
            {otherPosts.length > 0 && (
              <div className="space-y-4">
                {otherPosts.map((post) => (
                  <BlogCard
                    key={post.id}
                    post={{
                      id: post.id,
                      slug: post.slug,
                      title: post.title,
                      excerpt: post.excerpt || undefined,
                      category: post.category,
                      tags: post.tags || undefined,
                      featured_image: post.featured_image || undefined,
                      featured_image_alt: post.featured_image_alt || undefined,
                      published_at: post.published_at,
                      reading_time_minutes: post.reading_time_minutes || undefined,
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* RSS Link */}
        <div className="text-center mt-12">
          <a
            href="/blog/feed.xml"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z" />
            </svg>
            Subscribe via RSS
          </a>
        </div>
      </div>
    </>
  )
}
