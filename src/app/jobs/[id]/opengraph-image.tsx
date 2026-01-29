import { ImageResponse } from 'next/og'
import { extractIdFromSlug } from '@/lib/slug'

export const runtime = 'edge'

export const alt = 'Remote Design Job on RemoteDesigners.co'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

async function getJobData(jobId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const res = await fetch(
    `${url}/rest/v1/jobs?select=title,company,location,salary_text,salary_min,salary_max&id=eq.${jobId}`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data?.[0] || null
}

export default async function OGImage({ params }: { params: { id: string } }) {
  const id = typeof params?.id === 'string' ? params.id : ''
  const jobId = extractIdFromSlug(id)

  // Load DM Sans font
  const [fontData, fontBoldData] = await Promise.all([
    fetch('https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAopxhTg.ttf').then(r => r.arrayBuffer()),
    fetch('https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwARZthTg.ttf').then(r => r.arrayBuffer()),
  ])

  let title = 'Remote Design Job'
  let company = ''
  let location = 'Remote'
  let salary = ''

  if (jobId) {
    const data = await getJobData(jobId)
    if (data) {
      title = data.title || title
      company = data.company || ''
      location = data.location || 'Remote'
      if (data.salary_text) {
        salary = data.salary_text
      } else if (data.salary_min && data.salary_max) {
        salary = `$${Math.round(data.salary_min / 1000)}k - $${Math.round(data.salary_max / 1000)}k`
      }
    }
  }

  const displayTitle = title.length > 55 ? title.slice(0, 52) + '...' : title
  const bgUrl = 'https://remotedesigners.co/og-bg.png'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          position: 'relative',
          fontFamily: 'DM Sans',
        }}
      >
        {/* Background image */}
        <img
          src={bgUrl}
          width={1200}
          height={630}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />

        {/* Job details overlay */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'absolute',
            top: 140,
            left: 60,
            bottom: 140,
            maxWidth: 650,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#ec4899',
              letterSpacing: 1.5,
              display: 'flex',
              marginBottom: 10,
            }}
          >
            HIRING 🔔
          </div>
          <div
            style={{
              fontSize: 60,
              fontWeight: 700,
              color: '#1a1a1a',
              lineHeight: 1.15,
              display: 'flex',
            }}
          >
            {displayTitle}
          </div>
          <div
            style={{
              fontSize: 30,
              color: '#1a1a1a',
              marginTop: 12,
              fontWeight: 500,
              display: 'flex',
            }}
          >
            {company ? `at ${company}` : ''}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 16,
            }}
          >
            <span style={{ fontSize: 26, color: '#444444' }}>
              📌 {location}
            </span>
          </div>
          <div style={{ display: 'flex', marginTop: 8 }}>
            <span style={{ fontSize: 26, color: '#667eea', fontWeight: 600 }}>
              {salary}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'DM Sans',
          data: fontData,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'DM Sans',
          data: fontBoldData,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  )
}
