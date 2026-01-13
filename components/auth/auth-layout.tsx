import type React from "react"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image with green overlay and large logo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src="/images/image.png" alt="Program MBG" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/70" />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white">
          <div className="flex items-center gap-3">
            <svg width="100" height="100" viewBox="0 0 50 50" className="text-white">
              <circle cx="25" cy="30" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M10 30 Q25 15 40 30" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="20" y1="10" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />
              <line x1="30" y1="10" x2="30" y2="20" stroke="currentColor" strokeWidth="2" />
              <circle cx="20" cy="8" r="2" fill="currentColor" />
              <circle cx="30" cy="8" r="2" fill="currentColor" />
            </svg>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-6xl">AMP</span>
              <span className="font-bold text-6xl">MBG</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-16 bg-white">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
          <svg width="40" height="40" viewBox="0 0 50 50" className="text-primary">
            <circle cx="25" cy="30" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M10 30 Q25 15 40 30" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="10" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />
            <line x1="30" y1="10" x2="30" y2="20" stroke="currentColor" strokeWidth="2" />
            <circle cx="20" cy="8" r="2" fill="currentColor" />
            <circle cx="30" cy="8" r="2" fill="currentColor" />
          </svg>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-xl text-primary">AMP</span>
            <span className="font-bold text-xl text-primary">MBG</span>
          </div>
        </div>

        <div className="max-w-md mx-auto w-full">{children}</div>
      </div>
    </div>
  )
}
