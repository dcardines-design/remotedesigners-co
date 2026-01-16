import Link from 'next/link'
import { Button } from '@/components/ui'

export default function PostJobSuccessPage() {
  return (
    <div className="h-screen bg-neutral-50 flex items-center justify-center">
      <div className="mx-auto px-6 text-center -mt-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-semibold text-neutral-900 mb-3">
          Job Posted Successfully!
        </h1>

        <p className="text-neutral-500 mb-8">
          <span className="whitespace-nowrap">Your job listing is now live and visible to thousands of remote designers.</span>
          <br />
          You&apos;ll start receiving applications soon.
        </p>

        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <Link href="/">
            <Button variant="primary" size="lg" fullWidth>
              View Job Listings
            </Button>
          </Link>

          <Link href="/post-job">
            <Button variant="secondary" size="lg" fullWidth>
              Post Another Job
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-neutral-400">
          Need help? Contact us at{' '}
          <a href="mailto:hello@remotedesigners.co" className="text-neutral-600 hover:underline">
            hello@remotedesigners.co
          </a>
        </p>
      </div>
    </div>
  )
}
