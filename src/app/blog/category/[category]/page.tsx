import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { BLOG_CATEGORIES, BlogCategory } from '@/lib/blog/seo-helpers'
import { Button } from '@/components/ui'

interface Props {
  params: Promise<{ category: string }>
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

async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, category, tags, featured_image, featured_image_alt, published_at, reading_time_minutes')
    .eq('status', 'published')
    .eq('category', category)
    .order('published_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching posts by category:', error)
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
  'job-market-insights': 'bg-blue-100 text-blue-700',
  'remote-work-tips': 'bg-purple-100 text-purple-700',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const categoryInfo = BLOG_CATEGORIES[category as BlogCategory]

  if (!categoryInfo) {
    return {
      title: 'Category Not Found',
    }
  }

  return {
    title: `${categoryInfo.name} - Remote Design Blog`,
    description: categoryInfo.description,
    alternates: {
      canonical: `https://remotedesigners.co/blog/category/${category}`,
    },
    openGraph: {
      title: `${categoryInfo.name} | RemoteDesigners.co Blog`,
      description: categoryInfo.description,
      url: `https://remotedesigners.co/blog/category/${category}`,
    },
  }
}

export async function generateStaticParams() {
  return Object.keys(BLOG_CATEGORIES).map((category) => ({
    category,
  }))
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params
  const categoryInfo = BLOG_CATEGORIES[category as BlogCategory]

  if (!categoryInfo) {
    notFound()
  }

  const posts = await getPostsByCategory(category)
  const categories = Object.entries(BLOG_CATEGORIES) as [BlogCategory, typeof BLOG_CATEGORIES[BlogCategory]][]
  const categoryColor = CATEGORY_COLORS[category] || 'bg-neutral-100 text-neutral-700'

  return (
    <div className="min-h-screen bg-white">
      {/* Category Navigation */}
      <div className="border-b border-neutral-200 sticky top-16 bg-white z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 text-sm font-medium px-4 py-2 rounded-full whitespace-nowrap hover:bg-neutral-200 transition-all"
              >
                All posts
              </Link>
              {categories.map(([slug, cat]) => (
                <Link
                  key={slug}
                  href={`/blog/category/${slug}`}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    slug === category
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {cat.name}
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
        {/* Header */}
        <div className="text-center mb-12">
          <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-md mb-4 ${categoryColor}`}>
            {categoryInfo.name}
          </span>
          <h1 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-3">
            {categoryInfo.name}
          </h1>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
            {categoryInfo.description}
          </p>
        </div>

        {posts.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-dashed border-neutral-300 rounded-2xl px-12 py-24">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">No posts in this category yet</h2>
              <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
                Check back soon for {categoryInfo.name.toLowerCase()} articles.
              </p>
              <Link href="/blog">
                <Button variant="secondary">
                  View All Posts
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
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
                    {categoryInfo.name}
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
              ))}
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
  )
}
