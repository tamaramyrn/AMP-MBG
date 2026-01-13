import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ProfileForm } from "@/components/profile/profile-form"
import { ReportHistory } from "@/components/profile/report-history"

export default function ProfilPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">Dashboard Pengguna</h1>

          <div className="grid gap-6">
            <ProfileForm />
            <ReportHistory />

            {/* Logout Button */}
            <div className="flex justify-end">
              <button className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
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
