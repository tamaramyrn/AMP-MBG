"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { DataSummaryCards } from "@/components/dashboard/data-summary-cards"
import { DataFilters, type FilterValues } from "@/components/dashboard/data-filters"
import { DataTable, type ReportRow } from "@/components/dashboard/data-table"

// --- DUMMY DATA LENGKAP ---
// Perhatikan: Format Date YYYY-MM-DD, dan value kategori/provinsi huruf kecil sesuai filter
const dummyReports: ReportRow[] = [
  { id: "1", date: "2024-02-10", city: "Jakarta Selatan", province: "jakarta", category: "poisoning", status: "Terverifikasi", description: "10 siswa mengalami sakit perut massal setelah makan siang." },
  { id: "2", date: "2024-02-12", city: "Bandung", province: "jabar", category: "kitchen", status: "Menunggu", description: "Atap dapur sekolah bocor, mengkontaminasi area masak." },
  { id: "3", date: "2024-02-15", city: "Surabaya", province: "jatim", category: "quality", status: "Ditolak", description: "Laporan kualitas nasi kurang matang, bukti tidak cukup." },
  { id: "4", date: "2024-02-18", city: "Tangerang", province: "banten", category: "policy", status: "Terverifikasi", description: "Distribusi makanan terlambat 3 hari berturut-turut." },
  { id: "5", date: "2024-02-20", city: "Semarang", province: "jateng", category: "implementation", status: "Menunggu", description: "Menu tidak sesuai dengan anggaran yang ditetapkan." },
  { id: "6", date: "2024-02-22", city: "Jakarta Barat", province: "jakarta", category: "social", status: "Terverifikasi", description: "Vendor lokal tidak dilibatkan dalam pengadaan bahan baku." },
  { id: "7", date: "2024-02-25", city: "Bekasi", province: "jabar", category: "poisoning", status: "Menunggu", description: "Siswa muntah-muntah, diduga alergi susu." },
  { id: "8", date: "2024-02-26", city: "Malang", province: "jatim", category: "kitchen", status: "Terverifikasi", description: "Alat masak berkarat ditemukan di dapur umum." },
]

export default function DataLaporanPage() {
  // State untuk data yang sedang ditampilkan (hasil filter)
  const [filteredData, setFilteredData] = useState<ReportRow[]>(dummyReports)

  // Fungsi Logika Filter Utama
  const handleFilterChange = (filters: FilterValues) => {
    const { startDate, endDate, province, category } = filters

    const results = dummyReports.filter((item) => {
      // 1. Validasi Tanggal
      const itemDate = new Date(item.date)
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null
      
      const isDateValid = (!start || itemDate >= start) && (!end || itemDate <= end)

      // 2. Validasi Provinsi
      const isProvinceValid = province === "" || item.province === province

      // 3. Validasi Kategori
      const isCategoryValid = category === "" || item.category === category

      // Return true jika semua kondisi terpenuhi
      return isDateValid && isProvinceValid && isCategoryValid
    })

    setFilteredData(results)
  }

  return (
    <div className="min-h-screen flex flex-col bg-general-20">
      <Navbar />
      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-10 md:mb-12">
            <h1 className="h3 text-general-100 mb-4">
              Data dan Statistik Laporan MBG
            </h1>
            <p className="body-md text-general-70">
              Pantau perkembangan laporan masyarakat secara transparan
            </p>
          </div>

          {/* Summary Cards */}
          <DataSummaryCards />

          {/* Filters */}
          <DataFilters onFilter={handleFilterChange} />

          {/* Data Table - Menerima data yang sudah difilter */}
          <DataTable data={filteredData} />
          
          {/* Pesan Empty State jika filter tidak menemukan hasil */}
          {filteredData.length === 0 && (
            <div className="text-center py-12 bg-general-20 border border-general-30 border-dashed rounded-lg mt-4">
                <p className="text-general-60 body-md font-medium">
                  Tidak ada laporan yang sesuai dengan filter Anda.
                </p>
                <p className="text-general-50 text-sm mt-1">
                  Coba atur ulang tanggal atau kategori pencarian.
                </p>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  )
}