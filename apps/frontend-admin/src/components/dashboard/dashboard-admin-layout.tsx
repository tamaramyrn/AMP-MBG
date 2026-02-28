import type React from "react"
import { Link, useNavigate, useLocation } from "@tanstack/react-router"
import { useState } from "react"
import {
  LayoutDashboard,
  FileText,
  UserCog,
  Users,
  LogOut,
  AlertCircle,
  Menu,
  X,
  Utensils,
  Briefcase
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardAnggotaLayoutProps {
  children: React.ReactNode
}

export function DashboardAnggotaLayout({ children }: DashboardAnggotaLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUser] = useState<{name: string, role: string} | null>(() => {
    const userStr = localStorage.getItem("admin_currentUser")
    if (userStr) {
      const admin = JSON.parse(userStr)
      if (admin.id && admin.email) {
        return { name: admin.name, role: admin.adminRole || "Admin" }
      }
    }
    return null
  })
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState(location.pathname)

  if (!currentUser) {
    const userStr = localStorage.getItem("admin_currentUser")
    if (!userStr) {
      navigate({ to: "/auth/login" })
    } else {
      navigate({ to: "/" })
    }
  }

  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname)
    setIsMobileMenuOpen(false)
  }

  const ROLE_ACCESS: Record<string, string[]> = {
    "Super Admin": ["/dashboard", "/dashboard/laporan", "/dashboard/permintaan-kebutuhan-dapur", "/dashboard/manajemen-kebutuhan", "/dashboard/akun-admin", "/dashboard/akun-anggota"],
    "Koordinator Nasional": ["/dashboard", "/dashboard/laporan"],
    "Validator Laporan": ["/dashboard", "/dashboard/laporan"],
    "Data Analyst": ["/dashboard", "/dashboard/laporan"],
    "Operations Manager": ["/dashboard", "/dashboard/permintaan-kebutuhan-dapur", "/dashboard/manajemen-kebutuhan"],
    "HR Manager": ["/dashboard", "/dashboard/akun-anggota"],
    "Finance Manager": ["/dashboard"],
    "IT Support": ["/dashboard"],
    "Media Relations": ["/dashboard"],
  }

  const userRole = currentUser?.role || ""
  const allowedPaths = ROLE_ACCESS[userRole] || ["/dashboard", "/dashboard/laporan"]

  // Route-level access protection
  const currentPath = location.pathname
  const isPathAllowed = allowedPaths.some(p => p === "/dashboard" ? currentPath === "/dashboard" : currentPath.startsWith(p))
  if (currentUser && !isPathAllowed) {
    navigate({ to: "/dashboard" })
  }

  const confirmLogout = () => {
    localStorage.removeItem("admin_currentUser")
    localStorage.removeItem("admin_token")
    window.dispatchEvent(new Event("user-login"))
    setShowLogoutConfirm(false)
    navigate({ to: "/auth/login" })
  }

  const allNavItems = [
    {
      to: "/dashboard",
      label: "Beranda",
      icon: LayoutDashboard,
      exact: true
    },
    {
      to: "/dashboard/laporan",
      label: "Laporan Masuk",
      icon: FileText,
      exact: false
    },
    {
      to: "/dashboard/permintaan-kebutuhan-dapur",
      label: "Permintaan Dapur",
      icon: Utensils,
      exact: false
    },
    {
      to: "/dashboard/manajemen-kebutuhan",
      label: "Manajemen Kebutuhan",
      icon: Briefcase,
      exact: false
    },
    {
      to: "/dashboard/akun-admin",
      label: "Akun Admin",
      icon: UserCog,
      exact: true
    },
    {
      to: "/dashboard/akun-anggota",
      label: "Akun Anggota",
      icon: Users,
      exact: true
    },
  ]
  const navItems = allNavItems.filter(item => allowedPaths.includes(item.to))

  const isActive = (path: string, exact: boolean) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen w-full bg-general-20 font-sans text-general-100 overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-general-20 border-r border-general-30 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* Logo area */}
        <div className="h-16 lg:h-20 flex items-center justify-between lg:justify-center px-6 border-b border-general-30 shrink-0 bg-general-20 relative">
           <img
             src="/logo_hijau.webp"
             alt="AMP MBG"
             width="140"
             height="50"
             className="h-10 w-auto object-contain"
           /> 
           <button 
             onClick={() => setIsMobileMenuOpen(false)}
             className="lg:hidden p-2 text-general-60 hover:bg-general-30 rounded-lg absolute right-4"
           >
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-general-30">
          {navItems.map((item) => {
            const active = isActive(item.to, item.exact)
            return (
              <Link 
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                  active 
                    ? "bg-blue-100 text-general-20 shadow-md font-bold"
                    : "text-general-60 hover:bg-general-30 hover:text-general-100 font-medium"
                )}
              >
                <item.icon className={cn("w-5 h-5", active ? "text-general-20" : "text-general-50 group-hover:text-general-100")} />
                <span className="body-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-general-30 shrink-0 bg-general-20">
          <div className="flex items-center gap-3 px-2">
            <div className="flex-1 min-w-0">
              <p className="body-sm font-heading font-bold text-general-100 truncate">
                {currentUser?.name || "Administrator"}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-general-60 truncate font-bold">
                {currentUser?.role || 'Admin Panel'}
              </p>
            </div>
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-general-40 hover:text-red-100 hover:bg-red-20 rounded-lg transition-colors"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full transition-all duration-300 lg:ml-64">
        
        {/* Mobile Header */}
        <header className="lg:hidden h-16 flex items-center px-4 border-b border-general-30 bg-general-20 sticky top-0 z-20 shrink-0 relative">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="p-2 -ml-2 text-general-60 hover:bg-general-30 rounded-lg"
             >
               <Menu className="w-6 h-6" />
             </button>
             <span className="font-heading font-bold text-lg text-general-100">Dashboard</span>
          </div>
          
          {/* Centered logo */}
          <img
             src="/logo_hijau.webp"
             alt="Logo"
             className="h-8 w-auto object-contain absolute left-1/2 -translate-x-1/2"
           /> 
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-general-20 w-full">
           {children}
        </main>
      </div>

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-general-20 rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 border border-general-30">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 bg-red-20 rounded-full flex items-center justify-center mb-4 border border-red-30 shadow-inner">
                <AlertCircle className="w-7 h-7 text-red-100" />
              </div>
              <h3 className="h5 text-general-100 mb-2 font-heading">Konfirmasi Keluar</h3>
              <p className="body-sm text-general-60">
                Apakah Anda yakin ingin keluar dari sesi ini?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 border border-general-30 text-general-80 font-bold rounded-xl hover:bg-general-30 transition-colors body-sm"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3 bg-red-100 text-general-20 font-bold rounded-xl hover:bg-red-90 transition-all body-sm shadow-md"
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