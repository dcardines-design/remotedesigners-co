import { TwitterApi } from 'twitter-api-v2'
import { generateJobSlug } from './slug'

// Initialize Twitter client (only if credentials are configured)
function getTwitterClient() {
  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessSecret = process.env.TWITTER_ACCESS_SECRET

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.log('Twitter credentials not configured, skipping tweet')
    return null
  }

  return new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
  })
}

interface JobForTwitter {
  id: string
  title: string
  company: string
  location: string
  salary_min?: number | null
  salary_max?: number | null
  salary_text?: string | null
}

export async function postJobToTwitter(job: JobForTwitter): Promise<boolean> {
  const client = getTwitterClient()
  if (!client) return false

  try {
    // Generate the job URL
    const jobSlug = generateJobSlug(job.title, job.company, job.id)
    const jobUrl = `https://remotedesigners.co/jobs/${jobSlug}`

    // Format salary if available
    let salaryLine = ''
    if (job.salary_text) {
      salaryLine = `💰 ${job.salary_text}\n\n`
    } else if (job.salary_min && job.salary_max) {
      const minK = Math.round(job.salary_min / 1000)
      const maxK = Math.round(job.salary_max / 1000)
      salaryLine = `💰 $${minK}k-$${maxK}k\n\n`
    }

    // Compose the tweet
    const tweet = `🎨 ${job.title} at ${job.company}

📍 ${job.location}
${salaryLine}Apply → ${jobUrl}

#remotework #designjobs #uxdesign`

    // Post the tweet
    await client.v2.tweet(tweet)
    console.log(`Tweeted job: ${job.title} at ${job.company}`)
    return true
  } catch (error) {
    console.error('Failed to post tweet:', error)
    return false
  }
}

interface BlogPostForTwitter {
  slug: string
  title: string
  category: string
  excerpt?: string
}

export async function postBlogToTwitter(post: BlogPostForTwitter): Promise<boolean> {
  const client = getTwitterClient()
  if (!client) return false

  try {
    const postUrl = `https://remotedesigners.co/blog/${post.slug}`

    // Category emoji map
    const categoryEmoji: Record<string, string> = {
      'job-market-insights': '📊',
      'remote-work-tips': '🏡',
      'career-advice': '🚀',
    }

    const emoji = categoryEmoji[post.category] || '📝'

    // Compose the tweet
    const tweet = `${emoji} New on the blog: ${post.title}

${post.excerpt ? post.excerpt.substring(0, 100) + '...' : ''}

Read more → ${postUrl}

#remotework #designjobs #designcareers`

    // Post the tweet
    await client.v2.tweet(tweet)
    console.log(`Tweeted blog post: ${post.title}`)
    return true
  } catch (error) {
    console.error('Failed to post blog tweet:', error)
    return false
  }
}
