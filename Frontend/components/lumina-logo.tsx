export function LuminaLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Outer mystical ring */}
        <circle
          cx="20"
          cy="20"
          r="18"
          stroke="url(#gradient1)"
          strokeWidth="1.5"
          fill="none"
          className="animate-pulse"
        />

        {/* Inner geometric pattern */}
        <path
          d="M20 4 L32 16 L20 28 L8 16 Z"
          stroke="url(#gradient2)"
          strokeWidth="2"
          fill="url(#gradient3)"
          opacity="0.8"
        />

        {/* Central eye/lens */}
        <circle cx="20" cy="20" r="6" fill="url(#gradient4)" className="animate-pulse" />

        {/* Inner pupil */}
        <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.9" />

        {/* Mystical dots */}
        <circle cx="20" cy="8" r="1.5" fill="url(#gradient1)" opacity="0.7" />
        <circle cx="32" cy="20" r="1.5" fill="url(#gradient1)" opacity="0.7" />
        <circle cx="20" cy="32" r="1.5" fill="url(#gradient1)" opacity="0.7" />
        <circle cx="8" cy="20" r="1.5" fill="url(#gradient1)" opacity="0.7" />

        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          <radialGradient id="gradient3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
          </radialGradient>

          <radialGradient id="gradient4" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}
