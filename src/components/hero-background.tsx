interface HeroBackgroundProps {
  imageSrc?: string
  opacity?: number
  maxHeight?: string
  offsetTop?: string
  mobileMaxHeight?: string
  mobileOffsetTop?: string
}

export function HeroBackground({
  imageSrc = '/seo-hero-bg.png',
  opacity = 0.08,
  maxHeight = '600px',
  offsetTop = '-200px',
  mobileMaxHeight = '400px',
  mobileOffsetTop = '-100px'
}: HeroBackgroundProps) {
  return (
    <>
    {/* Mobile */}
    <div
      className="absolute left-1/2 -translate-x-1/2 w-screen overflow-hidden pointer-events-none md:hidden"
      style={{ top: mobileOffsetTop, maxHeight: mobileMaxHeight }}
    >
      <img
        src={imageSrc}
        alt=""
        className="w-full h-auto"
        style={{ opacity }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0) 60%, rgba(250,250,250,1) 100%)' }}
      />
    </div>
    {/* Desktop */}
    <div
      className="absolute left-1/2 -translate-x-1/2 w-screen overflow-hidden pointer-events-none hidden md:block"
      style={{ top: offsetTop, maxHeight }}
    >
      <img
        src={imageSrc}
        alt=""
        className="w-full h-auto"
        style={{ opacity }}
      />
      {/* Fade overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0) 70%, rgba(250,250,250,1) 100%)' }}
      />
      {/* Bottom left corner fade */}
      <div
        className="absolute bottom-0 left-0 w-1/3 h-1/2"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(250,250,250,1) 0%, rgba(250,250,250,0) 70%)' }}
      />
      {/* Bottom right corner fade */}
      <div
        className="absolute bottom-0 right-0 w-1/3 h-1/2"
        style={{ background: 'radial-gradient(ellipse at bottom right, rgba(250,250,250,1) 0%, rgba(250,250,250,0) 70%)' }}
      />
    </div>
    </>
  )
}
