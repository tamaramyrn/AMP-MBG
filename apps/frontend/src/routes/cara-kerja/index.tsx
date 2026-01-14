import { createFileRoute, Link } from "@tanstack/react-router"
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
  return (
    <div className="min-h-screen flex flex-col bg-general-20">
      <Navbar />
      <main className="flex-1 pt-12">
        <section className="pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-general-20 rounded-xl shadow-sm border border-general-30 p-8 md:p-10">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <h2 className="h3 text-general-100 mb-4">Butuh Bantuan Menyusun Laporan?</h2>
                  <p className="body-md text-general-70 mb-6 text-justify">
                    Tim AMP MBG siap membantu merapikan kronologi dan memastikan laporan terekam dengan baik. Kirim pesan via WhatsApp dan kami akan memberikan panduan langkah demi langkah hingga laporan siap dikirim.
                  </p>
                  <a
                    href="https://wa.me/6281234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-100 hover:bg-blue-90 text-general-20 font-medium rounded-lg transition-colors shadow-sm body-sm font-heading mb-6"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Hubungi via WhatsApp
                  </a>
                  <div className="space-y-1 border-l-4 border-blue-40 pl-4 py-1">
                    <p className="body-sm font-bold text-general-100">
                      Jam Respons : Senin - Jumat (08.00 - 18.00 WIB)
                    </p>
                    <p className="body-sm text-general-70 text-justify">
                      Di luar jam tersebut, tim AMP MBG akan tetap memantau pesan yang masuk dan merespons secepatnya.
                    </p>
                  </div>
                </div>
                <div className="bg-blue-20 rounded-xl aspect-video flex items-center justify-center border border-blue-30">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100/20 rounded-full flex items-center justify-center mx-auto mb-3 transition-transform hover:scale-110 cursor-pointer">
                      <Play className="w-8 h-8 text-blue-100 fill-current" />
                    </div>
                    <p className="body-sm text-blue-100 font-medium">Video Panduan Pelaporan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-general-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="h2 text-center text-general-100 mb-4">Alur Pelaporan</h2>
            <p className="body-sm text-center text-general-70 mb-12 max-w-3xl mx-auto">
              Ikuti 4 langkah mudah untuk melaporkan temuan Anda dengan aman dan terverifikasi.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {steps.map((item, index) => (
                <div key={index} className="relative group">
                  <div className="bg-general-20 hover:bg-blue-20 rounded-xl p-8 text-center h-full border border-general-30 hover:border-blue-30 hover:shadow-md transition-all duration-300">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <item.icon className="w-8 h-8 text-general-20" />
                    </div>
                    <div className="inline-block px-3 py-1 bg-blue-20 text-blue-100 text-xs font-bold rounded-full mb-3 font-heading">
                      Langkah {item.step}
                    </div>
                    <h3 className="h5 text-general-100 mb-3">{item.title}</h3>
                    <p className="body-sm text-general-70 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-blue-70 text-general-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="h3 mb-6 text-general-20">Siap Membuat Laporan?</h2>
            <p className="body-sm text-general-20/90 mb-10">
              Kontribusi Anda sangat berarti untuk memastikan program MBG berjalan dengan baik dan tepat sasaran.
            </p>
            <Link
              to="/lapor"
              className="inline-flex items-center justify-center px-8 py-4 bg-general-20 text-blue-100 hover:bg-blue-20 font-bold rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 body-sm font-heading"
            >
              Mulai Laporkan Sekarang
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
