import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ReportForm } from "@/components/report/report-form"

export default function LaporPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Formulir Pelaporan Ketidaksesuaian Pelaksanaan MBG
            </h1>
            <p className="text-gray-600">Lengkapi formulir di bawah untuk melaporkan temuan Anda</p>
          </div>
          <ReportForm />
        </div>
      </main>
      <Footer />
    </div>
  )
}
