"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge" 

// Definisi tipe data laporan
export interface ReportRow {
  id: string
  date: string 
  city: string
  province: string
  category: string
  description: string
  status: string 
}

interface DataTableProps {
  data: ReportRow[]
}

// UBAH: Helper ini sekarang hanya mengembalikan Label Lengkap
// Warnanya nanti di-hardcode jadi Merah di komponen
const getCategoryLabel = (key: string) => {
  const map: Record<string, string> = {
    poisoning: "Keracunan dan Masalah Kesehatan",
    kitchen: "Operasional Dapur",
    quality: "Kualitas dan Keamanan Dapur",
    policy: "Kebijakan dan Anggaran",
    implementation: "Implementasi Program",
    social: "Dampak Sosial dan Ekonomi",
  }
  return map[key] || key
}

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
  return new Date(dateString).toLocaleDateString('id-ID', options)
}

const formatProvince = (key: string) => {
  const map: Record<string, string> = {
    jakarta: "DKI Jakarta",
    jabar: "Jawa Barat",
    jatim: "Jawa Timur",
    jateng: "Jawa Tengah",
    banten: "Banten"
  }
  return map[key] || key
}

export function DataTable({ data }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    setCurrentPage(1)
  }, [data])

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = data.slice(startIndex, endIndex)

  if (data.length === 0) {
    return null 
  }

  return (
    <div className="bg-general-20 rounded-lg shadow-md border border-general-30 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-general-30">
        <h2 className="h5 text-general-100">Daftar Laporan</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-general-20 border-b border-general-30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-general-60 uppercase tracking-wider font-heading w-12">
                No
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-general-60 uppercase tracking-wider font-heading w-32">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-general-60 uppercase tracking-wider font-heading w-48">
                Lokasi
              </th>
              {/* Kolom Kategori diperlebar agar muat teks panjang */}
              <th className="px-4 py-3 text-left text-xs font-semibold text-general-60 uppercase tracking-wider font-heading w-1/4">
                Kategori
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-general-60 uppercase tracking-wider font-heading">
                Deskripsi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-general-30">
            {currentData.map((row, index) => {
              return (
                <tr key={row.id} className="hover:bg-blue-20/30 transition-colors">
                  <td className="px-4 py-4 body-sm text-general-70">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-4 body-sm text-general-70 whitespace-nowrap">
                    {formatDate(row.date)}
                  </td>
                  <td className="px-4 py-4 body-sm text-general-70">
                    <div>
                      <p className="font-medium text-general-100">{row.city}</p>
                      <p className="text-general-60 text-xs">{formatProvince(row.province)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {/* UBAH: Semua variant dipaksa jadi 'danger' (Merah) */}
                    <StatusBadge variant="danger">
                      {getCategoryLabel(row.category)}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-4 body-sm text-general-70 max-w-xs truncate">
                    {row.description}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-4 border-t border-general-30 flex items-center justify-between">
        <p className="body-sm text-general-60">
          Menampilkan <span className="font-medium text-general-100">{data.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, data.length)}</span> dari <span className="font-medium text-general-100">{data.length}</span> laporan
        </p>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-general-30 rounded-lg hover:bg-general-30 disabled:opacity-50 disabled:cursor-not-allowed text-general-70"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
               (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) && (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page 
                      ? "bg-blue-100 text-general-20" 
                      : "border border-general-30 hover:bg-general-30 text-general-70"
                  }`}
                >
                  {page}
                </button>
               )
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-general-30 rounded-lg hover:bg-general-30 disabled:opacity-50 disabled:cursor-not-allowed text-general-70"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}