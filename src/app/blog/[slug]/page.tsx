import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { BlogSEO } from '@/components/blog-seo'
import { BlogContent, TableOfContents, BlogBreadcrumb, BlogPostHeader, BlogPostFooter } from '@/components/blog-content'
import { BlogCard } from '@/components/blog-card'
import { BlogCategory } from '@/lib/blog/seo-helpers'

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
    .limit(6)

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

      {/* Full Bleed Featured Image */}
      {post.featured_image && (
        <figure className="w-full">
          <img
            src={post.featured_image}
            alt={post.featured_image_alt || post.title}
            className="w-full h-[50vh] md:h-[60vh] object-cover"
          />
        </figure>
      )}

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <BlogBreadcrumb category={post.category} postTitle={post.title} />

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Column - Main Content */}
          <article className="flex-1 min-w-0">
            <BlogPostHeader
              category={post.category}
              publishedAt={post.published_at}
              readingTimeMinutes={post.reading_time_minutes}
              title={post.title}
              excerpt={post.excerpt}
              slug={post.slug}
            />

            {/* Mobile Table of Contents */}
            <div className="lg:hidden">
              <TableOfContents content={post.content} />
            </div>

            {/* Content */}
            <BlogContent content={post.content} />

            <BlogPostFooter title={post.title} slug={post.slug} />
          </article>

          {/* Right Column - Sticky TOC */}
          <aside className="hidden lg:block flex-1 max-w-xs">
            <div className="sticky top-24 h-[calc(100vh-120px)]">
              <TableOfContents content={post.content} />
            </div>
          </aside>
        </div>

        
        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl md:text-2xl font-medium text-neutral-900 mb-4 md:mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10">
              {relatedPosts.map((relatedPost) => (
                <BlogCard
                  key={relatedPost.id}
                  variant="compact"
                  post={{
                    id: relatedPost.id,
                    slug: relatedPost.slug,
                    title: relatedPost.title,
                    category: relatedPost.category,
                    featured_image: relatedPost.featured_image || undefined,
                    featured_image_alt: relatedPost.featured_image_alt || undefined,
                    published_at: relatedPost.published_at,
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
