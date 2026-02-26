import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useSEO } from "@/hooks/use-seo"
import { SEO } from "@/config/seo"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Camera, Upload, Search, ShieldCheck, MessageCircle, Play } from "lucide-react"

export const Route = createFileRoute("/cara-kerja/")({
  component: CaraKerjaPage,
})

const steps = [
  {
    icon: Camera,
    step: 1,
    title: "Dokumentasi",
    description: "Ambil foto atau video sebagai bukti temuan di lapangan.",
  },
  {
    icon: Upload,
    step: 2,
    title: "Laporkan",
    description: "Isi formulir laporan melalui website dengan lengkap.",
  },
  {
    icon: Search,
    step: 3,
    title: "Verifikasi",
    description: "Tim kami akan memverifikasi keakuratan data yang dilaporkan.",
  },
  {
    icon: ShieldCheck,
    step: 4,
    title: "Tindak Lanjut",
    description: "Laporan diteruskan ke pihak berwenang untuk ditindaklanjuti.",
  },
]

function CaraKerjaPage() {
  useSEO(SEO.caraKerja)
  const navigate = useNavigate()

  const handleLaporClick = () => {
    const user = localStorage.getItem("public_currentUser")
    if (user) {
      navigate({ to: "/lapor" })
    } else {
      navigate({ to: "/auth/login" })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-general-20">
      <Navbar />
      
      <main className="flex-1 pt-8 md:pt-12">
        
        {/* Section 1: Help */}
        <section className="pb-8 md:pb-10">
          <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24">
            
            {/* Card container */}
            <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-blue-30/50 overflow-hidden">
              
              <div className="p-6 md:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                  
                  {/* Left column: text */}
                  <div className="order-2 lg:order-1 flex flex-col items-center lg:items-start text-center lg:text-left">
                    <h2 className="font-heading text-2xl md:text-3xl font-bold text-blue-100 mb-4">
                      Butuh Bantuan Menyusun Laporan?
                    </h2>
                    
                    {/* Description */}
                    <p className="body-md text-general-60 mb-8 w-full leading-relaxed">
                      Tim AMP MBG siap membantu merapikan kronologi dan memastikan laporan terekam dengan baik. Kirim pesan via WhatsApp dan kami akan memberikan panduan langkah demi langkah.
                    </p>
                    
                    <div className="w-full sm:w-auto mb-8">
                      <a
                        href="https://wa.me/6281316423424"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-green-60 hover:bg-green-70 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 body-sm w-full sm:w-auto"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Hubungi via WhatsApp
                      </a>
                    </div>

                    {/* Response hours */}
                    <div className="w-full text-left space-y-1.5 border-l-4 border-orange-100 pl-5 py-2 bg-orange-20/30 rounded-r-lg">
                      <p className="body-sm font-bold text-blue-100">
                        Jam Respons : Senin - Jumat (08.00 - 18.00 WIB)
                      </p>
                      <p className="text-xs text-general-60 leading-relaxed">
                        Di luar jam tersebut, tim AMP MBG akan tetap memantau pesan yang masuk dan merespons secepatnya.
                      </p>
                    </div>
                  </div>

                  {/* Right column: video */}
                  <div className="order-1 lg:order-2 w-full">
                    <div className="bg-blue-100 rounded-2xl aspect-video flex items-center justify-center border border-blue-90 w-full relative overflow-hidden group shadow-lg">
                      {/* Decorative pattern */}
                      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                      
                      <div className="text-center p-4 relative z-10">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 cursor-pointer border border-white/20 shadow-inner">
                          <Play className="w-8 h-8 md:w-10 md:h-10 text-orange-100 fill-orange-100 ml-1" />
                        </div>
                        <p className="body-sm text-white/90 font-medium tracking-wide uppercase">Video Panduan</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Steps */}
        <section className="py-12 md:py-16 bg-general-20 border-t border-general-30/50">
          <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24">
            <div className="text-center mb-10 md:mb-14">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-blue-100 mb-3">
                Alur Pelaporan
              </h2>
              <p className="body-sm text-general-60 max-w-2xl mx-auto">
                Ikuti 4 langkah mudah untuk melaporkan temuan Anda dengan aman dan terverifikasi.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {steps.map((item, index) => (
                <div key={index} className="relative group h-full">
                  <div className="bg-white rounded-2xl p-6 md:p-8 text-center h-full border border-general-30 shadow-sm hover:shadow-md hover:border-blue-40 transition-all duration-300 flex flex-col items-center group-hover:-translate-y-1">
                    
                    <div className="w-16 h-16 bg-blue-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shrink-0 group-hover:bg-blue-100 transition-colors duration-300">
                      <item.icon className="w-8 h-8 text-blue-100 group-hover:text-white transition-colors duration-300" />
                    </div>
                    
                    <div className="inline-block px-3 py-1 bg-orange-20 text-orange-100 text-[10px] font-bold uppercase tracking-wider rounded-full mb-4">
                      Langkah {item.step}
                    </div>
                    
                    <h3 className="h5 text-general-100 mb-3">{item.title}</h3>
                    <p className="body-sm text-general-60 leading-relaxed flex-grow">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: CTA */}
        <section className="py-16 md:py-24 bg-blue-100 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
             <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl"></div>
             <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-orange-100 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 lg:px-16 text-center">
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-white mb-6">
              Siap Mengawal Program MBG?
            </h2>
            
            <p className="body-md text-blue-20/80 mb-10 leading-relaxed max-w-2xl mx-auto">
              Kontribusi Anda sangat berarti. Mari pastikan setiap dana yang keluar tepat sasaran untuk gizi anak bangsa.
            </p>
            
            <button
              onClick={handleLaporClick}
              className="inline-flex items-center justify-center px-8 py-4 bg-orange-100 hover:bg-orange-90 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-100/20 hover:shadow-orange-100/40 transform hover:-translate-y-1 body-md w-full sm:w-auto cursor-pointer"
            >
              Mulai Laporkan Sekarang
            </button>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}