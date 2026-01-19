import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { BlogCard } from '@/components/blog-card'
import { BLOG_CATEGORIES, BlogCategory } from '@/lib/blog/seo-helpers'

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8">
        <Link href="/" className="hover:text-neutral-700 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-neutral-700 transition-colors">Blog</Link>
        <span>/</span>
        <span className="text-neutral-900">{categoryInfo.name}</span>
      </nav>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">
          {categoryInfo.name}
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          {categoryInfo.description}
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        <Link
          href="/blog"
          className="px-4 py-2 text-sm font-medium rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
        >
          All Posts
        </Link>
        {categories.map(([slug, cat]) => (
          <Link
            key={slug}
            href={`/blog/category/${slug}`}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              slug === category
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-500 text-lg mb-4">
            No posts in this category yet.
          </p>
          <Link
            href="/blog"
            className="text-neutral-900 hover:underline"
          >
            View all posts &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
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

      {/* Back to Blog */}
      <div className="text-center mt-12">
        <Link
          href="/blog"
          className="text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          &larr; Back to all posts
        </Link>
      </div>
    </div>
  )
}
