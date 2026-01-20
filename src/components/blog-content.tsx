'use client'

import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

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
          // Paragraphs
          p: ({ children, ...props }) => (
            <p className="text-lg text-neutral-500 leading-relaxed mb-4" {...props}>
              {children}
            </p>
          ),
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
 * Table of Contents component
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
  // Extract headings from markdown
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const headings: TOCItem[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')

    headings.push({ id, text, level })
  }

  if (headings.length < 3) return null

  return (
    <nav className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm mb-8 lg:mb-0 h-full flex flex-col">
      <h4 className="text-[10px] text-neutral-400 uppercase tracking-widest mb-4">On this page</h4>
      <div className="flex-1 overflow-y-auto">
      <ul className="space-y-1">
        {headings.map((heading, index) => (
          <li
            key={index}
            className={heading.level === 3 ? 'ml-4' : ''}
          >
            <a
              href={`#${heading.id}`}
              className={`${heading.level === 3 ? 'text-xs text-neutral-400' : 'text-sm text-neutral-500 font-medium'} hover:text-pink-600 active:text-pink-600 transition-colors block leading-snug py-1`}
            >
              {heading.text}
            </a>
          </li>
        ))}
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
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Share</span>
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
  )
}
