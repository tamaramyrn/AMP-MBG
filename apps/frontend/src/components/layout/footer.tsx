import { memo } from "react"
import { Link } from "@tanstack/react-router"
import { Phone, Mail } from "lucide-react"

const LEFT_LINKS = [
  { to: "/", label: "Beranda" },
  { to: "/cara-kerja", label: "Cara Kerja" },
  { to: "/lapor", label: "Lapor" },
] as const

const RIGHT_LINKS = [
  { to: "/data-laporan", label: "Data Laporan" },
  { to: "/tentang-kami", label: "Tentang Kami" },
] as const

function FooterComponent() {
  return (
    <footer className="bg-blue-100 text-general-20 border-t border-blue-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="flex items-center justify-start">
            <img
              src="/images/logo_putih.png"
              alt="Logo AMP MBG"
              loading="lazy"
              decoding="async"
              className="h-24 w-auto object-contain"
            />
          </div>

          <div className="flex gap-12 justify-start md:justify-center w-full">
            <div className="flex flex-col gap-2">
              {LEFT_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
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
                  className="body-sm text-blue-20 hover:text-general-20 hover:translate-x-1 transition-all block"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

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

        <div className="border-t border-blue-90/50 mt-8 pt-6 text-center">
          <p className="body-xs text-blue-30">
            &copy; 2026 AMP MBG. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export const Footer = memo(FooterComponent)
