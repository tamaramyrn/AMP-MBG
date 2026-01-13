"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/cara-kerja", label: "Cara Kerja" },
  { href: "/lapor", label: "Lapor" },
  { href: "/data-laporan", label: "Data Laporan" },
  { href: "/tentang-kami", label: "Tentang Kami" },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="bg-blue-100 text-white sticky top-0 z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-3">
              <img 
                src="/images/logo_putih.png" 
                alt="Logo AMP MBG" 
                className="h-10 w-auto object-contain"
              />
              
              <div className="flex flex-col leading-none">
                {/* Font size TIDAK DIUBAH (tetap 'title' sesuai kode Anda) */}
                <span className="title text-white">AMP</span>
                <span className="title text-white">MBG</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {/* PERUBAHAN: Ganti 'md:flex' jadi 'lg:flex'. 
              Menu ini sekarang hanya muncul di layar Besar (Laptop/Desktop). 
              Di Tablet dia akan sembunyi (hidden). */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`body-sm font-medium transition-colors ${
                  pathname === link.href ? "text-white border-b-2 border-white pb-1" : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Button (Desktop) */}
          {/* PERUBAHAN: Ganti 'md:flex' jadi 'lg:flex' agar konsisten */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/auth/register"
              className="body-sm bg-blue-20 text-blue-100 px-4 py-2 rounded-lg font-medium hover:bg-blue-30 transition-colors"
            >
              Masuk/Daftar
            </Link>
          </div>

          {/* Mobile Menu Button */}
          {/* PERUBAHAN: Ganti 'md:hidden' jadi 'lg:hidden'.
              Artinya tombol Hamburger ini akan TETAP MUNCUL di layar Tablet (md).
              Baru hilang kalau layar sudah masuk ukuran Large (lg). */}
          <button
            className="lg:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {/* PERUBAHAN: Ganti 'md:hidden' jadi 'lg:hidden' */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-white/20">
            <div className="flex flex-col gap-2 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`body-md font-medium py-2 transition-colors ${
                    pathname === link.href ? "text-white" : "text-white/80 hover:text-white"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/auth/register"
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