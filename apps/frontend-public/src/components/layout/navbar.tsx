import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import { useState, useEffect, useCallback, memo } from "react"
import { Menu, X, User, LogOut, AlertCircle } from "lucide-react"

// Konfigurasi Link Navigasi
const NAV_LINKS = [
  { to: "/", label: "Beranda", protected: false },
  { to: "/cara-kerja", label: "Cara Kerja", protected: false },
  { to: "/lapor", label: "Lapor", protected: true }, 
  { to: "/kebutuhan-dapur", label: "Kebutuhan Dapur", protected: false }, // <-- MENU BARU DITAMBAHKAN DI SINI
  { to: "/data-laporan", label: "Data Laporan", protected: false },
  { to: "/tentang-kami", label: "Tentang Kami", protected: false },
] as const

function NavbarComponent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const pathname = location.pathname
  const navigate = useNavigate()
  
  // State User
  const [currentUser, setCurrentUser] = useState<{ name: string } | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // --- 1. FUNGSI CEK LOGIN USER ---
  const checkUser = useCallback(() => {
    const userStr = localStorage.getItem("currentUser")
    setCurrentUser(userStr ? JSON.parse(userStr) : null)
  }, [])

  // Effect untuk memantau perubahan login secara realtime
  useEffect(() => {
    checkUser()
    window.addEventListener("user-login", checkUser)
    return () => window.removeEventListener("user-login", checkUser)
  }, [checkUser])

  // --- 2. LOGIKA PROTEKSI LINK ---
  const handleProtectedNavigation = (e: React.MouseEvent, _to: string, isProtected: boolean) => {
    if (isProtected && !currentUser) {
      e.preventDefault() 
      setMobileMenuOpen(false) 
      navigate({ to: "/auth/login" }) 
    } else {
      setMobileMenuOpen(false) 
    }
  }

  // --- UTILS ---
  const getFirstName = useCallback((fullName: string) => fullName.split(" ")[0], [])
  
  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((prev) => !prev), [])
  
  // --- 3. LOGIKA LOGOUT ---
  const handleLogoutClick = useCallback(() => {
    setMobileMenuOpen(false)
    setShowLogoutConfirm(true) 
  }, [])

  const confirmLogout = useCallback(() => {
    localStorage.removeItem("currentUser") 
    setCurrentUser(null) 
    setShowLogoutConfirm(false) 
    navigate({ to: "/" }) 
  }, [navigate])

  const cancelLogout = useCallback(() => setShowLogoutConfirm(false), [])

  return (
    <>
      <header className="bg-blue-100 text-white sticky top-0 z-50 shadow-sm">
        {/* UPDATE: 
            Mengganti 'max-w-7xl' dengan 'w-full' dan menyesuaikan padding 
            agar konsisten dengan halaman Cara Kerja & Footer (px-5 -> px-24).
        */}
        <nav className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo_putih.webp"
                alt="Logo AMP MBG"
                loading="eager"
                decoding="async"
                width="155"
                height="40"
                className="h-10 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(e) => handleProtectedNavigation(e, link.to, link.protected)}
                  className={`body-sm font-medium transition-colors ${
                    pathname === link.to ? "text-white border-b-2 border-white pb-1" : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Auth Button / User Profile */}
            <div className="hidden lg:flex items-center gap-3">
              {currentUser ? (
                // Tampilan SUDAH LOGIN
                <div className="flex items-center gap-4">
                  <Link 
                    to="/profil" 
                    className="flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
                  >
                    <div className="w-8 h-8 bg-blue-90 rounded-full flex items-center justify-center border border-white/20 group-hover:bg-blue-80 transition-colors">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="body-sm font-medium">Halo, {getFirstName(currentUser.name)}</span>
                  </Link>

                  <button 
                    onClick={handleLogoutClick}
                    className="text-white/70 hover:text-white transition-colors border-l border-white/20 pl-4"
                    title="Keluar"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                // Tampilan BELUM LOGIN
                <Link
                  to="/auth/login"
                  className="body-sm bg-blue-20 text-blue-100 px-4 py-2 rounded-lg font-medium hover:bg-blue-30 transition-colors"
                >
                  Masuk/Daftar
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              className="lg:hidden p-2 text-white"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 border-t border-white/20 animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col gap-2 pt-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={(e) => handleProtectedNavigation(e, link.to, link.protected)}
                    className={`body-md font-medium py-2 transition-colors ${
                      pathname === link.to ? "text-white" : "text-white/80 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Mobile Auth Section */}
                <div className="border-t border-white/20 mt-2 pt-2">
                   {currentUser ? (
                      <div className="flex items-center justify-between py-2">
                         <Link
                            to="/profil"
                            className="flex items-center gap-2 text-white hover:text-white/80"
                            onClick={() => setMobileMenuOpen(false)}
                         >
                            <User className="w-5 h-5" />
                            <span className="body-md font-medium">Halo, {getFirstName(currentUser.name)}</span>
                         </Link>
                         
                         <button 
                            onClick={handleLogoutClick}
                            className="flex items-center gap-2 text-white/80 hover:text-white"
                          >
                            <span className="text-sm">Keluar</span>
                            <LogOut className="w-4 h-4" />
                         </button>
                      </div>
                   ) : (
                      <Link
                        to="/auth/login"
                        className="block w-full body-md bg-blue-20 text-blue-100 px-4 py-2 rounded-lg font-medium text-center mt-2 hover:bg-general-20 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Masuk/Daftar
                      </Link>
                   )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

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
                onClick={cancelLogout}
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

export const Navbar = memo(NavbarComponent)