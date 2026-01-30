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

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  pending: { label: "Menunggu Verifikasi", variant: "orange" },
  analyzing: { label: "Dalam Proses Analisis", variant: "blue" },
  needs_evidence: { label: "Butuh Bukti Tambahan", variant: "yellow" },
  invalid: { label: "Tidak Valid", variant: "red" },
  in_progress: { label: "Dalam Proses Penanganan", variant: "purple" },
  resolved: { label: "Selesai Ditangani", variant: "green" },
}

const getStatusStyle = (status: string) => {
  const normalizedStatus = status ? status.toLowerCase() : "";
  const statusInfo = STATUS_LABELS[normalizedStatus] || { label: status, variant: "gray" }
  
  const variantStyles: Record<string, string> = {
    orange: "bg-orange-20 text-orange-100 border-orange-30",
    green: "bg-green-20 text-green-100 border-green-30",
    red: "bg-red-20 text-red-100 border-red-30",
    yellow: "bg-yellow-50 text-general-80 border-yellow-100",
    blue: "bg-blue-20 text-blue-100 border-blue-30",
    purple: "bg-purple-100/10 text-purple-600 border-purple-200",
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
    <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-blue-30/30 overflow-hidden">
      
      {/* HEADER: Font disamakan dengan Profile (text-general-100 font-bold) */}
      <div className="p-6 md:p-8 border-b border-general-30">
        <h2 className="text-lg font-bold text-general-100">Daftar Laporan</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          {/* THEAD: Menggunakan font-heading */}
          <thead className="bg-blue-20/40 border-b border-blue-30/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider font-heading w-16">No</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider font-heading w-40">Tanggal</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider font-heading w-56">Lokasi</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider font-heading w-48">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider font-heading w-1/4">Kategori</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider font-heading">Deskripsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-general-30">
            {currentData.map((row, index) => {
              const statusStyle = getStatusStyle(row.status)
              return (
                <tr key={row.id} className="hover:bg-blue-20/20 transition-colors">
                  {/* ISI TABEL: Menggunakan text-general-80 agar sama dengan Profile */}
                  <td className="px-6 py-5 body-sm text-general-80 font-medium">{startIndex + index + 1}</td>
                  <td className="px-6 py-5 body-sm text-general-80 whitespace-nowrap">{formatDate(row.date)}</td>
                  <td className="px-6 py-5 body-sm text-general-80">
                    <div className="flex flex-col">
                      <span className="font-bold text-general-100">{row.district || "-"}</span>
                      <span className="text-xs text-general-60">{row.city}, {row.province}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${statusStyle.className}`}>
                      {statusStyle.label}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge variant="danger">{getCategoryLabel(row.category)}</StatusBadge>
                  </td>
                  <td className="px-6 py-5 body-sm text-general-80 max-w-xs truncate">{row.description}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="px-6 py-6 border-t border-general-30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="body-sm text-general-60 text-center sm:text-left">
          Menampilkan <span className="font-bold text-blue-100">{data.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, data.length)}</span> dari <span className="font-bold text-blue-100">{data.length}</span> laporan
        </p>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 border border-general-30 rounded-lg hover:bg-general-20 hover:text-blue-100 disabled:opacity-50 disabled:cursor-not-allowed text-general-60 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) =>
                  (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) && (
                    <button
                      key={page}
                      onClick={() => handlePageClick(page)}
                      className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                        currentPage === page 
                          ? "bg-blue-100 text-white shadow-md" 
                          : "border border-general-30 hover:border-blue-30 hover:text-blue-100 text-general-60"
                      }`}
                    >
                      {page}
                    </button>
                  )
              )}
            </div>
            
            <span className="sm:hidden text-sm font-bold text-blue-100">
                Halaman {currentPage}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 border border-general-30 rounded-lg hover:bg-general-20 hover:text-blue-100 disabled:opacity-50 disabled:cursor-not-allowed text-general-60 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export const DataTable = memo(DataTableComponent)