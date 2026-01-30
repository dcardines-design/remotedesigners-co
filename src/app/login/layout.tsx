import { Metadata } from 'next'

const BASE_URL = 'https://remotedesigners.co'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your RemoteDesigners.co account to access saved jobs and job alerts.',
  alternates: {
    canonical: `${BASE_URL}/login`,
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
