const avatars = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/men/68.jpg',
  'https://randomuser.me/api/portraits/women/65.jpg',
  'https://randomuser.me/api/portraits/women/54.jpg',
]

interface SocialProofProps {
  className?: string
}

export function SocialProof({ className = '' }: SocialProofProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex -space-x-3">
        {avatars.map((avatar, i) => (
          <img
            key={i}
            src={avatar}
            alt=""
            className={`w-10 h-10 rounded-full border-2 border-white object-cover avatar-pop avatar-pop-${i + 1}`}
          />
        ))}
      </div>
      <div className="flex flex-col items-start">
        <div className="flex gap-0.5 text-amber-400">
          {[1, 2, 3, 4, 5].map(i => (
            <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-sm text-neutral-500">Loved by 10,000+ designers</span>
      </div>
    </div>
  )
}
