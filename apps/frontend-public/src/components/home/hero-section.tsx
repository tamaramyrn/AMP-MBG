import { memo } from "react"
import { Link, useNavigate } from "@tanstack/react-router"

function HeroSectionComponent() {
  const navigate = useNavigate()

  // Authentication check handler
  // Intercepts the "Report" click to ensure the user is logged in before proceeding
  const handleLaporClick = (e: React.MouseEvent) => {
    const user = localStorage.getItem("public_currentUser")
    if (!user) {
      e.preventDefault()
      navigate({ to: "/auth/login" })
    }
  }
  return (
    // Main Hero Container
    <section className="relative bg-blue-100 w-full overflow-hidden">
      
      {/* Background Image Section (Desktop Only) */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-1/2 h-full">
        <img
          src="/siswa_makan_mbg_1.webp"
          alt="Siswa menikmati makan bergizi gratis"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          width="1200"
          height="800"
          className="w-full h-full object-cover object-top opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-blue-100/90 via-20% to-transparent" />
      </div>

      <div className="relative z-10 w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24">
        <div className="flex flex-col lg:flex-row min-h-[500px] md:min-h-[600px] items-center">
          
          {/* Text Content Area */}
          <div className="w-full lg:w-1/2 py-12 md:py-20 text-general-20 text-center lg:text-left">
            <div className="w-full max-w-[40rem] mx-auto lg:mx-0">
              
              {/* Main Headline */}
              <h2 className="mb-6 font-heading font-bold text-3xl md:text-4xl lg:text-5xl leading-tight">
                <span className="block">Kawal Bersama Program</span>
                <span className="block text-orange-40">Makan Bergizi Gratis</span>
              </h2>

              {/* Sub-headline / Mission Statement */}
              <p className="body-sm md:body-md text-general-20/90 mb-8 max-w-lg mx-auto lg:mx-0 text-justify lg:text-left leading-relaxed">
                Platform independen untuk memastikan setiap porsi
                Makan Bergizi Gratis (MBG) tepat sasaran, tepat jumlah,
                dan tepat kualitas bagi penerus bangsa.
              </p>

              {/* Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {/* Primary Action: Report Incident (Triggers Auth Check) */}
                <Link
                  to="/lapor"
                  onClick={handleLaporClick}
                  className="body-sm font-heading font-semibold whitespace-nowrap w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-orange-100 hover:bg-orange-90 text-general-20 rounded-lg transition-all duration-300 shadow-lg shadow-orange-100/20 hover:shadow-orange-100/40 hover:-translate-y-0.5"
                >
                  Laporkan Temuan Sekarang
                </Link>

                {/* Secondary Action: Learn More Link */}
                <Link
                  to="/cara-kerja"
                  className="body-sm font-heading font-medium whitespace-nowrap w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-transparent border border-general-20/30 text-general-20 hover:bg-general-20 hover:text-blue-100 rounded-lg transition-colors duration-300"
                >
                  Pelajari Cara Kerjanya
                </Link>
              </div>
            </div>
          </div>

          <div className="hidden lg:block lg:w-1/2" />
          
        </div>
      </div>
    </section>
  )
}

export const HeroSection = memo(HeroSectionComponent)