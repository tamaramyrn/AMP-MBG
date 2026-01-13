import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative bg-blue-70 w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:min-h-[500px]">
        
        <div className="lg:w-1/2 flex flex-col justify-center lg:items-end px-0 py-16 lg:py-20 text-white relative z-10">
          
          <div className="w-full max-w-[40rem] px-6 sm:px-8 lg:pl-12 lg:pr-0 lg:mr-auto xl:mr-0">
            
            <h2 className="mb-6 text-white">
              <span className="whitespace-normal lg:whitespace-nowrap">Kawal Bersama Program</span>
              <br />
              <span className="whitespace-normal lg:whitespace-nowrap">Makan Bergizi Gratis</span>
            </h2>

            <p className="body-sm md:body-xs text-white/90 mb-8 max-w-lg text-justify">
              Platform independen untuk memastikan setiap porsi 
              Makan Bergizi Gratis (MBG) tepat sasaran, tepat jumlah,
              dan tepat kualitas bagi penerus bangsa.
            </p>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4">
              
              <Link
                href="/lapor"
                className="body-sm whitespace-nowrap w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-red-100 hover:bg-red-90 text-white font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
              >
                Laporkan Temuan Sekarang
              </Link>

              <Link
                href="/cara-kerja"
                className="body-sm whitespace-nowrap w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-70 font-medium rounded-lg transition-colors duration-300"
              >
                Pelajari Cara Kerjanya
              </Link>

            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:w-1/2 relative lg:min-h-full">
          <img
            src="/images/siswa_makan_mbg_1.png"
            alt="Siswa menikmati makan bergizi gratis"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-70/40 via-blue-70/10 via-40% to-transparent lg:from-blue-70 lg:via-blue-70/85 lg:via-30% lg:to-transparent" />
        </div>
      </div>
    </section>
  )
}