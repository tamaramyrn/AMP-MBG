import { memo } from "react"
import { Link, useNavigate } from "@tanstack/react-router"

function HeroSectionComponent() {
  const navigate = useNavigate()

  const handleLaporClick = (e: React.MouseEvent) => {
    const user = localStorage.getItem("currentUser")
    if (!user) {
      e.preventDefault()
      navigate({ to: "/auth/login" })
    }
  }
  return (
    <section className="relative bg-orange-100 w-full overflow-hidden">
      
      {/* Background Image: Hanya muncul di Laptop/Desktop (LG ke atas) */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-1/2 h-full">
        <img
          src="/siswa_makan_mbg_1.webp"
          alt="Siswa menikmati makan bergizi gratis"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          width="1200"
          height="800"
          className="w-full h-full object-cover object-top"
        />
        {/* Gradient Overlay untuk transisi halus antara warna solid dan foto */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-100 via-orange-70/90 via-30% to-transparent" />
      </div>

      {/* CONTAINER UTAMA (Fluid Responsiveness):
          - Mobile: px-5
          - Tablet: px-8
          - Laptop (13-14"): px-16
          - Desktop Besar: px-24
      */}
      <div className="relative z-10 w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24">
        
        {/* Flex Container:
            - min-h-[500px] md:min-h-[600px]: Memberikan tinggi minimal agar hero terlihat gagah
        */}
        <div className="flex flex-col lg:flex-row min-h-[500px] md:min-h-[600px] items-center">
          
          {/* Text Column */}
          <div className="w-full lg:w-1/2 py-12 md:py-20 text-white text-center lg:text-left">
            
            <div className="w-full max-w-[40rem] mx-auto lg:mx-0">
              {/* HEADLINE RESPONSIF:
                  - text-3xl (Mobile)
                  - text-4xl (Tablet)
                  - text-5xl (Laptop/Desktop)
                  - leading-tight: Agar spasi antar baris rapi
              */}
              <h2 className="mb-6 text-white text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                <span className="block">Kawal Bersama Program</span>
                <span className="block">Makan Bergizi Gratis</span>
              </h2>

              <p className="body-sm md:body-md text-white/90 mb-8 max-w-lg mx-auto lg:mx-0 text-justify lg:text-left leading-relaxed">
                Platform independen untuk memastikan setiap porsi
                Makan Bergizi Gratis (MBG) tepat sasaran, tepat jumlah,
                dan tepat kualitas bagi penerus bangsa.
              </p>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/lapor"
                  onClick={handleLaporClick}
                  className="body-sm whitespace-nowrap w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-red-100 hover:bg-red-90 text-white font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
                >
                  Laporkan Temuan Sekarang
                </Link>

                <Link
                  to="/cara-kerja"
                  className="body-sm whitespace-nowrap w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-transparent border-2 border-white text-white hover:bg-white hover:text-orange-70 font-medium rounded-lg transition-colors duration-300"
                >
                  Pelajari Cara Kerjanya
                </Link>
              </div>
            </div>
          </div>

          {/* Spacer Column (untuk menyeimbangkan layout di desktop karena ada gambar di kanan) */}
          <div className="hidden lg:block lg:w-1/2" />
          
        </div>
      </div>
    </section>
  )
}

export const HeroSection = memo(HeroSectionComponent)