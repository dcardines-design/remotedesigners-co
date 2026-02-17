import { NextRequest, NextResponse } from 'next/server'
import {
  getTwitterClient,
  fetchFreshJobs,
  generateTweet,
  postTweet,
  recordTweet,
} from '@/lib/twitter-reply-service'

const MAX_TWEETS_PER_RUN = 2
const TWEET_SPACING_MS = 90 * 1000 // 90 seconds between tweets

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const client = getTwitterClient()
    if (!client) {
      return NextResponse.json({ error: 'Twitter credentials not configured' }, { status: 500 })
    }

    console.log('[Twitter Bot] Starting run...')

    const jobs = await fetchFreshJobs()
    console.log(`[Twitter Bot] Found ${jobs.length} untweeted jobs`)

    if (jobs.length === 0) {
      return NextResponse.json({ success: true, tweetsPosted: 0, message: 'No new jobs to tweet' })
    }

    let tweetsPosted = 0
    const results: Array<{ jobId: string; title: string; success: boolean; error?: string }> = []

    for (const job of jobs) {
      if (tweetsPosted >= MAX_TWEETS_PER_RUN) break

      // Generate tweet
      const tweet = generateTweet(job)
      if (!tweet) continue

      // Post it
      const result = await postTweet(client, tweet)

      if ('id' in result) {
        await recordTweet(job.id, tweet)
        tweetsPosted++
        console.log(`[Twitter Bot] Tweeted: ${job.title} at ${job.company}`)
        results.push({ jobId: job.id, title: `${job.title} at ${job.company}`, success: true })

        // Wait between tweets
        if (tweetsPosted < MAX_TWEETS_PER_RUN) {
          await new Promise(resolve => setTimeout(resolve, TWEET_SPACING_MS))
        }
      } else {
        results.push({ jobId: job.id, title: `${job.title} at ${job.company}`, success: false, error: result.error })
      }
    }

    console.log(`[Twitter Bot] Run complete. Tweets posted: ${tweetsPosted}`)

    return NextResponse.json({
      success: true,
      tweetsPosted,
      results,
    })
  } catch (error) {
    console.error('[Twitter Bot] Cron error:', error)
    return NextResponse.json({ error: 'Twitter bot failed' }, { status: 500 })
  }
}
