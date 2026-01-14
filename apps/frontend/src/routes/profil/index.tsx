import { createFileRoute } from "@tanstack/react-router"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ProfileForm } from "@/components/profile/profile-form"
import { ReportHistory } from "@/components/profile/report-history"

export const Route = createFileRoute("/profil/")({
  component: ProfilPage,
})

function ProfilPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-general-20 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="h3 text-general-100 mb-8">Dashboard Pengguna</h1>
          <div className="grid gap-6">
            <ProfileForm />
            <ReportHistory />
            <div className="flex justify-end">
              <button className="px-6 py-2.5 bg-red-100 hover:bg-red-90 text-general-20 font-heading font-medium rounded-lg transition-colors body-sm">
                Keluar
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
