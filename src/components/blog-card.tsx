'use client'

import Link from 'next/link'
import { BLOG_CATEGORIES, BlogCategory } from '@/lib/blog/seo-helpers'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt?: string
  category: BlogCategory
  tags?: string[]
  featured_image?: string
  featured_image_alt?: string
  published_at: string
  reading_time_minutes?: number
}

interface BlogCardProps {
  post: BlogPost
  variant?: 'default' | 'featured'
}

export function BlogCard({ post, variant = 'default' }: BlogCardProps) {
  const categoryInfo = BLOG_CATEGORIES[post.category]
  const publishedDate = new Date(post.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  if (variant === 'featured') {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group block bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08),0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:border-neutral-300 transition-all"
      >
        {post.featured_image && (
          <span className="block aspect-[16/9] overflow-hidden bg-neutral-100">
            <img
              src={post.featured_image}
              alt={post.featured_image_alt || post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </span>
        )}
        <span className="block p-6">
          <span className="flex items-center gap-3 mb-3">
            <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded">
              {categoryInfo?.name || post.category}
            </span>
            <span className="text-xs text-neutral-400">{publishedDate}</span>
            {post.reading_time_minutes && (
              <span className="text-xs text-neutral-400">{post.reading_time_minutes} min read</span>
            )}
          </span>
          <span className="block text-xl font-semibold text-neutral-900 mb-2 group-hover:text-neutral-700 transition-colors">
            {post.title}
          </span>
          {post.excerpt && (
            <span className="block text-neutral-600 text-sm line-clamp-2">{post.excerpt}</span>
          )}
        </span>
      </Link>
    )
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex gap-4 bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08),0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:border-neutral-300 transition-all"
    >
      {post.featured_image && (
        <span className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100 block">
          <img
            src={post.featured_image}
            alt={post.featured_image_alt || post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </span>
      )}
      <span className="flex-1 min-w-0 flex flex-col">
        <span className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
            {categoryInfo?.name || post.category}
          </span>
          <span className="text-xs text-neutral-400">{publishedDate}</span>
        </span>
        <span className="text-lg font-medium text-neutral-900 mb-1 group-hover:text-neutral-700 transition-colors line-clamp-2">
          {post.title}
        </span>
        {post.excerpt && (
          <span className="text-neutral-500 text-sm line-clamp-2 hidden md:block">{post.excerpt}</span>
        )}
        {post.reading_time_minutes && (
          <span className="text-xs text-neutral-400 mt-2 block">{post.reading_time_minutes} min read</span>
        )}
      </span>
    </Link>
  )
}

/**
 * Skeleton loader for blog cards
 */
export function BlogCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'featured' }) {
  if (variant === 'featured') {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden animate-pulse">
        <div className="aspect-[16/9] bg-neutral-200" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-20 h-5 bg-neutral-200 rounded" />
            <div className="w-16 h-4 bg-neutral-200 rounded" />
          </div>
          <div className="w-3/4 h-6 bg-neutral-200 rounded mb-2" />
          <div className="w-full h-4 bg-neutral-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 bg-white border border-neutral-200 rounded-xl p-4 animate-pulse">
      <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg bg-neutral-200" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-16 h-4 bg-neutral-200 rounded" />
          <div className="w-12 h-4 bg-neutral-200 rounded" />
        </div>
        <div className="w-3/4 h-5 bg-neutral-200 rounded mb-2" />
        <div className="w-full h-4 bg-neutral-200 rounded hidden md:block" />
      </div>
    </div>
  )
}
