import { memo, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { profileService } from "@/services/profile"

const CATEGORY_LABELS: Record<string, string> = {
  poisoning: "Keracunan",
  kitchen: "Operasional Dapur",
  quality: "Kualitas Makanan",
  policy: "Kebijakan",
  implementation: "Implementasi",
  social: "Dampak Sosial",
}

const STATUS_CONFIG: Record<string, { label: string; variant: "neutral" | "danger" | "success" | "warning" }> = {
  pending: { label: "Belum Diverifikasi", variant: "neutral" },
  verified: { label: "Terverifikasi", variant: "success" },
  in_progress: { label: "Sedang Diproses", variant: "warning" },
  resolved: { label: "Selesai", variant: "success" },
  rejected: { label: "Ditolak", variant: "danger" },
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }

function ReportHistoryComponent() {
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["profile", "reports"],
    queryFn: () => profileService.getReports({ limit: 10 }),
  })

  const reports = useMemo(() => reportsData?.data || [], [reportsData])
  const formatDate = useCallback((dateString: string) => new Date(dateString).toLocaleDateString("id-ID", DATE_OPTIONS), [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="h6 font-bold text-gray-800">Riwayat Laporan</h2>
        </div>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
        </div>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="h6 font-bold text-gray-800">Riwayat Laporan</h2>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-500 body-sm">Anda belum memiliki riwayat laporan.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="h6 font-bold text-gray-800">Riwayat Laporan</h2>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Lokasi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kategori</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reports.map((report, index) => {
              const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending
              return (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-600">{index + 1}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{formatDate(report.createdAt)}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{report.location}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {CATEGORY_LABELS[report.category] || report.category}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge variant={status.variant}>
                      {status.label}
                    </StatusBadge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-200">
        {reports.map((report, index) => {
          const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending
          return (
            <div key={report.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">Laporan #{index + 1}</span>
                <StatusBadge variant={status.variant}>
                  {status.label}
                </StatusBadge>
              </div>
              <p className="text-sm text-gray-600 mb-1">{report.location}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{CATEGORY_LABELS[report.category] || report.category}</span>
                <span>{formatDate(report.createdAt)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const ReportHistory = memo(ReportHistoryComponent)
