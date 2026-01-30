import { Metadata } from 'next'

const BASE_URL = 'https://remotedesigners.co'

export const metadata: Metadata = {
  title: 'Browse All Remote Design Jobs',
  description: 'Browse and filter all remote design jobs. Find UI, UX, product design, and graphic design positions from top companies worldwide.',
  alternates: {
    canonical: `${BASE_URL}/jobs`,
  },
  openGraph: {
    title: 'Browse All Remote Design Jobs | RemoteDesigners.co',
    description: 'Browse and filter all remote design jobs. Find UI, UX, product design, and graphic design positions from top companies worldwide.',
    url: `${BASE_URL}/jobs`,
    type: 'website',
  },
}

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
