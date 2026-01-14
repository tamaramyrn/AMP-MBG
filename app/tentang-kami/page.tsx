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
    <div className="min-h-screen flex flex-col bg-general-20">
      <Navbar />
      <main className="flex-1">
        
        {/* Hero Section */}
        <section className="bg-blue-70 text-general-20 relative overflow-hidden">
          
          {/* GAMBAR DESKTOP (Hanya muncul di md ke atas) */}
          <div className="absolute top-0 right-0 bottom-0 w-[70%] lg:w-[75%] hidden md:block">
            <img 
              src="/images/tentang_kami.png" 
              alt="Tim AMP MBG" 
              className="w-full h-full object-cover object-left" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-70 via-transparent to-transparent opacity-90"></div>
          </div>

          {/* KONTAINER UTAMA (Teks) */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid md:grid-cols-2 items-center min-h-[300px] lg:min-h-[200px]"> 
              
              {/* Kolom Kiri: Teks */}
              <div className="py-16 md:py-24 md:pr-12">
                <h1 className="h1 font-bold mb-6">Tentang <br/> AMP MBG</h1>
                <p className="body-md text-general-20/90 leading-relaxed text-justify max-w-lg">
                  Asosiasi Masyarakat Pelaku Makan Bergizi Gratis (AMP MBG) adalah platform independen yang
                  didedikasikan untuk mengawal dan memastikan transparansi dalam pelaksanaan Program Makan Bergizi
                  Gratis di Indonesia.
                </p>
              </div>

              {/* UBAH: Kode Gambar Mobile (md:hidden) SUDAHDIHAPUS di sini agar hilang saat layar kecil */}

            </div>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="py-20 md:py-28 bg-general-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              
              {/* Vision Card */}
              <div className="bg-general-20 rounded-xl p-8 md:p-10 shadow-sm border border-general-30 hover:border-blue-30 transition-all h-full flex flex-col">
                <h2 className="h3 text-blue-100 mb-6">Visi</h2>
                <p className="body-md text-general-70 leading-relaxed">
                  Mewujudkan Indonesia yang sehat dan cerdas melalui program makan bergizi yang transparan, akuntabel,
                  dan berkualitas tinggi untuk seluruh anak bangsa.
                </p>
              </div>

              {/* Mission Card */}
              <div className="bg-general-20 rounded-xl p-8 md:p-10 shadow-sm border border-general-30 hover:border-blue-30 transition-all h-full flex flex-col">
                <h2 className="h3 text-blue-100 mb-6">Misi</h2>
                <ul className="space-y-5 body-md text-general-70">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-blue-100 rounded-full mt-2.5 shrink-0" />
                    <span>
                      <strong className="block text-general-100 mb-1">Meningkatkan Kolaborasi</strong> 
                      Membangun kerjasama dengan berbagai pemangku kepentingan untuk pengawasan yang efektif.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-blue-100 rounded-full mt-2.5 shrink-0" />
                    <span>
                      <strong className="block text-general-100 mb-1">Meningkatkan Kapasitas</strong>
                      Memberdayakan masyarakat untuk berpartisipasi aktif dalam pengawasan program.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-blue-100 rounded-full mt-2.5 shrink-0" />
                    <span>
                      <strong className="block text-general-100 mb-1">Advokasi dan Aspirasi</strong>
                      Menyuarakan temuan dan rekomendasi kepada pihak berwenang untuk perbaikan berkelanjutan.
                    </span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-20 md:py-28 bg-blue-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="h3 text-general-100 mb-4">Nilai-Nilai Inti</h2>
              <p className="body-sm text-general-70 max-w-2xl mx-auto">
                Prinsip-prinsip yang menjadi landasan setiap langkah kami dalam mengawal program MBG.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {coreValues.map((value, index) => (
                <div 
                  key={index} 
                  className="bg-general-20 rounded-xl p-8 text-center shadow-sm border border-general-30 hover:border-blue-30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-blue-30 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-300">
                    <value.icon className="w-8 h-8 text-blue-100 group-hover:text-general-20 transition-colors" />
                  </div>
                  
                  <h3 className="h5 text-general-100 mb-3 group-hover:text-blue-100 transition-colors">
                    {value.title}
                  </h3>
                  
                  <p className="body-sm text-general-70 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Join Us CTA */}
        <section className="py-16 md:py-24 bg-general-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="h3 text-general-100 mb-6">Mari, Masyarakat!</h2>
            <p className="body-md text-general-70 mb-10 leading-relaxed">
              Bergabunglah bersama kami dalam mengawal Program Makan Bergizi Gratis. Setiap laporan Anda adalah langkah
              nyata untuk memastikan anak-anak Indonesia mendapatkan makanan bergizi yang layak.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/lapor"
                className="inline-flex items-center justify-center px-8 py-3 bg-blue-100 hover:bg-blue-90 text-general-20 font-medium rounded-lg transition-colors body-sm font-heading shadow-sm"
              >
                Mulai Melapor
              </a>
              <a
                href="/cara-kerja"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-blue-100 text-blue-100 hover:bg-blue-100 hover:text-general-20 font-medium rounded-lg transition-all body-sm font-heading"
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