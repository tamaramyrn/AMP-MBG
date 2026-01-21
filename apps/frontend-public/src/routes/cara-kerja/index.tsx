import { createFileRoute, useNavigate } from "@tanstack/react-router"
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
  const navigate = useNavigate()

  // Handler untuk cek status login sebelum navigasi
  const handleLaporClick = () => {
    const user = localStorage.getItem("currentUser")
    
    if (user) {
      // Jika sudah login -> ke halaman Lapor
      navigate({ to: "/lapor" })
    } else {
      // Jika belum login -> ke halaman Auth (Login/Daftar)
      navigate({ to: "/auth/login" })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-general-20">
      <Navbar />
      
      <main className="flex-1 pt-8 md:pt-12">
        
        {/* --- Section 1: Hero / Bantuan --- */}
        <section className="pb-8 md:pb-10">
          <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24">
            <div className="bg-general-20 rounded-xl shadow-sm border border-general-30 p-6 md:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                
                {/* Kolom Kiri: Teks */}
                <div className="order-2 lg:order-1">
                  <h2 className="h3 text-general-100 mb-4 text-center lg:text-left">
                    Butuh Bantuan Menyusun Laporan?
                  </h2>
                  <p className="body-md text-general-70 mb-6 text-justify lg:text-left leading-relaxed max-w-xl">
                    Tim AMP MBG siap membantu merapikan kronologi dan memastikan laporan terekam dengan baik. Kirim pesan via WhatsApp dan kami akan memberikan panduan langkah demi langkah hingga laporan siap dikirim.
                  </p>
                  
                  <div className="flex justify-center lg:justify-start mb-6">
                    <a
                      href="https://wa.me/6281234567890"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-orange-100 hover:bg-orange-90 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-xl transform hover:-translate-y-1 body-sm font-heading w-full sm:w-auto justify-center"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Hubungi via WhatsApp
                    </a>
                  </div>

                  <div className="space-y-1 border-l-4 border-orange-50 pl-4 py-1">
                    <p className="body-sm font-bold text-general-100">
                      Jam Respons : Senin - Jumat (08.00 - 18.00 WIB)
                    </p>
                    <p className="body-sm text-general-70 text-justify max-w-lg">
                      Di luar jam tersebut, tim AMP MBG akan tetap memantau pesan yang masuk dan merespons secepatnya.
                    </p>
                  </div>
                </div>

                {/* Kolom Kanan: Video */}
                <div className="order-1 lg:order-2 bg-blue-20 rounded-xl aspect-video flex items-center justify-center border border-blue-30 w-full">
                  <div className="text-center p-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100/20 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform hover:scale-110 cursor-pointer">
                      <Play className="w-6 h-6 md:w-8 md:h-8 text-blue-100 fill-current" />
                    </div>
                    <p className="body-sm text-blue-100 font-medium">Video Panduan Pelaporan</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* --- Section 2: Alur Pelaporan --- */}
        <section className="py-10 md:py-16 bg-general-20">
          <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24">
            <h2 className="h3 text-center text-general-100 mb-4">Alur Pelaporan</h2>
            <p className="body-sm text-center text-general-70 mb-8 md:mb-12 max-w-4xl mx-auto">
              Ikuti 4 langkah mudah untuk melaporkan temuan Anda dengan aman dan terverifikasi.
            </p>
            
            {/* Grid Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {steps.map((item, index) => (
                <div key={index} className="relative group h-full">
                  <div className="bg-general-20 hover:bg-blue-20 rounded-xl p-6 md:p-8 text-center h-full border border-general-30 hover:border-blue-30 hover:shadow-md transition-all duration-300 flex flex-col items-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-sm shrink-0">
                      <item.icon className="w-6 h-6 md:w-8 md:h-8 text-general-20" />
                    </div>
                    <div className="inline-block px-3 py-1 bg-blue-20 text-blue-100 text-xs font-bold rounded-full mb-3 font-heading">
                      Langkah {item.step}
                    </div>
                    <h3 className="h5 text-general-100 mb-3">{item.title}</h3>
                    <p className="body-sm text-general-70 leading-relaxed flex-grow">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Section 3: Call To Action --- */}
        <section className="py-12 md:py-20 bg-orange-100 text-general-20">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-16 text-center">
            <h2 className="h3 mb-4 md:mb-6 text-general-20">Siap Membuat Laporan?</h2>
            
            <p className="body-sm text-general-20/90 mb-8 md:mb-10 w-full">
              Kontribusi Anda sangat berarti untuk memastikan program MBG berjalan dengan baik dan tepat sasaran.
            </p>
            
            <button
              onClick={handleLaporClick}
              className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-general-20 text-orange-100 hover:bg-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 body-sm font-heading w-full sm:w-auto cursor-pointer"
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