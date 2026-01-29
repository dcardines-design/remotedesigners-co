import { TwitterApi } from 'twitter-api-v2'
import { createAdminSupabaseClient } from '@/lib/supabase'
import { generateJobSlug } from '@/lib/slug'

export function getTwitterClient(): TwitterApi | null {
  const apiKey = process.env.TWITTER_BOT_API_KEY
  const apiSecret = process.env.TWITTER_BOT_API_SECRET
  const accessToken = process.env.TWITTER_BOT_ACCESS_TOKEN
  const accessSecret = process.env.TWITTER_BOT_ACCESS_SECRET

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.log('Twitter credentials not configured')
    return null
  }

  return new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret,
  })
}

interface JobForTweet {
  id: string
  title: string
  company: string
  location: string
  salary_text?: string | null
  salary_min?: number | null
  salary_max?: number | null
  job_type?: string | null
}

export async function fetchFreshJobs(): Promise<JobForTweet[]> {
  const supabase = createAdminSupabaseClient()

  // Get recent active jobs not yet tweeted by this bot
  const { data: alreadyTweeted } = await supabase
    .from('twitter_replies')
    .select('tweet_id')

  const tweetedJobIds = new Set((alreadyTweeted || []).map(r => r.tweet_id))

  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, company, location, salary_text, salary_min, salary_max, job_type')
    .eq('is_active', true)
    .order('posted_at', { ascending: false })
    .limit(20)

  if (error || !data) {
    console.error('Failed to fetch jobs:', error)
    return []
  }

  // Filter out already-tweeted jobs and junk titles
  return data.filter(job => {
    if (tweetedJobIds.has(job.id)) return false
    // Skip jobs with numeric IDs or codes in the title
    if (/^\d{5,}/.test(job.title)) return false
    // Skip titles that are too short or look like garbage
    if (job.title.length < 5) return false
    return true
  })
}

export function generateTweet(job: JobForTweet): string {
  const slug = generateJobSlug(job.title, job.company, job.id)
  const jobUrl = `https://remotedesigners.co/jobs/${slug}`

  let salary = ''
  if (job.salary_text) {
    salary = `\n💰 ${job.salary_text}`
  } else if (job.salary_min && job.salary_max) {
    salary = `\n💰 $${Math.round(job.salary_min / 1000)}k-$${Math.round(job.salary_max / 1000)}k`
  }

  const allHashtags = [
    '#remotework', '#hiring', '#designjobs', '#uxdesign', '#uidesign',
    '#graphicdesign', '#productdesign', '#remotejobs', '#nowhiring',
    '#jobsearch', '#techjobs', '#creativejobs', '#webdesign', '#figma',
    '#ux', '#ui', '#design', '#careers', '#jobopening', '#wfh',
  ]
  // Pick 5-7 random hashtags
  const count = 5 + Math.floor(Math.random() * 3)
  const shuffled = allHashtags.sort(() => Math.random() - 0.5)
  const hashtags = shuffled.slice(0, count).join(' ')

  const jobLine = job.company ? `🎨 ${job.title} at ${job.company}` : `🎨 ${job.title}`

  return `✨ HIRING DESIGNER ✨\n${jobLine}\n📍 ${job.location}${salary}\nApply → ${jobUrl}\n${hashtags}`
}

export async function postTweet(client: TwitterApi, tweet: string): Promise<string | null> {
  try {
    const result = await client.v2.tweet(tweet)
    return result.data.id
  } catch (error) {
    console.error('[Twitter] Failed to post tweet:', error)
    return null
  }
}

export async function recordTweet(
  jobId: string,
  tweetText: string
): Promise<void> {
  const supabase = createAdminSupabaseClient()
  await supabase.from('twitter_replies').insert({
    tweet_id: jobId, // Using job ID as the dedup key
    tweet_author: 'self',
    tweet_text: '',
    reply_text: tweetText,
  })
}
