import Link from 'next/link'
import { Button, SuccessIcon } from '@/components/ui'

export default function PostJobSuccessPage() {
  return (
    <div className="h-screen relative">
      {/* Hero Background - positioned from top of viewport */}
      <div className="absolute left-0 right-0 overflow-hidden pointer-events-none" style={{ top: '-64px', height: '500px' }}>
        <img
          src="/success-bg.png"
          alt=""
          className="w-full h-auto"
          style={{ opacity: 0.4, marginTop: '-250px' }}
        />
        {/* Fade overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0) 60%, rgba(250,250,250,1) 100%)' }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="mx-auto px-6 text-center -mt-20">
        <SuccessIcon size="lg" className="mx-auto mb-6" />

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
    </div>
  )
}
