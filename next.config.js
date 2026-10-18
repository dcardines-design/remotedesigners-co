/** @type {import('next').NextConfig} */

// PostHog ingestion is proxied through this app so ad blockers don't drop
// events. Flip NEXT_PUBLIC_POSTHOG_REGION to 'eu' if the project lives in EU.
const POSTHOG_REGION = process.env.NEXT_PUBLIC_POSTHOG_REGION === 'eu' ? 'eu' : 'us'
const POSTHOG_ASSET_HOST = `https://${POSTHOG_REGION}-assets.i.posthog.com`
const POSTHOG_API_HOST = `https://${POSTHOG_REGION}.i.posthog.com`

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer',
      'puppeteer-extra',
      'puppeteer-extra-plugin-stealth',
    ],
  },
  // Required so the PostHog proxy paths below aren't trailing-slash redirected
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: `${POSTHOG_ASSET_HOST}/static/:path*`,
      },
      {
        source: '/ingest/:path*',
        destination: `${POSTHOG_API_HOST}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
