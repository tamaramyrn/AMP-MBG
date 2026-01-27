import { memo, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, FileText, Calendar, AlertCircle } from "lucide-react"
import { profileService } from "@/services/profile"
import { CATEGORY_LABELS_SHORT } from "@/hooks/use-categories"

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }

// 1. Definisi Label Status (Sesuai Referensi)
const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  pending: { label: "Menunggu Verifikasi", variant: "orange" },
  verified: { label: "Terverifikasi", variant: "green" },
  in_progress: { label: "Sedang Ditindaklanjuti", variant: "yellow" },
  resolved: { label: "Selesai", variant: "blue" },
  completed: { label: "Selesai", variant: "blue" },
  rejected: { label: "Ditolak", variant: "red" },
}

// 2. Helper Style (Diadaptasi ke Design System: 20/100/30)
const getStatusStyle = (status: string) => {
  const normalizedStatus = status ? status.toLowerCase() : ""
  const statusInfo = STATUS_LABELS[normalizedStatus] || { label: status, variant: "gray" }
  
  const variantStyles: Record<string, string> = {
    // Orange Scale (Pending)
    orange: "bg-orange-20 text-orange-100 border-orange-30",
    
    // Green Scale (Verified)
    green: "bg-green-20 text-green-100 border-green-30",
    
    // Red Scale (Rejected)
    red: "bg-red-20 text-red-100 border-red-30",
    
    // Yellow Scale (In Progress)
    yellow: "bg-yellow-50 text-general-80 border-yellow-100", 
    
    // Blue Scale (Resolved)
    blue: "bg-blue-20 text-blue-100 border-blue-30",
    
    // Default
    gray: "bg-general-30 text-general-70 border-general-40",
  }

  return { 
    label: statusInfo.label, 
    className: variantStyles[statusInfo.variant] || variantStyles.gray 
  }
}

function ReportHistoryComponent() {
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["profile", "reports"],
    queryFn: () => profileService.getReports({ limit: 10 }),
  })

  const reports = useMemo(() => reportsData?.data || [], [reportsData])
  const formatDate = useCallback((dateString: string) => new Date(dateString).toLocaleDateString("id-ID", DATE_OPTIONS), [])

  if (isLoading) {
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
    <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-general-30 overflow-hidden">
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
            {reports.map((report, index) => {
              const statusStyle = getStatusStyle(report.status)
              
              return (
                <tr key={report.id} className="hover:bg-blue-20/10 transition-colors">
                  <td className="px-6 py-4 body-sm text-general-60 font-medium">{index + 1}</td>
                  <td className="px-6 py-4 body-sm text-general-80">{formatDate(report.createdAt)}</td>
                  <td className="px-6 py-4 body-sm text-general-80 font-medium">{report.location}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-general-20 text-general-80 border border-general-30">
                      {CATEGORY_LABELS_SHORT[report.category] || report.category}
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

      {/* Mobile Cards (Responsive) */}
      <div className="md:hidden divide-y divide-general-30">
        {reports.map((report, index) => {
          const statusStyle = getStatusStyle(report.status)

          return (
            <div key={report.id} className="p-5 hover:bg-general-20/20 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-general-50 bg-general-20 px-2 py-1 rounded">#{index + 1}</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${statusStyle.className}`}>
                  {statusStyle.label}
                </span>
              </div>
              
              <div className="mb-3">
                <h4 className="font-bold text-general-100 text-sm mb-1">{report.location}</h4>
                <div className="flex items-center gap-2 text-xs text-general-60">
                  <Calendar className="w-3 h-3" />
                  {formatDate(report.createdAt)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-20 text-blue-100 border border-blue-30/50">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {CATEGORY_LABELS_SHORT[report.category] || report.category}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const ReportHistory = memo(ReportHistoryComponent)