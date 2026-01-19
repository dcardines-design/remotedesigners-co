import { createServerSupabaseClient } from '@/lib/supabase'

const BASE_URL = 'https://remotedesigners.co'

interface BlogPost {
  slug: string
  title: string
  content: string
  excerpt: string | null
  category: string
  published_at: string
  updated_at: string
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatRfc822Date(date: string): string {
  return new Date(date).toUTCString()
}

export async function GET() {
  const supabase = createServerSupabaseClient()

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('slug, title, content, excerpt, category, published_at, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching posts for RSS:', error)
    return new Response('Error generating feed', { status: 500 })
  }

  const latestUpdate = posts && posts.length > 0
    ? formatRfc822Date(posts[0].published_at)
    : formatRfc822Date(new Date().toISOString())

  const items = (posts || []).map((post: BlogPost) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${BASE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || post.content.substring(0, 300)}]]></description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
      <pubDate>${formatRfc822Date(post.published_at)}</pubDate>
      <category>${escapeXml(post.category)}</category>
    </item>`).join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>RemoteDesigners.co Blog</title>
    <link>${BASE_URL}/blog</link>
    <description>Insights on remote design jobs, career advice, and remote work tips for designers.</description>
    <language>en-us</language>
    <lastBuildDate>${latestUpdate}</lastBuildDate>
    <atom:link href="${BASE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/icon</url>
      <title>RemoteDesigners.co</title>
      <link>${BASE_URL}</link>
    </image>
    ${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
