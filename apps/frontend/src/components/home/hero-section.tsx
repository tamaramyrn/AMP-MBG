import { Link } from "@tanstack/react-router"

export function HeroSection() {
  return (
    <section className="relative bg-blue-70 w-full overflow-hidden">
      
      {/* 1. LAYER GAMBAR BACKGROUND (Desktop Only - Posisi Absolut di Kanan) */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-1/2 h-full">
        <img
          src="/images/siswa_makan_mbg_1.png"
          alt="Siswa menikmati makan bergizi gratis"
          className="w-full h-full object-cover object-top"
        />
        {/* Gradient Overlay agar transisi warna halus dari biru ke gambar */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-70 via-blue-70/85 via-30% to-transparent" />
      </div>

      {/* 2. LAYER KONTEN (Menggunakan Container yang SAMA dengan Navbar) */}
      {/* Container ini menjaga agar teks lurus dengan Logo di Navbar */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Flex Wrapper untuk Vertikal Centering */}
        <div className="flex flex-col lg:flex-row lg:min-h-[500px] items-center">
          
          {/* Kolom Teks (Kiri) */}
          <div className="w-full lg:w-1/2 py-16 lg:py-20 text-white">
            
            <div className="w-full max-w-[40rem]">
              <h2 className="mb-6 text-white">
                <span className="whitespace-normal lg:whitespace-nowrap">Kawal Bersama Program</span>
                <br />
                <span className="whitespace-normal lg:whitespace-nowrap">Makan Bergizi Gratis</span>
              </h2>

              <p className="body-sm md:body-md text-white/90 mb-8 max-w-lg text-justify">
                Platform independen untuk memastikan setiap porsi
                Makan Bergizi Gratis (MBG) tepat sasaran, tepat jumlah,
                dan tepat kualitas bagi penerus bangsa.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/lapor"
                  className="body-sm whitespace-nowrap w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-red-100 hover:bg-red-90 text-white font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
                >
                  Laporkan Temuan Sekarang
                </Link>

                <Link
                  to="/cara-kerja"
                  className="body-sm whitespace-nowrap w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-70 font-medium rounded-lg transition-colors duration-300"
                >
                  Pelajari Cara Kerjanya
                </Link>
              </div>
            </div>
          </div>

          {/* Spacer Kolom Kanan (Kosong, karena sudah ada gambar di background) */}
          <div className="hidden lg:block lg:w-1/2" />
          
        </div>
      </div>
    </section>
  )
}