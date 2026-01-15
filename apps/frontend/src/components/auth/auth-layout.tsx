import type React from "react"
import { Link } from "@tanstack/react-router"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    // GUNAKAN 'h-screen' AGAR TINGGI TERKUNCI (GAMBAR KIRI TIDAK AKAN SCROLL)
    <div className="h-screen w-full flex bg-general-20 overflow-hidden">
      
      {/* PANEL KIRI (FIXED) */}
      <div className="hidden lg:flex lg:w-[40%] h-full relative">
        <img 
          src="/images/siswa_makan_mbg_2.png" 
          alt="Program MBG"
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover object-center" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-100/70 to-blue-60/70 mix-blend-multiply" />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-general-20 z-10">
          <div className="flex flex-col items-center gap-4 w-full px-8">
             <img 
               src="/images/logo_putih_besar.png" 
               alt="Logo AMP MBG"
               loading="eager"
               decoding="async"
               className="w-[70%] h-auto object-contain drop-shadow-xl"
             />
          </div>
        </div>
      </div>

      {/* PANEL KANAN (SCROLLABLE) */}
      {/* 'overflow-y-auto' di sini membuat HANYA bagian kanan yang bisa discroll */}
      <div className="w-full lg:w-[60%] h-full flex flex-col px-6 py-12 lg:px-24 xl:px-32 bg-general-20 overflow-y-auto scrollbar-hide">
        <div className="min-h-full flex flex-col justify-center">
            
            <div className="lg:hidden flex justify-center mb-10 mt-8">
            <Link to="/" className="flex flex-col items-center gap-4">
                <div className="bg-blue-100 rounded-full w-40 h-40 flex items-center justify-center p-6 shadow-xl">
                    <img 
                    src="/images/logo_putih_besar.png" 
                    alt="Logo AMP MBG"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain" 
                    />
                </div>
                <div className="flex flex-col items-center leading-none text-blue-100">
                    <span className="font-heading font-bold text-3xl">AMP MBG</span>
                </div>
            </Link>
            </div>

            <div className="w-full max-w-xl mx-auto pb-10">
                {children}
            </div>
        </div>
      </div>
    </div>
  )
}