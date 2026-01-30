import { Metadata } from 'next'

const BASE_URL = 'https://remotedesigners.co'

export const metadata: Metadata = {
  title: 'AI Cover Letter Generator for Designers',
  description: 'Generate compelling cover letters for design jobs with AI. Tailored for UI, UX, and product designer positions.',
  alternates: {
    canonical: `${BASE_URL}/cover-letter`,
  },
  openGraph: {
    title: 'AI Cover Letter Generator for Designers | RemoteDesigners.co',
    description: 'Generate compelling cover letters for design jobs with AI. Tailored for design positions.',
    url: `${BASE_URL}/cover-letter`,
    type: 'website',
  },
}

export default function CoverLetterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
