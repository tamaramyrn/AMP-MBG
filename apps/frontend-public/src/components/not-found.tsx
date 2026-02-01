import { Link } from "@tanstack/react-router"
import { Home, ArrowLeft, AlertTriangle } from "lucide-react"

export function NotFound() {
  return (
    <div className="min-h-screen bg-general-20 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-general-30 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="AMP MBG" className="h-8 w-auto" />
            <span className="font-heading font-bold text-general-100">AMP MBG</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-lg mx-auto">
          {/* Icon */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-orange-20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-16 h-16 text-orange-100" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full border border-general-30 shadow-sm">
              <span className="font-heading font-bold text-4xl text-general-100">404</span>
            </div>
          </div>

          {/* Text */}
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-general-100 mb-3">
            Halaman Tidak Ditemukan
          </h1>
          <p className="body-md text-general-60 mb-8 leading-relaxed">
            Maaf, halaman yang Anda cari tidak ada atau sudah dipindahkan.
            Pastikan URL yang dimasukkan sudah benar.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-100 hover:bg-blue-90 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg body-sm"
            >
              <Home className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-general-30 text-general-70 hover:text-blue-100 hover:border-blue-100 font-bold rounded-xl transition-all body-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Halaman Sebelumnya
            </button>
          </div>

          {/* Help Links */}
          <div className="mt-12 pt-8 border-t border-general-30">
            <p className="body-sm text-general-50 mb-4">Mungkin Anda mencari:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/lapor"
                className="px-4 py-2 bg-general-20 hover:bg-blue-20 text-general-70 hover:text-blue-100 rounded-lg transition-colors body-sm font-medium"
              >
                Buat Laporan
              </Link>
              <Link
                to="/data-laporan"
                className="px-4 py-2 bg-general-20 hover:bg-blue-20 text-general-70 hover:text-blue-100 rounded-lg transition-colors body-sm font-medium"
              >
                Data Laporan
              </Link>
              <Link
                to="/kebutuhan-dapur"
                className="px-4 py-2 bg-general-20 hover:bg-blue-20 text-general-70 hover:text-blue-100 rounded-lg transition-colors body-sm font-medium"
              >
                Kebutuhan Dapur
              </Link>
              <Link
                to="/tentang-kami"
                className="px-4 py-2 bg-general-20 hover:bg-blue-20 text-general-70 hover:text-blue-100 rounded-lg transition-colors body-sm font-medium"
              >
                Tentang Kami
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-general-30 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="body-sm text-general-50">
            &copy; {new Date().getFullYear()} Aliansi Masyarakat Peduli MBG. Hak Cipta Dilindungi.
          </p>
        </div>
      </footer>
    </div>
  )
}
