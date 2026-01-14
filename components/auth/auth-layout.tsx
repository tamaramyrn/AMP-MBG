import type React from "react"
import Link from "next/link"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-general-20">
      
      {/* LEFT PANEL - Image & Logo Overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <img 
          src="/images/image.png" 
          alt="Program MBG - Anak Sekolah Makan Siang" 
          className="w-full h-full object-cover object-center" 
        />
        
        {/* Gradient Overlay (Green to Transparent/Darker) */}
        {/* Menggunakan gradient agar transisi warnanya lebih halus seperti di desain */}
        <div className="absolute inset-0 bg-gradient-to-t from-green-100/90 to-green-100/40 mix-blend-multiply" />
        
        {/* Logo Container (Centered) */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-general-20 z-10">
          <div className="flex items-center gap-4">
             {/* Logo SVG Custom (Putih) */}
             <svg 
              width="80" 
              height="80" 
              viewBox="0 0 50 50" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-general-20"
            >
              <path d="M25 45C36.0457 45 45 36.0457 45 25C45 13.9543 36.0457 5 25 5C13.9543 5 5 13.9543 5 25C5 36.0457 13.9543 45 25 45Z" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M15 28C15 28 20 35 25 35C30 35 35 28 35 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="18" cy="20" r="2.5" fill="currentColor"/>
              <circle cx="32" cy="20" r="2.5" fill="currentColor"/>
              {/* Sendok Garpu Ikonik (Simulasi) */}
               <path d="M10 25L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>

            <div className="flex flex-col leading-none">
              <span className="font-heading font-bold text-6xl tracking-tight">AMP</span>
              <span className="font-heading font-bold text-6xl tracking-tight">MBG</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Form Content */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-20 xl:px-24 bg-general-20 overflow-y-auto">
        
        {/* Mobile Logo (Hanya muncul di layar kecil) */}
        <div className="lg:hidden flex justify-center mb-8">
           <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-general-20">
                {/* Simple Logo Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                   <path d="M8 14C8 14 10 16 12 16C14 16 16 14 16 14" />
                   <path d="M9 9H9.01" />
                   <path d="M15 9H15.01" />
                </svg>
              </div>
              <div className="flex flex-col leading-none text-green-100">
                <span className="font-heading font-bold text-xl">AMP</span>
                <span className="font-heading font-bold text-xl">MBG</span>
              </div>
           </Link>
        </div>

        {/* Content Wrapper */}
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>

      </div>
    </div>
  )
}