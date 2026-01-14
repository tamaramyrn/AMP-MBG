import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { Menu, X, User, LogOut, AlertCircle } from "lucide-react"

const navLinks = [
  { to: "/", label: "Beranda" },
  { to: "/cara-kerja", label: "Cara Kerja" },
  { to: "/lapor", label: "Lapor" },
  { to: "/data-laporan", label: "Data Laporan" },
  { to: "/tentang-kami", label: "Tentang Kami" },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // TanStack Router Hooks
  const location = useLocation()
  const pathname = location.pathname
  const navigate = useNavigate()
  
  // State user
  const [currentUser, setCurrentUser] = useState<{name: string} | null>(null)
  
  // State untuk Pop-up Konfirmasi Logout
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Fungsi cek user di localStorage
  const checkUser = () => {
    const userStr = localStorage.getItem("currentUser")
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    } else {
      setCurrentUser(null)
    }
  }

  // Effect untuk memantau status login
  useEffect(() => {
    checkUser()
    const handleLoginEvent = () => checkUser()
    window.addEventListener("user-login", handleLoginEvent)
    return () => {
      window.removeEventListener("user-login", handleLoginEvent)
    }
  }, [])

  // Helper nama depan
  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0]
  }

  // 1. Fungsi saat tombol "Keluar" ditekan (Hanya buka modal)
  const handleLogoutClick = () => {
    setMobileMenuOpen(false) 
    setShowLogoutConfirm(true) 
  }

  // 2. Fungsi Eksekusi Logout (Dijalankan jika pilih "Ya")
  const confirmLogout = () => {
    localStorage.removeItem("currentUser")
    setCurrentUser(null)
    setShowLogoutConfirm(false)
    navigate({ to: "/" }) // Redirect menggunakan TanStack Router
  }

  return (
    <>
      <header className="bg-blue-100 text-white sticky top-0 z-50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/images/logo_putih.png"
                alt="Logo AMP MBG"
                // UBAH: h-14 menjadi h-10 agar lebih kecil
                className="h-10 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`body-sm font-medium transition-colors ${
                    pathname === link.to ? "text-white border-b-2 border-white pb-1" : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth Button / User Profile (Desktop) */}
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
                  to="/auth/register"
                  className="body-sm bg-blue-20 text-blue-100 px-4 py-2 rounded-lg font-medium hover:bg-blue-30 transition-colors"
                >
                  Masuk/Daftar
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 border-t border-white/20">
              <div className="flex flex-col gap-2 pt-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`body-md font-medium py-2 transition-colors ${
                      pathname === link.to ? "text-white" : "text-white/80 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

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
                        to="/auth/register"
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

      {/* ======================================= */}
      {/* MODAL KONFIRMASI LOGOUT */}
      {/* ======================================= */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-general-20 rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
            
            {/* Icon & Title */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-10 rounded-full flex items-center justify-center mb-4 bg-red-50">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="h4 text-general-100 mb-2">Konfirmasi Keluar</h3>
              <p className="body-sm text-general-60">
                Apakah Anda yakin ingin keluar dari akun ini?
              </p>
            </div>

            {/* Buttons */}
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