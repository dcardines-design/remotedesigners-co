import Link from 'next/link'

export default function PostJobSuccessPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-semibold text-neutral-900 mb-3">
          Job Posted Successfully!
        </h1>

        <p className="text-neutral-500 mb-8">
          Your job listing is now live and visible to thousands of remote designers.
          You&apos;ll start receiving applications soon.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 px-6 bg-neutral-900 text-white font-medium rounded-xl hover:bg-neutral-800 transition-colors"
          >
            View Job Listings
          </Link>

          <Link
            href="/post-job"
            className="block w-full py-3 px-6 bg-white text-neutral-900 font-medium rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            Post Another Job
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
