import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ProfileForm } from "@/components/profile/profile-form"
import { ReportHistory } from "@/components/profile/report-history"
import { useState } from "react"
import { AlertCircle } from "lucide-react"

export const Route = createFileRoute("/profil/")({
  component: ProfilPage,
})

function ProfilPage() {
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Fungsi untuk mengeksekusi logout
  const confirmLogout = () => {
    // 1. Hapus data sesi
    localStorage.removeItem("currentUser")
    
    // 2. Kabari komponen lain (seperti Navbar) bahwa user sudah logout
    window.dispatchEvent(new Event("user-login"))
    
    // 3. Tutup modal
    setShowLogoutConfirm(false)
    
    // 4. Kembali ke beranda
    navigate({ to: "/" })
  }

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-general-20 py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="h3 text-general-100 mb-8">Dashboard Pengguna</h1>
            <div className="grid gap-6">
              <ProfileForm />
              <ReportHistory />
              <div className="flex justify-end">
                {/* Tombol memicu modal */}
                <button 
                  onClick={() => setShowLogoutConfirm(true)}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-heading font-medium rounded-lg transition-colors body-sm"
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* MODAL KONFIRMASI LOGOUT */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-general-20 rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="h4 text-general-100 mb-2">Konfirmasi Keluar</h3>
              <p className="body-sm text-general-60">
                Apakah Anda yakin ingin keluar dari akun ini?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 border border-general-30 text-general-80 font-medium rounded-lg hover:bg-general-30/50 transition-colors body-sm"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors body-sm shadow-sm"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}