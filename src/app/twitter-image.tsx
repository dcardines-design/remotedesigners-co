import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'RemoteDesigners.co - Find Remote Design Jobs'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #171717 50%, #262626 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              fontWeight: 700,
              color: 'white',
              marginRight: 20,
            }}
          >
            R
          </div>
          <span
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: 'white',
            }}
          >
            RemoteDesigners.co
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#a3a3a3',
            marginBottom: 50,
            textAlign: 'center',
          }}
        >
          Find Your Dream Remote Design Job
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: 60,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 48, fontWeight: 700, color: 'white' }}>1000+</span>
            <span style={{ fontSize: 18, color: '#737373' }}>Remote Jobs</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 48, fontWeight: 700, color: 'white' }}>100+</span>
            <span style={{ fontSize: 18, color: '#737373' }}>Companies</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 48, fontWeight: 700, color: 'white' }}>Daily</span>
            <span style={{ fontSize: 18, color: '#737373' }}>Updates</span>
          </div>
        </div>

        {/* Job types */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 50,
          }}
        >
          {['UI/UX', 'Product', 'Graphic', 'Motion', 'Brand'].map((type) => (
            <div
              key={type}
              style={{
                padding: '10px 20px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                fontSize: 16,
                color: '#d4d4d4',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {type} Design
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
