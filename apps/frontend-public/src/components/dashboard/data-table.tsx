import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
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

  // Smart pagination logic
  const paginationItems = useMemo(() => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items: (number | string)[] = [1];
    if (totalPages > 1) items.push(2);
    if (currentPage > 3) items.push("...");
    if (currentPage > 2 && currentPage < totalPages) items.push(currentPage);
    if (currentPage < totalPages - 1) items.push("...");
    if (totalPages > 2) items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

  const getCategoryLabel = useCallback((key: string) => CATEGORY_LABELS[key] || key, [])
  const formatDate = useCallback((dateString: string) => new Date(dateString).toLocaleDateString("id-ID", DATE_OPTIONS), [])

  const handleFirstPage = useCallback(() => setCurrentPage(1), [])
  const handleLastPage = useCallback(() => setCurrentPage(totalPages), [totalPages])
  const handlePrevPage = useCallback(() => setCurrentPage((p) => Math.max(1, p - 1)), [])
  const handleNextPage = useCallback(() => setCurrentPage((p) => Math.min(totalPages, p + 1)), [totalPages])
  const handlePageClick = useCallback((page: number) => setCurrentPage(page), [])

  if (data.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-blue-30/30 overflow-hidden flex flex-col">
      
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-general-30">
        <h2 className="text-lg font-bold text-general-100">Daftar Laporan</h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[900px]">
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
                  <td className="px-6 py-5 body-sm text-general-80 font-medium align-top">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-6 py-5 body-sm text-general-80 whitespace-nowrap align-top">
                    {formatDate(row.date)}
                  </td>
                  <td className="px-6 py-5 body-sm text-general-80 align-top">
                    <div className="flex flex-col">
                      <span className="font-bold text-general-100">{row.district || "-"}</span>
                      <span className="text-xs text-general-60">{row.city}, {row.province}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${statusStyle.className}`}>
                      {statusStyle.label}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-medium bg-red-20 text-red-100 border border-red-30 whitespace-normal text-center h-auto leading-snug w-full min-w-[100px]">
                        {getCategoryLabel(row.category)}
                    </span>
                  </td>
                  <td className="px-6 py-5 body-sm text-general-80 max-w-xs truncate align-top">
                    {row.description}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION --- */}
      <div className="px-6 py-6 border-t border-general-30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white mt-auto">
        <p className="body-sm text-general-60 text-center sm:text-left">
          Menampilkan <span className="font-bold text-blue-100">{data.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, data.length)}</span> dari <span className="font-bold text-blue-100">{data.length}</span> laporan
        </p>
        
        {/* Pagination buttons */}
        <div className="flex items-center gap-1 sm:gap-2 select-none justify-center w-full sm:w-auto">
          
          {/* First page button */}
          <button 
            onClick={handleFirstPage} 
            disabled={currentPage === 1}
            className="hidden sm:flex p-2 rounded-lg border border-general-30 bg-white text-general-60 hover:bg-blue-20 hover:text-blue-100 hover:border-blue-30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous page button */}
          <button 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-general-30 bg-white text-general-60 hover:bg-blue-20 hover:text-blue-100 hover:border-blue-30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          <div className="flex gap-1 mx-1 sm:mx-2">
            {paginationItems.map((item, idx) => {
              if (item === "...") {
                return (
                  <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-general-60 font-bold text-xs sm:text-sm">
                    ...
                  </span>
                )
              }

              const pageNum = item as number
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageClick(pageNum)}
                  className={`
                    w-8 h-8 rounded-lg text-xs sm:text-sm font-bold border transition-all flex items-center justify-center
                    ${currentPage === pageNum 
                      ? 'bg-blue-100 border-blue-100 text-white shadow-sm' 
                      : 'bg-white border-general-30 text-general-60 hover:border-blue-100 hover:text-blue-100'
                    }
                  `}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          {/* Next page button */}
          <button 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-general-30 bg-white text-general-60 hover:bg-blue-20 hover:text-blue-100 hover:border-blue-30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page button */}
          <button 
            onClick={handleLastPage} 
            disabled={currentPage === totalPages}
            className="hidden sm:flex p-2 rounded-lg border border-general-30 bg-white text-general-60 hover:bg-blue-20 hover:text-blue-100 hover:border-blue-30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>

        </div>
      </div>
    </div>
  )
}

export const DataTable = memo(DataTableComponent)