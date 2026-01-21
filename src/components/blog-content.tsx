'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { BLOG_CATEGORIES, BlogCategory } from '@/lib/blog/seo-helpers'
import { ImageGeneratorModal } from '@/components/ui'

/**
 * Reusable Blog Breadcrumb component
 */
interface BlogBreadcrumbProps {
  category: BlogCategory
  postTitle?: string
}

export function BlogBreadcrumb({ category, postTitle }: BlogBreadcrumbProps) {
  const categoryInfo = BLOG_CATEGORIES[category]

  return (
    <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8 overflow-x-auto hide-scrollbar">
      <Link href="/" className="hover:text-neutral-700 transition-colors shrink-0">Home</Link>
      <span className="shrink-0">/</span>
      <Link href="/blog" className="hover:text-neutral-700 transition-colors shrink-0">Blog</Link>
      <span className="shrink-0">/</span>
      <Link
        href={`/blog/category/${category}`}
        className="hover:text-neutral-700 transition-colors shrink-0 whitespace-nowrap"
      >
        {categoryInfo?.name || category}
      </Link>
      {postTitle && (
        <>
          <span className="hidden md:inline shrink-0">/</span>
          <span className="hidden md:inline text-neutral-400 truncate max-w-[200px]">{postTitle}</span>
        </>
      )}
    </nav>
  )
}

/**
 * Reusable Blog Post Footer (Back button + Share)
 */
interface BlogPostFooterProps {
  title: string
  slug: string
}

export function BlogPostFooter({ title, slug }: BlogPostFooterProps) {
  return (
    <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <Link
        href="/blog"
        className="flex items-center justify-center gap-2 bg-white text-neutral-600 text-sm px-3 py-2 rounded-md border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all whitespace-nowrap"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Blog
      </Link>
      <ShareButtons
        title={title}
        url={`https://remotedesigners.co/blog/${slug}`}
      />
    </div>
  )
}

/**
 * Reusable Blog Post Header (category chip, date, reading time)
 */
interface BlogPostHeaderProps {
  category: BlogCategory
  publishedAt: string
  readingTimeMinutes?: number | null
  title: string
  excerpt?: string | null
  slug?: string
}

export function BlogPostHeader({ category, publishedAt, readingTimeMinutes, title, excerpt, slug }: BlogPostHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const categoryInfo = BLOG_CATEGORIES[category]
  const publishedDate = new Date(publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handleGenerate = async (options: { variant: string; context: string; shot: string }) => {
    if (!slug || isGenerating) return

    setIsGenerating(true)
    try {
      const res = await fetch('/api/blog/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, ...options }),
      })

      if (res.ok) {
        // Refresh the page to show new image
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to generate image')
      }
    } catch (error) {
      alert('Failed to generate image')
    } finally {
      setIsGenerating(false)
      setIsModalOpen(false)
    }
  }

  return (
    <>
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Link
            href={`/blog/category/${category}`}
            className="text-xs text-neutral-600 bg-white px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
          >
            {categoryInfo?.emoji} {categoryInfo?.name || category}
          </Link>
          <span className="text-sm text-neutral-400">{publishedDate}</span>
          {readingTimeMinutes && slug && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm text-neutral-400 hover:text-pink-600 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Click to generate new image"
            >
              {readingTimeMinutes} min read
            </button>
          )}
          {readingTimeMinutes && !slug && (
            <span className="text-sm text-neutral-400">{readingTimeMinutes} min read</span>
          )}
        </div>
        <h1 className="font-dm-sans text-4xl md:text-5xl font-medium text-neutral-900 mt-6 mb-6 leading-tight tracking-tight">
          {title}
        </h1>
        {excerpt && (
          <p className="text-base text-neutral-500 leading-relaxed">
            {excerpt}
          </p>
        )}
      </header>

      {slug && (
        <ImageGeneratorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          slug={slug}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      )}
    </>
  )
}

interface BlogContentProps {
  content: string
}

