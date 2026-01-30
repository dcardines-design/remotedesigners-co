import { Metadata } from 'next'

const BASE_URL = 'https://remotedesigners.co'

export const metadata: Metadata = {
  title: 'AI Resume Builder for Designers',
  description: 'Build a professional designer resume with AI assistance. Optimize your resume for remote design jobs with our free resume builder.',
  alternates: {
    canonical: `${BASE_URL}/resume-builder`,
  },
  openGraph: {
    title: 'AI Resume Builder for Designers | RemoteDesigners.co',
    description: 'Build a professional designer resume with AI assistance. Optimize your resume for remote design jobs.',
    url: `${BASE_URL}/resume-builder`,
    type: 'website',
  },
}

export default function ResumeBuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
