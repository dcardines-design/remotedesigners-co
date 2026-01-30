import { Metadata } from 'next'

const BASE_URL = 'https://remotedesigners.co'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a RemoteDesigners.co account to save jobs, get job alerts, and track your applications.',
  alternates: {
    canonical: `${BASE_URL}/signup`,
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
