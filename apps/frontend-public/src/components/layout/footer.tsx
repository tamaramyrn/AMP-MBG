import { memo, useCallback } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { Phone, Mail } from "lucide-react"

const LEFT_LINKS = [
  { to: "/", label: "Beranda", protected: false },
  { to: "/cara-kerja", label: "Cara Kerja", protected: false },
  { to: "/lapor", label: "Lapor", protected: true },
] as const

const RIGHT_LINKS = [
  { to: "/kebutuhan-dapur", label: "Kebutuhan Dapur", protected: false },
  { to: "/data-laporan", label: "Data Laporan", protected: false },
  { to: "/tentang-kami", label: "Tentang Kami", protected: false },
] as const

function FooterComponent() {
  const navigate = useNavigate()

  const handleProtectedNavigation = useCallback((e: React.MouseEvent, _to: string, isProtected: boolean) => {
    if (isProtected) {
      const user = localStorage.getItem("public_currentUser")
      if (!user) {
        e.preventDefault()
        navigate({ to: "/auth/login" })
      }
    }
  }, [navigate])

  return (
    <footer className="bg-blue-100 text-general-20 border-t border-blue-90">
      {/* UPDATE: 
         Mengganti 'max-w-7xl' dengan 'w-full' dan menyesuaikan 'px' 
         agar selaras dengan halaman Cara Kerja (px-5 -> px-24).
      */}
      <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Logo Section */}
          <div className="flex items-center justify-start">
            <img
              src="/logo_putih.webp"
              alt="Logo AMP MBG"
              loading="lazy"
              decoding="async"
              width="372"
              height="96"
              className="h-24 w-auto object-contain"
            />
          </div>

          {/* Links Section */}
          <div className="flex gap-12 justify-start md:justify-center w-full">
            <div className="flex flex-col gap-2">
              {LEFT_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(e) => handleProtectedNavigation(e, link.to, link.protected)}
                  className="body-sm text-blue-20 hover:text-general-20 hover:translate-x-1 transition-all block"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {RIGHT_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(e) => handleProtectedNavigation(e, link.to, link.protected)}
                  className="body-sm text-blue-20 hover:text-general-20 hover:translate-x-1 transition-all block"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="flex flex-col gap-2 items-start md:items-end">
            <h4 className="text-xs uppercase tracking-widest text-blue-30 font-semibold mb-1">Hubungi Kami</h4>
            <a
              href="tel:+6281200000000"
              className="flex items-center gap-2 text-blue-20 hover:text-general-20 transition-colors body-sm"
            >
              <Phone className="w-4 h-4" />
              <span>+62 812 0000 0000</span>
            </a>
            <a
              href="mailto:ampmbg@gmail.com"
              className="flex items-center gap-2 text-blue-20 hover:text-general-20 transition-colors body-sm"
            >
              <Mail className="w-4 h-4" />
              <span>ampmbg@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-blue-90/50 mt-8 pt-6 text-center">
          <p className="body-xs text-blue-30">
            &copy; {new Date().getFullYear()} AMP MBG. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export const Footer = memo(FooterComponent)