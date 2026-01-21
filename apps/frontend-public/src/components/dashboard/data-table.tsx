import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { CATEGORY_LABELS } from "@/hooks/use-categories"

export interface ReportRow {
  id: string
  date: string
  city: string
  province: string
  district?: string
  category: string
  description: string
  status: string
}

interface DataTableProps {
  data: ReportRow[]
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }

// 1. UPDATE: Konfigurasi Status sesuai Referensi Dashboard Laporan
const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  pending: { label: "Menunggu Verifikasi", variant: "orange" },
  verified: { label: "Terverifikasi", variant: "green" },
  in_progress: { label: "Sedang Ditindaklanjuti", variant: "yellow" },
  resolved: { label: "Selesai", variant: "blue" }, // Perhatikan key di DB mungkin 'resolved' atau 'completed'
  completed: { label: "Selesai", variant: "blue" }, // Handle kedua kemungkinan key
  rejected: { label: "Ditolak", variant: "red" },
}

// 2. UPDATE: Helper Function untuk Style Status (Background & Border khusus)
const getStatusStyle = (status: string) => {
  const statusInfo = STATUS_LABELS[status] || { label: status, variant: "gray" }
  
  const variantStyles: Record<string, string> = {
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    green: "bg-green-20 text-green-100 border-green-30",
    red: "bg-red-20 text-red-100 border-red-30",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    blue: "bg-blue-20 text-blue-100 border-blue-30",
    gray: "bg-general-30 text-general-70 border-general-40",
  }

  return { 
    label: statusInfo.label, 
    className: variantStyles[statusInfo.variant] || variantStyles.gray 
  }
}

function DataTableComponent({ data }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    setCurrentPage(1)
  }, [data])

  const { totalPages, startIndex, endIndex, currentData } = useMemo(() => {
    const total = Math.ceil(data.length / itemsPerPage)
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return {
      totalPages: total,
      startIndex: start,
      endIndex: end,
      currentData: data.slice(start, end),
    }
  }, [data, currentPage])

  const getCategoryLabel = useCallback((key: string) => CATEGORY_LABELS[key] || key, [])
  const formatDate = useCallback((dateString: string) => new Date(dateString).toLocaleDateString("id-ID", DATE_OPTIONS), [])

  const handlePrevPage = useCallback(() => setCurrentPage((p) => Math.max(1, p - 1)), [])
  const handleNextPage = useCallback(() => setCurrentPage((p) => Math.min(totalPages, p + 1)), [totalPages])
  const handlePageClick = useCallback((page: number) => setCurrentPage(page), [])

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
              <th className="px-4 py-3 text-left text-xs font-semibold text-general-60 uppercase tracking-wider font-heading w-40">
                Status
              </th>
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
              // 3. APPLY: Menggunakan helper function baru untuk mendapatkan class dan label
              const statusStyle = getStatusStyle(row.status)

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
                      {row.district && <p className="font-medium text-general-100">{row.district}</p>}
                      <p className={row.district ? "text-general-60 text-xs" : "font-medium text-general-100"}>{row.city}</p>
                      <p className="text-general-60 text-xs">{row.province}</p>
                    </div>
                  </td>
                  
                  {/* 4. RENDER: Menggunakan span dengan class dinamis (Pill Style) */}
                  <td className="px-4 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${statusStyle.className}`}>
                      {statusStyle.label}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    {/* Kategori tetap menggunakan StatusBadge merah sesuai kode sebelumnya */}
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
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 border border-general-30 rounded-lg hover:bg-general-30 disabled:opacity-50 disabled:cursor-not-allowed text-general-70"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (page) =>
                (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) && (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page ? "bg-blue-100 text-general-20" : "border border-general-30 hover:bg-general-30 text-general-70"
                    }`}
                  >
                    {page}
                  </button>
                )
            )}

            <button
              onClick={handleNextPage}
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

export const DataTable = memo(DataTableComponent)