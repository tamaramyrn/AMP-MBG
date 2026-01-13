"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"

interface ReportRow {
  id: number
  date: string
  city: string
  province: string
  category: string
  categoryVariant: "danger" | "warning" | "info" | "neutral"
  description: string
}

const sampleData: ReportRow[] = [
  {
    id: 1,
    date: "01/01/2026",
    city: "Jakarta Selatan",
    province: "DKI Jakarta",
    category: "Keracunan",
    categoryVariant: "danger",
    description: "10 siswa mengalami keracunan makanan setelah makan siang",
  },
  {
    id: 2,
    date: "28/12/2025",
    city: "Bandung",
    province: "Jawa Barat",
    category: "Kualitas Makanan",
    categoryVariant: "warning",
    description: "Nasi yang disajikan terlihat basi dan berbau tidak sedap",
  },
  {
    id: 3,
    date: "25/12/2025",
    city: "Surabaya",
    province: "Jawa Timur",
    category: "Operasional",
    categoryVariant: "info",
    description: "Keterlambatan pengiriman makanan hingga 2 jam dari jadwal",
  },
  {
    id: 4,
    date: "22/12/2025",
    city: "Bekasi",
    province: "Jawa Barat",
    category: "Kebijakan",
    categoryVariant: "neutral",
    description: "Porsi makanan tidak sesuai dengan standar yang ditetapkan",
  },
  {
    id: 5,
    date: "20/12/2025",
    city: "Depok",
    province: "Jawa Barat",
    category: "Keracunan",
    categoryVariant: "danger",
    description: "5 siswa mengalami mual dan muntah setelah makan siang",
  },
  {
    id: 6,
    date: "18/12/2025",
    city: "Tangerang",
    province: "Banten",
    category: "Kualitas Makanan",
    categoryVariant: "warning",
    description: "Ditemukan benda asing dalam lauk pauk yang disajikan",
  },
  {
    id: 7,
    date: "15/12/2025",
    city: "Semarang",
    province: "Jawa Tengah",
    category: "Operasional",
    categoryVariant: "info",
    description: "Dapur tidak memenuhi standar kebersihan yang ditetapkan",
  },
  {
    id: 8,
    date: "12/12/2025",
    city: "Malang",
    province: "Jawa Timur",
    category: "Keracunan",
    categoryVariant: "danger",
    description: "3 siswa mengalami diare setelah mengkonsumsi makanan",
  },
]

export function DataTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 5

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">Daftar Laporan Terbaru</h2>
      </div>

      {/* Desktop Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Lokasi
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Deskripsi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sampleData.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm text-gray-600">{index + 1}</td>
                <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">{row.date}</td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium">{row.city}</p>
                    <p className="text-gray-500 text-xs">{row.province}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge variant={row.categoryVariant}>{row.category}</StatusBadge>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Menampilkan <span className="font-medium">1-8</span> dari <span className="font-medium">1,247</span> laporan
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page ? "bg-primary text-white" : "border border-gray-300 hover:bg-gray-50 text-gray-700"
              }`}
            >
              {page}
            </button>
          ))}
          <span className="text-gray-500">...</span>
          <button
            onClick={() => setCurrentPage(totalPages)}
            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
              currentPage === totalPages
                ? "bg-primary text-white"
                : "border border-gray-300 hover:bg-gray-50 text-gray-700"
            }`}
          >
            {totalPages}
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
