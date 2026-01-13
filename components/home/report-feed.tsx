"use client"

import { useState } from "react"
import { ReportCard, type ReportData } from "@/components/ui/report-card"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const categories = [
  { id: "all", label: "Semua" },
  { id: "poisoning", label: "Keracunan dan Masalah Kesehatan" },
  { id: "kitchen", label: "Operasional Dapur" },
  { id: "quality", label: "Kualitas dan Keamanan Dapur" },
  { id: "policy", label: "Kebijakan dan Anggaran" },
  { id: "implementation", label: "Implementasi Program" },
  { id: "social", label: "Dampak Sosial dan Ekonomi" },
]

// DATA DUMMY (Bervariasi agar filter terlihat efeknya)
const sampleReports: ReportData[] = [
  {
    id: "1",
    category: "Keracunan dan Masalah Kesehatan",
    categoryVariant: "danger",
    title: "10 siswa SD mengalami keracunan menu MBG",
    location: "SDN Contoh 01",
    date: "01 Januari 2026",
    reporter: "Orang tua siswa",
  },
  {
    id: "2",
    category: "Operasional Dapur",
    categoryVariant: "warning",
    title: "Gas Elpiji meledak di dapur umum",
    location: "SMPN 5 Jakarta",
    date: "02 Januari 2026",
    reporter: "Guru",
  },
  {
    id: "3",
    category: "Keracunan dan Masalah Kesehatan",
    categoryVariant: "danger",
    title: "Diare massal setelah minum susu",
    location: "SDN Contoh 03",
    date: "03 Januari 2026",
    reporter: "Kepala Sekolah",
  },
  {
    id: "4",
    category: "Kebijakan dan Anggaran",
    categoryVariant: "info",
    title: "Dana MBG bulan Januari terlambat cair",
    location: "Dinas Pendidikan",
    date: "04 Januari 2026",
    reporter: "Staff Admin",
  },
  {
    id: "5",
    category: "Operasional Dapur",
    categoryVariant: "warning",
    title: "Kekurangan tenaga juru masak",
    location: "Dapur Umum 02",
    date: "05 Januari 2026",
    reporter: "Koordinator",
  },
  {
    id: "6",
    category: "Keracunan dan Masalah Kesehatan",
    categoryVariant: "danger",
    title: "Ditemukan makanan basi dalam paket",
    location: "SDN Contoh 06",
    date: "06 Januari 2026",
    reporter: "Orang tua siswa",
  },
]

export function ReportFeed() {
  const [activeCategory, setActiveCategory] = useState("all")

  // --- LOGIKA FILTERING ---
  const filteredReports = sampleReports.filter((report) => {
    // 1. Jika "Semua", ambil semua data
    if (activeCategory === "all") return true

    // 2. Cari Label dari ID kategori yang aktif
    const currentCategoryLabel = categories.find((c) => c.id === activeCategory)?.label

    // 3. Bandingkan dengan kategori laporan
    return report.category === currentCategoryLabel
  })

  return (
    <section className="py-20 bg-general-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="h2 text-general-100 mb-4">
            Kategori Temuan
          </h2>
          <p className="body-lg text-general-70 max-w-2xl mx-auto">
            Jelajahi laporan terkini berdasarkan kategori untuk memahami isu-isu yang terjadi di lapangan.
          </p>
        </div>

        {/* --- TOMBOL KATEGORI --- */}
        <div className="flex flex-nowrap overflow-x-auto pb-4 gap-3 mb-8 md:mb-12 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-center md:pb-0 scrollbar-hide">
          {categories.map((category) => {
             const isActive = activeCategory === category.id
             return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "body-sm px-5 py-2.5 rounded-full font-medium transition-all duration-300 border shadow-sm whitespace-nowrap shrink-0",
                isActive
                  ? "bg-blue-100 text-general-20 border-blue-100 shadow-md transform scale-105"
                  : "bg-general-20 text-general-70 border-general-30 hover:bg-blue-20 hover:text-blue-100 hover:border-blue-30 hover:shadow-md"
              )}
            >
              {category.label}
            </button>
          )})}
        </div>

        {/* --- REPORT CARDS --- */}
        <div className="
          /* MOBILE: Flex Row + Scroll Samping */
          flex flex-nowrap overflow-x-auto gap-4 py-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide items-stretch
          
          /* DESKTOP: Grid 3 Kolom */
          md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 md:overflow-visible md:p-0 md:m-0
        ">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div 
                key={report.id}
                /* PERBAIKAN TINGGI SERAGAM:
                   - 'h-full flex flex-col': Membuat wrapper menjadi wadah flex vertikal penuh.
                */
                className="min-w-[85vw] sm:min-w-[400px] snap-center md:min-w-0 md:w-auto h-full flex flex-col"
              >
                {/* - 'flex-1': Mengisi ruang kosong vertikal.
                   - '[&>*]:h-full': Memaksa komponen ReportCard (anaknya) jadi tinggi 100%.
                */}
                <div className="flex-1 h-full [&>*]:h-full">
                  <ReportCard report={report} />
                </div>
              </div>
            ))
          ) : (
            // Pesan Kosong
            <div className="col-span-full w-full text-center py-12 text-general-60 body-md">
              Belum ada laporan untuk kategori ini.
            </div>
          )}
        </div>

        {/* Bottom Link */}
        <div className="text-center mt-12 md:mt-16">
          <Link
            href="/data-laporan"
            className="group inline-flex items-center gap-2 font-semibold transition-all px-8 py-4 rounded-full bg-blue-20 text-blue-100 hover:bg-blue-30 hover:shadow-md body-sm"
          >
            Lihat Seluruh Laporan
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}