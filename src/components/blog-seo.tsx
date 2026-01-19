/**
 * Blog SEO Component - Structured Data for Blog Posts
 */

interface BlogPost {
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image?: string
  featured_image_alt?: string
  published_at: string
  updated_at: string
  word_count?: number
  tags?: string[]
  category: string
}

interface BlogSEOProps {
  post: BlogPost
}

export function BlogSEO({ post }: BlogSEOProps) {
  const BASE_URL = 'https://remotedesigners.co'

  // Article Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.content.substring(0, 160),
    image: post.featured_image ? {
      '@type': 'ImageObject',
      url: post.featured_image,
      width: 1792,
      height: 1024,
    } : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Organization',
      name: 'RemoteDesigners.co',
      url: BASE_URL,
      logo: `${BASE_URL}/icon`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'RemoteDesigners.co',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/icon`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${post.slug}`,
    },
    wordCount: post.word_count,
    keywords: post.tags?.join(', '),
  }

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${BASE_URL}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${BASE_URL}/blog/${post.slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  )
}

/**
 * Blog List SEO - For the main blog page
 */
export function BlogListSEO() {
  const BASE_URL = 'https://remotedesigners.co'

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'RemoteDesigners.co Blog',
    description: 'Insights on remote design jobs, career advice, and remote work tips for designers.',
    url: `${BASE_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'RemoteDesigners.co',
      url: BASE_URL,
      logo: `${BASE_URL}/icon`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
    />
  )
}
