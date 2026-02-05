import { memo, useMemo, useCallback, useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { 
  Loader2, FileText, AlertCircle, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight 
} from "lucide-react"
import { profileService } from "@/services/profile"
import { categoriesService } from "@/services/categories"

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }

// --- STATUS MAPPING ---
const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  pending: { label: "Menunggu Verifikasi", variant: "orange" },
  analyzing: { label: "Dalam Proses Analisis", variant: "blue" },
  needs_evidence: { label: "Butuh Bukti Tambahan", variant: "yellow" },
  invalid: { label: "Tidak Valid", variant: "red" },
  in_progress: { label: "Dalam Proses Penanganan", variant: "purple" },
  resolved: { label: "Selesai Ditangani", variant: "green" },
}

const getStatusStyle = (status: string) => {
  const normalizedStatus = status ? status.toLowerCase() : ""
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

function ReportHistoryComponent() {
  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // 1. Fetch Data Laporan
  const { data: reportsData, isLoading: isReportsLoading } = useQuery({
    queryKey: ["profile", "reports"],
    queryFn: () => profileService.getReports({ limit: 50 }), 
  })

  // 2. Fetch Data Kategori
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesService.getCategories()).data,
    staleTime: 1000 * 60 * 60, 
  })

  const reports = useMemo(() => reportsData?.data || [], [reportsData])
  
  // --- LOGIKA PAGINATION ---
  const totalPages = Math.ceil(reports.length / itemsPerPage)
  
  const currentReports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return reports.slice(start, start + itemsPerPage)
  }, [currentPage, reports])

  // --- LOGIKA SMART PAGINATION (DIPERBAIKI) ---
  const paginationItems = useMemo(() => {
    // 1. Jika halaman CUMA 1, 2, atau 3 -> Tampilkan semua.
    // TAPI jika 4, masuk ke logika bawah agar jadi 1 2 ... 4
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // 2. Jika halaman 4 atau lebih, gunakan logika gap
    const pages = new Set([1, 2, totalPages]); // Selalu ada 1, 2, dan Last

    // Masukkan current page jika berada di tengah (bukan 1, 2, atau Last)
    if (currentPage > 2 && currentPage < totalPages) {
      pages.add(currentPage);
    }

    // Urutkan angka halaman
    const sortedPages = Array.from(pages).sort((a, b) => a - b);
    const finalItems: (number | string)[] = [];

    for (let i = 0; i < sortedPages.length; i++) {
      const page = sortedPages[i];
      if (i > 0) {
        const prevPage = sortedPages[i - 1];
        // Jika jaraknya lebih dari 1, sisipkan "..."
        if (page - prevPage > 1) {
          finalItems.push("...");
        }
      }
      finalItems.push(page);
    }

    return finalItems;
  }, [currentPage, totalPages]);

  // Reset ke halaman 1 jika data berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [reports.length])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleFirstPage = () => setCurrentPage(1)
  const handleLastPage = () => setCurrentPage(totalPages)

  const getCategoryLabel = useCallback((value: string) => {
    if (!categoriesData) return value
    const found = categoriesData.find((c: any) => c.value === value)
    return found ? found.label : value
  }, [categoriesData])

  const formatDate = useCallback((dateString: string) => new Date(dateString).toLocaleDateString("id-ID", DATE_OPTIONS), [])

  if (isReportsLoading || isCategoriesLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-general-30 p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-general-30 overflow-hidden text-center p-12">
        <div className="w-16 h-16 bg-general-20 rounded-full flex items-center justify-center mx-auto mb-4 text-general-40">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-general-100 font-bold mb-1">Belum Ada Laporan</h3>
        <p className="text-general-60 body-sm">Anda belum pernah mengirimkan laporan sejauh ini.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-general-30 overflow-hidden flex flex-col">
      <div className="px-6 py-5 md:px-8 border-b border-general-30 flex items-center gap-3 bg-general-20/30">
        <div className="p-2 bg-blue-20 rounded-lg">
          <FileText className="w-5 h-5 text-blue-100" />
        </div>
        <h2 className="text-lg font-bold text-general-100">Riwayat Laporan</h2>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-blue-20/30 border-b border-general-30">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider w-16">No</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider">Lokasi</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider">Kategori</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-blue-100 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-general-30">
            {currentReports.map((report, index) => {
              const statusStyle = getStatusStyle(report.status)
              const itemNumber = (currentPage - 1) * itemsPerPage + index + 1
              
              return (
                <tr key={report.id} className="hover:bg-blue-20/10 transition-colors">
                  <td className="px-6 py-4 body-sm text-general-60 font-medium">{itemNumber}</td>
                  <td className="px-6 py-4 body-sm text-general-80">{formatDate(report.createdAt)}</td>
                  <td className="px-6 py-4 body-sm text-general-80 font-medium">{report.location}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-20 text-red-100 border border-red-30 whitespace-nowrap">
                      {getCategoryLabel(report.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${statusStyle.className}`}>
                      {statusStyle.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-4 p-4 bg-general-20/30">
        {currentReports.map((report, index) => {
          const statusStyle = getStatusStyle(report.status)
          const itemNumber = (currentPage - 1) * itemsPerPage + index + 1

          return (
            <div key={report.id} className="bg-white rounded-xl border border-general-30 shadow-sm p-4 hover:shadow-md transition-shadow">
              
              {/* Header Kartu: Tanggal & Status */}
              <div className="flex justify-between items-start mb-3">
                <div className="text-xs font-medium text-general-50 bg-general-20 px-2 py-1 rounded-lg">
                  {formatDate(report.createdAt)}
                </div>
                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${statusStyle.className}`}>
                  {statusStyle.label}
                </span>
              </div>
              
              {/* Content Utama: Lokasi */}
              <div className="mb-4">
                <h4 className="font-heading font-bold text-general-100 text-sm leading-tight">
                  {report.location}
                </h4>
              </div>

              {/* Footer Kartu: Kategori & ID */}
              <div className="flex items-center justify-between pt-3 border-t border-general-30 border-dashed">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-red-20 text-red-100 border border-red-30">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {getCategoryLabel(report.category)}
                </span>
                <span className="text-xs font-bold text-general-50 bg-general-20 px-2 py-1 rounded">#{itemNumber}</span>
              </div>

            </div>
          )
        })}
      </div>

      {/* --- PAGINATION CONTROLS --- */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-general-30 bg-general-20/30 flex items-center justify-center gap-2 select-none mt-auto">
          
          {/* First Page (<<) : HIDDEN ON MOBILE */}
          <button 
            onClick={handleFirstPage} 
            disabled={currentPage === 1}
            className="hidden sm:flex p-2 rounded-lg border border-general-30 bg-white text-general-60 hover:bg-blue-20 hover:text-blue-100 hover:border-blue-30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Prev Page (<) */}
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-general-30 bg-white text-general-60 hover:bg-blue-20 hover:text-blue-100 hover:border-blue-30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers Mapping */}
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
                  onClick={() => handlePageChange(pageNum)}
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

          {/* Next Page (>) */}
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-general-30 bg-white text-general-60 hover:bg-blue-20 hover:text-blue-100 hover:border-blue-30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page (>>) : HIDDEN ON MOBILE */}
          <button 
            onClick={handleLastPage} 
            disabled={currentPage === totalPages}
            className="hidden sm:flex p-2 rounded-lg border border-general-30 bg-white text-general-60 hover:bg-blue-20 hover:text-blue-100 hover:border-blue-30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>

        </div>
      )}
    </div>
  )
}

export const ReportHistory = memo(ReportHistoryComponent)