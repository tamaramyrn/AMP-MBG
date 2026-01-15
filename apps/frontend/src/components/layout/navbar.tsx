import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import { useState, useEffect, useCallback, memo } from "react"
import { Menu, X, User, LogOut, AlertCircle } from "lucide-react"

const NAV_LINKS = [
  { to: "/", label: "Beranda" },
  { to: "/cara-kerja", label: "Cara Kerja" },
  { to: "/lapor", label: "Lapor" },
  { to: "/data-laporan", label: "Data Laporan" },
  { to: "/tentang-kami", label: "Tentang Kami" },
] as const

function NavbarComponent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const pathname = location.pathname
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<{ name: string } | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const checkUser = useCallback(() => {
    const userStr = localStorage.getItem("currentUser")
    setCurrentUser(userStr ? JSON.parse(userStr) : null)
  }, [])

  useEffect(() => {
    checkUser()
    window.addEventListener("user-login", checkUser)
    return () => window.removeEventListener("user-login", checkUser)
  }, [checkUser])

  const getFirstName = useCallback((fullName: string) => fullName.split(" ")[0], [])

  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((prev) => !prev), [])
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

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
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/images/logo_putih.png"
                alt="Logo AMP MBG"
                loading="eager"
                decoding="async"
                className="h-10 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
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
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 border-t border-white/20">
              <div className="flex flex-col gap-2 pt-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`body-md font-medium py-2 transition-colors ${
                      pathname === link.to ? "text-white" : "text-white/80 hover:text-white"
                    }`}
                    onClick={closeMobileMenu}
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
                            onClick={closeMobileMenu}
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
                        onClick={closeMobileMenu}
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