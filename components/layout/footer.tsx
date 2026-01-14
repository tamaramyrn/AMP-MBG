import Link from "next/link"
import { Phone, Mail } from "lucide-react"

// --- DEFINISI DATA LINK ---
const leftLinks = [
  { href: "/", label: "Beranda" },
  { href: "/cara-kerja", label: "Cara Kerja" },
  { href: "/lapor", label: "Lapor" },
]

const rightLinks = [
  { href: "/data-laporan", label: "Data Laporan" },
  { href: "/tentang-kami", label: "Tentang Kami" },
]

export function Footer() {
  return (
    <footer className="bg-blue-100 text-general-20 border-t border-blue-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* LAYOUT GRID 3 KOLOM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* 1. KOLOM KIRI: Logo Only (Rata Kiri) */}
          <div className="flex items-center justify-start">
            {/* UBAH: Ukuran diperbesar dari h-14 menjadi h-24 */}
            <img 
              src="/images/logo_putih.png" 
              alt="Logo AMP MBG" 
              className="h-24 w-auto object-contain"
            />
          </div>

          {/* 2. KOLOM TENGAH: Menu (RATA TENGAH) */}
          <div className="flex gap-12 justify-start md:justify-center w-full">
            
            {/* Grup Kiri */}
            <div className="flex flex-col gap-2">
              {leftLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="body-sm text-blue-20 hover:text-general-20 hover:translate-x-1 transition-all block"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Grup Kanan */}
            <div className="flex flex-col gap-2">
              {rightLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="body-sm text-blue-20 hover:text-general-20 hover:translate-x-1 transition-all block"
                >
                  {link.label}
                </Link>
              ))}
            </div>

          </div>

          {/* 3. KOLOM KANAN: Kontak (Rata Kanan di Desktop) */}
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

        {/* Copyright */}
        <div className="border-t border-blue-90/50 mt-8 pt-6 text-center">
          <p className="body-xs text-blue-30">
            &copy; 2026 AMP MBG. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}