export function BlogContent({ content }: BlogContentProps) {
  return (
    <article className="prose prose-neutral max-w-none">
      <ReactMarkdown
        components={{
          // Custom link handling for internal links
          a: ({ href, children, ...props }) => {
            const isInternal = href?.startsWith('/') || href?.startsWith('#')
            if (isInternal) {
              return (
                <Link href={href || '#'} className="text-blue-600 hover:underline" {...props}>
                  {children}
                </Link>
              )
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
                {...props}
              >
                {children}
              </a>
            )
          },
          // Headings with proper styling
          h2: ({ children, ...props }) => {
            const id = children
              ?.toString()
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
            return (
              <h2 id={id} className="font-ivy text-4xl font-light text-neutral-900 mt-12 mb-4" {...props}>
                {children}
              </h2>
            )
          },
          h3: ({ children, ...props }) => {
            const id = children
              ?.toString()
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
            return (
              <h3 id={id} className="text-lg font-semibold text-neutral-900 mt-8 mb-3" {...props}>
                {children}
              </h3>
            )
          },
          h4: ({ children, ...props }) => {
            const id = children
              ?.toString()
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
            return (
              <h4 id={id} className="text-lg font-semibold text-neutral-900 mt-6 mb-2" {...props}>
                {children}
              </h4>
            )
          },
          // Paragraphs - with special handling for image source attribution
          p: ({ children, ...props }) => {
            // Check if this is a source attribution (italic text starting with "Source:")
            const childArray = Array.isArray(children) ? children : [children]
            const firstChild = childArray[0]
            const isSourceAttribution =
              typeof firstChild === 'object' &&
              firstChild !== null &&
              'props' in firstChild &&
              firstChild.props?.children?.toString?.()?.startsWith?.('Source:')

            if (isSourceAttribution) {
              return (
                <p
                  className="text-sm text-neutral-400 text-center -mt-6 mb-8"
                  {...props}
                >
                  {children}
                </p>
              )
            }

            return (
              <p className="text-lg text-neutral-500 leading-relaxed mb-4" {...props}>
                {children}
              </p>
            )
          },
          // Lists
          ul: ({ children, ...props }) => (
            <ul className="list-disc pl-6 space-y-2 mb-6 text-lg text-neutral-500" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal pl-6 space-y-2 mb-6 text-lg text-neutral-500" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed pl-2" {...props}>
              {children}
            </li>
          ),
          // Strong/bold text
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-neutral-900" {...props}>
              {children}
            </strong>
          ),
          // Code blocks
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            if (match) {
              return (
                <code
                  className={`${className} block bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto my-4`}
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <code
                className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            )
          },
          // Blockquotes
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-neutral-300 pl-4 italic text-neutral-600 my-6"
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Images
          img: ({ src, alt, ...props }) => (
            <figure className="my-8">
              <img
                src={src}
                alt={alt}
                className="rounded-lg shadow-md w-full"
                loading="lazy"
                {...props}
              />
              {alt && (
                <figcaption className="text-center text-sm text-neutral-500 mt-2">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),
          // Horizontal rule
          hr: () => (
            <hr className="my-8 border-neutral-200" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  )
}

/**
 * Table of Contents component with scroll tracking
 */
interface TOCItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  // Extract only h2 headings from markdown
  const headingRegex = /^##\s+(.+)$/gm
  const headings: TOCItem[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[1].trim()
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')

    headings.push({ id, text, level: 2 })
  }

  // Track scroll position to highlight active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    )

    // Observe all heading elements
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 3) return null

  return (
    <nav className="mb-8 lg:mb-0 h-full flex flex-col">
      <h4 className="text-[10px] text-neutral-400 uppercase tracking-widest mb-4">On this page</h4>
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {headings.map((heading, index) => {
            const isActive = activeId === heading.id
            return (
              <li key={index}>
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    const element = document.getElementById(heading.id)
                    if (element) {
                      const offset = 100 // Account for sticky header
                      const top = element.getBoundingClientRect().top + window.scrollY - offset
                      window.scrollTo({ top, behavior: 'smooth' })
                    }
                  }}
                  className={`text-sm border-l-2 pl-3 transition-colors block leading-snug py-1.5 ${
                    isActive
                      ? 'border-pink-600 text-pink-600'
                      : 'border-neutral-200 text-neutral-500 hover:border-pink-600 hover:text-pink-600'
                  }`}
                >
                  {heading.text}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

/**
 * Share buttons component
 */
interface ShareButtonsProps {
  title: string
  url: string
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const encodedTitle = encodeURIComponent(title)
  const encodedUrl = encodeURIComponent(url)

  const buttonClass = "flex items-center gap-2 bg-white text-neutral-600 text-sm px-3 py-2 rounded-md border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
      <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Share</span>
      <div className="flex items-center gap-2 md:gap-3">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          aria-label="Share on Twitter"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>Twitter</span>
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          aria-label="Share on LinkedIn"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          <span>LinkedIn</span>
        </a>
        <button
          onClick={() => {
            navigator.clipboard.writeText(url)
          }}
          className={buttonClass}
          aria-label="Copy link"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>Copy</span>
        </button>
      </div>
    </div>
  )
}
