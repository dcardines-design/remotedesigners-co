import { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { BlogListSEO } from '@/components/blog-seo'
import { BLOG_CATEGORIES, BlogCategory } from '@/lib/blog/seo-helpers'
import { Button } from '@/components/ui'

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// Category colors for tags
const CATEGORY_COLORS: Record<string, string> = {
  'career-advice': 'bg-emerald-100 text-emerald-700',
  'job-market': 'bg-blue-100 text-blue-700',
  'remote-work': 'bg-purple-100 text-purple-700',
  'portfolio-tips': 'bg-orange-100 text-orange-700',
  'salary-negotiation': 'bg-pink-100 text-pink-700',
  'interview-prep': 'bg-yellow-100 text-yellow-700',
  'design-tools': 'bg-cyan-100 text-cyan-700',
  'industry-news': 'bg-red-100 text-red-700',
}

export default async function BlogPage() {
  const posts = await getBlogPosts()
  const categories = Object.entries(BLOG_CATEGORIES) as [BlogCategory, typeof BLOG_CATEGORIES[BlogCategory]][]

  return (
    <>
      <BlogListSEO />
      <div className="min-h-screen bg-white">
        {/* Category Navigation */}
        <div className="border-b border-neutral-200 sticky top-16 bg-white z-10">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 bg-neutral-900 text-white text-sm font-medium px-4 py-2 rounded-full whitespace-nowrap transition-all"
                >
                  All posts
                </Link>
                {categories.map(([slug, category]) => (
                  <Link
                    key={slug}
                    href={`/blog/category/${slug}`}
                    className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 text-sm font-medium px-4 py-2 rounded-full whitespace-nowrap hover:bg-neutral-200 transition-all"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
              <a
                href="/blog/feed.xml"
                className="hidden md:flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors ml-4"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
          {posts.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-dashed border-neutral-300 rounded-2xl px-12 py-24">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-2">No posts yet</h2>
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
              {/* Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => {
                  const categoryInfo = BLOG_CATEGORIES[post.category]
                  const categoryColor = CATEGORY_COLORS[post.category] || 'bg-neutral-100 text-neutral-700'

                  return (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group flex flex-col"
                    >
                      {/* Featured Image */}
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 mb-4">
                        {post.featured_image ? (
                          <img
                            src={post.featured_image}
                            alt={post.featured_image_alt || post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                            <svg className="w-12 h-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Category Tag */}
                      <span className={`inline-flex self-start items-center text-xs font-medium px-2.5 py-1 rounded-md mb-3 ${categoryColor}`}>
                        {categoryInfo?.name || post.category}
                      </span>

                      {/* Title */}
                      <h2 className="text-lg font-semibold text-neutral-900 mb-3 group-hover:text-neutral-600 transition-colors line-clamp-2">
                        {post.title}
                      </h2>

                      {/* Author & Date */}
                      <div className="flex items-center gap-3 mt-auto">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-medium">
                          RD
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <span className="font-medium text-neutral-700">RemoteDesigners</span>
                          <span>·</span>
                          <span>{formatDate(post.published_at)}</span>
                        </div>
                      </div>
                    </Link>
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
