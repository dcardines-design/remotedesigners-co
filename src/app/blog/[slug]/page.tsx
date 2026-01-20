import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { BlogSEO } from '@/components/blog-seo'
import { BlogContent, TableOfContents, ShareButtons } from '@/components/blog-content'
import { BlogCard } from '@/components/blog-card'
import { BLOG_CATEGORIES, BlogCategory } from '@/lib/blog/seo-helpers'

interface BlogPost {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string | null
  category: BlogCategory
  tags: string[] | null
  featured_image: string | null
  featured_image_alt: string | null
  status: string
  published_at: string
  updated_at: string
  meta_title: string | null
  meta_description: string | null
  focus_keyword: string | null
  secondary_keywords: string[] | null
  reading_time_minutes: number | null
  word_count: number | null
}

interface Props {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) {
    return null
  }

  return data
}

interface RelatedPost {
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

async function getRelatedPosts(category: string, currentSlug: string): Promise<RelatedPost[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, category, tags, featured_image, featured_image_alt, published_at, reading_time_minutes')
    .eq('status', 'published')
    .eq('category', category)
    .neq('slug', currentSlug)
    .order('published_at', { ascending: false })
    .limit(3)

  if (error) {
    return []
  }

  return data || []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  const keywords = [
    post.focus_keyword,
    ...(post.secondary_keywords || []),
    ...(post.tags || []),
  ].filter(Boolean) as string[]

  return {
    title: post.meta_title || `${post.title} | RemoteDesigners.co`,
    description: post.meta_description || post.excerpt || post.content.substring(0, 160),
    keywords,
    alternates: {
      canonical: `https://remotedesigners.co/blog/${post.slug}`,
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt || post.content.substring(0, 160),
      url: `https://remotedesigners.co/blog/${post.slug}`,
      siteName: 'RemoteDesigners.co',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: ['RemoteDesigners.co'],
      tags: post.tags || undefined,
      images: post.featured_image ? [{
        url: post.featured_image,
        alt: post.featured_image_alt || post.title,
        width: 1792,
        height: 1024,
      }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || post.content.substring(0, 160),
      images: post.featured_image ? [post.featured_image] : undefined,
      creator: '@co_remote50851',
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(post.category, post.slug)
  const categoryInfo = BLOG_CATEGORIES[post.category]
  const publishedDate = new Date(post.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <BlogSEO
        post={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || undefined,
          content: post.content,
          featured_image: post.featured_image || undefined,
          featured_image_alt: post.featured_image_alt || undefined,
          published_at: post.published_at,
          updated_at: post.updated_at,
          word_count: post.word_count || undefined,
          tags: post.tags || undefined,
          category: post.category,
        }}
      />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8">
          <Link href="/" className="hover:text-neutral-700 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-neutral-700 transition-colors">Blog</Link>
          <span>/</span>
          <Link
            href={`/blog/category/${post.category}`}
            className="hover:text-neutral-700 transition-colors"
          >
            {categoryInfo?.name || post.category}
          </Link>
        </nav>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column - Main Content */}
          <article className="flex-1 min-w-0 max-w-3xl">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Link
                  href={`/blog/category/${post.category}`}
                  className="text-sm font-medium text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full hover:bg-neutral-200 transition-colors"
                >
                  {categoryInfo?.name || post.category}
                </Link>
                <span className="text-sm text-neutral-400">{publishedDate}</span>
                {post.reading_time_minutes && (
                  <span className="text-sm text-neutral-400">{post.reading_time_minutes} min read</span>
                )}
              </div>
              <h1 className="font-dm-sans text-4xl font-bold text-neutral-900 mb-4 leading-tight">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-xl text-neutral-600 leading-relaxed">
                  {post.excerpt}
                </p>
              )}
            </header>

            {/* Featured Image */}
            {post.featured_image && (
              <figure className="mb-10">
                <img
                  src={post.featured_image}
                  alt={post.featured_image_alt || post.title}
                  className="w-full rounded-lg shadow-md"
                />
              </figure>
            )}

            {/* Mobile Table of Contents */}
            <div className="lg:hidden">
              <TableOfContents content={post.content} />
            </div>

            {/* Content */}
            <BlogContent content={post.content} />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-neutral-200">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-between">
              <ShareButtons
                title={post.title}
                url={`https://remotedesigners.co/blog/${post.slug}`}
              />
              <Link
                href="/blog"
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                &larr; Back to Blog
              </Link>
            </div>
          </article>

          {/* Right Column - Sticky TOC */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <TableOfContents content={post.content} />
            </div>
          </aside>
        </div>

        {/* CTA - Full Width */}
        <div className="mt-12 bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-xl p-8 text-center max-w-3xl">
          <h3 className="text-xl font-semibold text-white mb-2">
            Ready to Find Your Next Remote Design Role?
          </h3>
          <p className="text-neutral-300 mb-6">
            Browse thousands of remote design jobs from top companies.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-neutral-900 font-medium rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Browse Jobs
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 max-w-3xl">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Related Articles</h2>
            <div className="space-y-4">
              {relatedPosts.map((relatedPost) => (
                <BlogCard
                  key={relatedPost.id}
                  post={{
                    id: relatedPost.id,
                    slug: relatedPost.slug,
                    title: relatedPost.title,
                    excerpt: relatedPost.excerpt || undefined,
                    category: relatedPost.category,
                    tags: relatedPost.tags || undefined,
                    featured_image: relatedPost.featured_image || undefined,
                    featured_image_alt: relatedPost.featured_image_alt || undefined,
                    published_at: relatedPost.published_at,
                    reading_time_minutes: relatedPost.reading_time_minutes || undefined,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
