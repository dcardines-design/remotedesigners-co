import { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { BlogListSEO } from '@/components/blog-seo'
import { BLOG_CATEGORIES, BlogCategory } from '@/lib/blog/seo-helpers'
import { Button } from '@/components/ui'
import { HeroBackground } from '@/components/hero-background'

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
  const categories = Object.entries(BLOG_CATEGORIES) as [BlogCategory, typeof BLOG_CATEGORIES[BlogCategory]][]

  // Chip styles - matching SEO pages
  const chipActiveClass = "bg-neutral-900 text-white text-sm px-4 py-2 rounded-md border border-neutral-900 transition-all"
  const chipInactiveClass = "bg-white text-neutral-600 text-sm px-4 py-2 rounded-md border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
  const cardChipClass = "bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200"

  return (
    <>
      <BlogListSEO />
      <div className="min-h-screen bg-neutral-50 relative">
        <HeroBackground
          imageSrc="/blog-hero-bg.png"
          maxHeight="400px"
          mobileMaxHeight="250px"
          fadeStart={60}
          mobileFadeStart={50}
        />
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16 relative z-10">
          {/* Header */}
          <h1 className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-6">
            Blog
          </h1>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2 mb-12">
            <Link href="/blog" className={chipActiveClass}>
              All Posts
            </Link>
            {categories.map(([slug, category]) => (
              <Link
                key={slug}
                href={`/blog/category/${slug}`}
                className={chipInactiveClass}
              >
                {category.name}
              </Link>
            ))}
          </div>

          {posts.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-dashed border-neutral-300 rounded-xl px-12 py-20">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-neutral-900 mb-2">No posts yet</h2>
                <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
                  Check back soon for design insights and career tips.
                </p>
                <Link href="/">
                  <Button variant="secondary">
                    Browse Jobs Instead
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Simple Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                {posts.map((post) => {
                  const categoryInfo = BLOG_CATEGORIES[post.category]

                  return (
                    <article key={post.id} className="group">
                      {/* Image */}
                      <Link href={`/blog/${post.slug}`} className="block aspect-[16/10] rounded-lg overflow-hidden bg-neutral-200 mb-4">
                        {post.featured_image ? (
                          <img
                            src={post.featured_image}
                            alt={post.featured_image_alt || post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                            <svg className="w-10 h-10 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                          </span>
                        )}
                      </Link>

                      {/* Category Chip */}
                      <Link
                        href={`/blog/category/${post.category}`}
                        className={`${cardChipClass} inline-block mb-3 hover:bg-neutral-100 hover:border-neutral-300 transition-colors`}
                      >
                        {categoryInfo?.name || post.category}
                      </Link>

                      {/* Title */}
                      <Link href={`/blog/${post.slug}`}>
                        <h2 className="text-base font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                      </Link>
                    </article>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="mt-16 pt-8 border-t border-neutral-200">
                <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z" />
                  </svg>
                  <span>Stay in the loop: subscribe to our</span>
                  <a href="/blog/feed.xml" className="font-medium text-neutral-900 hover:underline">
                    RSS feed
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
