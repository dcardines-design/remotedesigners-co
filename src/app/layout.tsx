import type { Metadata } from 'next'
import { Inter, DM_Sans } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { SignupModalProvider } from '@/context/signup-modal-context'
import { PostHogProvider } from '@/components/posthog-provider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700']
})

const BASE_URL = 'https://remotedesigners.co'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'RemoteDesigners.co - Remote Design Jobs',
    template: '%s | RemoteDesigners.co',
  },
  description: 'Discover curated remote design jobs sourced directly from company career pages, YC startups, and top job boards. Find UI, UX, product design, and graphic design positions updated hourly.',
  keywords: [
    'remote design jobs',
    'remote designer jobs',
    'UI designer jobs',
    'UX designer jobs',
    'product designer jobs',
    'graphic designer jobs',
    'remote work',
    'design careers',
    'freelance design',
  ],
  authors: [{ name: 'RemoteDesigners.co' }],
  creator: 'RemoteDesigners.co',
  publisher: 'RemoteDesigners.co',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'RemoteDesigners.co',
    title: 'RemoteDesigners.co - Remote Design Jobs',
    description: 'Discover curated remote design jobs sourced directly from company career pages, YC startups, and top job boards. Find UI, UX, product design, and graphic design positions updated hourly.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RemoteDesigners.co - Remote Design Jobs',
    description: 'Discover curated remote design jobs sourced from company career pages, YC startups, and top job boards.',
  },
  alternates: {
    canonical: BASE_URL,
  },
}

// Structured data for Organization and WebSite
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'RemoteDesigners.co',
  url: BASE_URL,
  logo: `${BASE_URL}/icon`,
  description: 'The best remote design job board for UI, UX, and product designers.',
  sameAs: [
    'https://twitter.com/co_remote50851',
  ],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'RemoteDesigners.co',
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* Stripe.js for checkout */}
        <script src="https://js.stripe.com/v3/" defer></script>
      </head>
      <body className={`${inter.className} ${dmSans.variable}`}>
        <PostHogProvider>
          <SignupModalProvider>
            <Navbar />
            <main className="min-h-screen pb-16">
              {children}
            </main>
            <Footer />
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  padding: '16px 20px',
                  minWidth: '380px',
                },
              }}
            />
          </SignupModalProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
