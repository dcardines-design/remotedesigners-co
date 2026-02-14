import { Metadata } from 'next'

const BASE_URL = 'https://remotedesigners.co'

export const metadata: Metadata = {
  title: 'Free Resume Builder for Designers — ATS-Optimized Templates',
  description: 'Build a professional design resume in minutes. Choose from 3 free ATS-optimized templates, get a real-time score, and export to PDF. Built for UI, UX, product, and graphic designers.',
  keywords: [
    'free resume builder',
    'designer resume builder',
    'ATS resume builder',
    'UX designer resume',
    'UI designer resume',
    'product designer resume',
    'graphic designer resume template',
    'resume builder free',
    'ATS-friendly resume',
    'design portfolio resume',
  ],
  alternates: {
    canonical: `${BASE_URL}/resume-builder`,
  },
  openGraph: {
    title: 'Free Resume Builder for Designers — ATS-Optimized | RemoteDesigners.co',
    description: 'Build a professional design resume in minutes. 3 free ATS-optimized templates with real-time scoring. Export to PDF instantly.',
    url: `${BASE_URL}/resume-builder`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Resume Builder for Designers — ATS-Optimized',
    description: 'Build a professional design resume in minutes. 3 free ATS-optimized templates with real-time scoring.',
  },
}

const faqData = [
  { q: 'Is this resume builder really free?', a: 'Yes, 100% free. All 3 templates, the ATS score checker, and PDF export are free with no sign-up required.' },
  { q: 'What does ATS-optimized mean?', a: 'ATS (Applicant Tracking System) is software that companies use to scan and filter resumes before a human sees them. Our templates use clean formatting, standard section headings, and readable fonts so ATS can parse your resume correctly.' },
  { q: 'Which template should I choose?', a: 'Classic works well for most design roles. Modern is great if you want a contemporary look with accent colors. Minimal is ideal for senior designers who want the content to speak for itself.' },
  { q: 'Can I use this for non-design roles?', a: 'Yes. While our templates and tips are tailored for designers, the builder works for any profession. Just update the sections to fit your field.' },
  { q: 'Is my data saved?', a: 'Your resume data is saved locally in your browser. Nothing is sent to a server. If you clear your browser data, your resume will be lost — so always export a PDF copy.' },
  { q: 'What file format does it export?', a: 'PDF. The export matches exactly what you see in the preview, formatted for US Letter size (8.5 × 11 inches).' },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqData.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'RemoteDesigners Resume Builder',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: 'Free ATS-optimized resume builder for designers. 3 templates, real-time scoring, PDF export.',
  url: `${BASE_URL}/resume-builder`,
}

export default function ResumeBuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      {children}
    </>
  )
}
