import { createFileRoute } from "@tanstack/react-router"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ReportForm } from "@/components/report/report-form"

export const Route = createFileRoute("/lapor/")({
  component: LaporPage,
})

function LaporPage() {
  return (
    <div className="min-h-screen flex flex-col bg-general-20">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-12">
            <h1 className="h3 text-general-100 mb-4">Formulir Pelaporan Ketidaksesuaian Pelaksanaan MBG</h1>
            <p className="body-md text-general-70">Lengkapi formulir di bawah untuk melaporkan temuan Anda</p>
          </div>
          <ReportForm />
        </div>
      </main>
      <Footer />
    </div>
  )
}
