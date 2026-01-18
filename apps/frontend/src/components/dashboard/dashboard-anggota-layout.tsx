import type React from "react"
import { Link, useNavigate, useLocation } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  FileText,
  UserCog,
  Users,
  LogOut,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardAnggotaLayoutProps {
  children: React.ReactNode
}

export function DashboardAnggotaLayout({ children }: DashboardAnggotaLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState<{name: string, role: string} | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // 1. Cek User (Auth Guard) - Only admin and associate can access
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser")
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.role === "admin" || user.role === "associate") {
        setCurrentUser(user)
      } else {
        navigate({ to: "/" })
      }
    } else {
      navigate({ to: "/auth/login-anggota" })
    }
  }, [navigate])

  // 2. Fungsi Logout
  const confirmLogout = () => {
    localStorage.removeItem("currentUser")
    window.dispatchEvent(new Event("user-login"))
    setShowLogoutConfirm(false)
    navigate({ to: "/" })
  }

  const navItems = [
    { to: "/dashboard", label: "Beranda", icon: LayoutDashboard, exact: true },
    { to: "/dashboard/laporan", label: "Laporan", icon: FileText, exact: false },
    { to: "/dashboard/akun-admin", label: "Akun Admin", icon: UserCog, exact: true },
    { to: "/dashboard/akun-asosiasi", label: "Akun Asosiasi", icon: Users, exact: true },
  ]

  // Helper cek active link
  const isActive = (path: string, exact: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen w-full bg-general-20 font-sans text-general-100">
      
      {/* --- SIDEBAR (FIXED) --- */}
      <aside className="w-64 bg-general-20 border-r border-general-30 flex flex-col fixed inset-y-0 left-0 z-20">
        
        {/* LOGO AREA */}
        <div className="h-24 flex items-center justify-center px-6 border-b border-general-30 shrink-0">
           <img
             src="/logo_hijau.webp"
             alt="AMP MBG"
             loading="eager"
             decoding="async"
             width="155"
             height="64"
             className="h-16 w-auto object-contain"
           /> 
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.to, item.exact)
            return (
              <Link 
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  active 
                    ? "bg-blue-100 text-general-20 shadow-sm"
                    : "text-general-60 hover:bg-general-30 hover:text-general-100"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="body-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* USER PROFILE */}
        <div className="p-4 border-t border-general-30 shrink-0">
          <div className="flex items-center gap-3 px-2">
            <div className="flex-1 min-w-0">
              <p className="body-sm font-heading font-bold text-general-100 truncate">
                {currentUser?.name || "Anggota"}
              </p>
              <p className="body-xs text-general-60 truncate">
                {currentUser?.role === 'school' ? 'Pihak Sekolah' : 'Anggota Resmi'}
              </p>
            </div>
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="text-general-40 hover:text-red-100 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <main className="flex-1 ml-64 overflow-y-auto h-full bg-general-20">
        {children}
      </main>

      {/* --- MODAL LOGOUT --- */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-general-20 rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-30 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-100" />
              </div>
              <h3 className="h5 text-general-100 mb-2">Konfirmasi Keluar</h3>
              <p className="body-sm text-general-60">
                Apakah Anda yakin ingin keluar dari akun anggota ini?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 border border-general-30 text-general-80 font-medium rounded-lg hover:bg-general-30 transition-colors body-sm"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 bg-red-100 text-general-20 font-medium rounded-lg hover:bg-red-90 transition-colors body-sm shadow-sm"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}