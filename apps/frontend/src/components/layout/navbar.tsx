import { Link, useLocation } from "@tanstack/react-router"
import { useState } from "react"
import { Menu, X } from "lucide-react"

const navLinks = [
  { to: "/", label: "Beranda" },
  { to: "/cara-kerja", label: "Cara Kerja" },
  { to: "/lapor", label: "Lapor" },
  { to: "/data-laporan", label: "Data Laporan" },
  { to: "/tentang-kami", label: "Tentang Kami" },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const pathname = location.pathname

  return (
    <header className="bg-blue-100 text-white sticky top-0 z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/images/logo_putih.png"
              alt="Logo AMP MBG"
              className="h-14 w-auto object-contain"
            />
          </Link>

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

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/auth/register"
              className="body-sm bg-blue-20 text-blue-100 px-4 py-2 rounded-lg font-medium hover:bg-blue-30 transition-colors"
            >
              Masuk/Daftar
            </Link>
          </div>

          <button
            className="lg:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

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
              <Link
                to="/auth/register"
                className="body-md bg-blue-20 text-blue-100 px-4 py-2 rounded-lg font-medium text-center mt-2 hover:bg-general-20 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Masuk/Daftar
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
