import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Users, ArrowUp, RefreshCw, Scale } from "lucide-react"

const coreValues = [
  {
    icon: Users,
    title: "Kolaborasi",
    description: "Membangun kemitraan yang kuat antara masyarakat, pemerintah, dan pemangku kepentingan.",
  },
  {
    icon: RefreshCw,
    title: "Keberlanjutan",
    description: "Memastikan program berjalan efektif dan berkelanjutan untuk generasi mendatang.",
  },
  {
    icon: ArrowUp,
    title: "Advokasi",
    description: "Memperjuangkan hak-hak masyarakat untuk mendapatkan makanan bergizi berkualitas.",
  },
  {
    icon: Scale,
    title: "Keadilan",
    description: "Menjamin distribusi yang merata dan adil di seluruh wilayah Indonesia.",
  },
]

export default function TentangKamiPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary text-white py-16 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Tentang AMP MBG</h1>
                <p className="text-white/90 text-lg leading-relaxed">
                  Asosiasi Masyarakat Pelaku Makan Bergizi Gratis (AMP MBG) adalah platform independen yang
                  didedikasikan untuk mengawal dan memastikan transparansi dalam pelaksanaan Program Makan Bergizi
                  Gratis di Indonesia.
                </p>
              </div>
              <div className="relative">
                <img src="/diverse-team-including-farmer-chef-student-officia.jpg" alt="Tim AMP MBG" className="rounded-lg shadow-xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Vision */}
              <div className="bg-white rounded-lg p-8 shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold text-primary mb-4">Visi</h2>
                <p className="text-gray-700 leading-relaxed">
                  Mewujudkan Indonesia yang sehat dan cerdas melalui program makan bergizi yang transparan, akuntabel,
                  dan berkualitas tinggi untuk seluruh anak bangsa.
                </p>
              </div>

              {/* Mission */}
              <div className="bg-white rounded-lg p-8 shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold text-primary mb-4">Misi</h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                    <span>
                      <strong>Kolaborasi:</strong> Membangun kerjasama dengan berbagai pemangku kepentingan untuk
                      pengawasan yang efektif.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                    <span>
                      <strong>Peningkatan Kapasitas:</strong> Memberdayakan masyarakat untuk berpartisipasi aktif dalam
                      pengawasan program.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                    <span>
                      <strong>Advokasi:</strong> Menyuarakan temuan dan rekomendasi kepada pihak berwenang untuk
                      perbaikan berkelanjutan.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 bg-primary-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-4">Nilai-Nilai Inti</h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Prinsip-prinsip yang menjadi landasan setiap langkah kami dalam mengawal program MBG
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {coreValues.map((value, index) => (
                <div key={index} className="bg-white rounded-lg p-6 text-center shadow-md border border-gray-200">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Join Us CTA */}
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Mari, Masyarakat!</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Bergabunglah bersama kami dalam mengawal Program Makan Bergizi Gratis. Setiap laporan Anda adalah langkah
              nyata untuk memastikan anak-anak Indonesia mendapatkan makanan bergizi yang layak.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/lapor"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
              >
                Mulai Melapor
              </a>
              <a
                href="/cara-kerja"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-primary text-primary hover:bg-primary hover:text-white font-medium rounded-lg transition-colors"
              >
                Pelajari Cara Kerjanya
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
