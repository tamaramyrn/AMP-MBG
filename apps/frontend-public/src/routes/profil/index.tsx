import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ProfileForm } from "@/components/profile/profile-form"
import { ReportHistory } from "@/components/profile/report-history"
import { KitchenNeedsHistory } from "@/components/profile/kitchen-needs-history"
import { useState, useEffect } from "react"
import { AlertCircle, Users, ArrowRight, LogOut } from "lucide-react"
import { authService } from "@/services/auth"
import { useSEO } from "@/hooks/use-seo"

export const Route = createFileRoute("/profil/")({
  component: ProfilPage,
})

function ProfilPage() {
  useSEO({ title: "Profil", description: "Kelola profil akun AMP MBG", path: "/profil/", noindex: true })
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [canApplyMember, setCanApplyMember] = useState(false)

  useEffect(() => {
    const user = authService.getCurrentUser()
    // Show member banner
    setCanApplyMember(!!user && !user.isMember)
  }, [])

  const confirmLogout = () => {
    localStorage.removeItem("public_currentUser")
    localStorage.removeItem("public_token")
    window.dispatchEvent(new Event("user-login"))
    setShowLogoutConfirm(false)
    navigate({ to: "/" })
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-general-20 font-sans">
        <Navbar />
        
        <main className="flex-1 py-10 md:py-14">
          <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-general-100">
                  Dashboard <span className="text-blue-100">Pengguna</span>
                </h1>
                <p className="body-sm text-general-60 mt-1">
                  Kelola informasi akun dan pantau status laporan Anda.
                </p>
              </div>

              {/* Desktop logout button */}
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-red-100/10 hover:bg-red-100 hover:text-white text-red-100 font-medium rounded-xl transition-all body-sm border border-red-100/20"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>

            <div className="grid gap-8">
              {/* 1. Profile form */}
              <div className="w-full">
                <ProfileForm />
              </div>

              {/* 2. Member banner */}
              {canApplyMember && (
                <div className="w-full bg-blue-20/50 border border-blue-30 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/5 rounded-full blur-2xl -mr-10 -mt-10" />
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-5 relative z-10">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-100/20">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="h5 text-general-100 mb-2 font-bold">Bergabung Sebagai Anggota AMP MBG</h3>
                      <p className="body-sm text-general-60 mb-0 max-w-2xl leading-relaxed">
                        Daftarkan organisasi atau komunitas Anda untuk menjadi anggota resmi AMP MBG. Dapatkan akses kolaborasi lebih luas dan kontribusi langsung dalam pengawasan program.
                      </p>
                    </div>
                    <Link
                      to="/daftar-anggota"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-orange-100 hover:bg-orange-90 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 body-sm whitespace-nowrap"
                    >
                      Daftar Sekarang
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}

              {/* 3. Report history */}
              <div className="w-full">
                <ReportHistory />
              </div>

              {/* 4. Kitchen needs history */}
              <div className="w-full">
                <KitchenNeedsHistory />
              </div>

              {/* Mobile logout button */}
              <div className="md:hidden mt-4">
                <button 
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-100 text-white font-medium rounded-xl transition-colors body-sm shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar dari Akun
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* Logout confirm modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-general-100/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 md:p-8 transform transition-all scale-100 border border-general-30">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 bg-red-20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-red-100" />
              </div>
              <h3 className="h4 font-bold text-general-100 mb-2">Konfirmasi Keluar</h3>
              <p className="body-sm text-general-60">
                Apakah Anda yakin ingin keluar dari akun ini? Anda harus masuk kembali untuk mengakses fitur laporan.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 border border-general-30 text-general-80 font-bold rounded-xl hover:bg-general-20 transition-colors body-sm"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3 bg-red-100 hover:bg-red-90 text-white font-bold rounded-xl transition-colors body-sm shadow-md"
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