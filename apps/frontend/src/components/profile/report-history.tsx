import { StatusBadge } from "@/components/ui/status-badge"

interface HistoryReport {
  id: number
  date: string
  location: string
  category: string
  status: "pending" | "rejected" | "accepted"
}

const historyData: HistoryReport[] = [
  {
    id: 1,
    date: "01/01/2026",
    location: "SDN Contoh 01, Jakarta Selatan",
    category: "Keracunan",
    status: "pending",
  },
  {
    id: 2,
    date: "15/12/2025",
    location: "SMP Negeri 5, Bandung",
    category: "Kualitas Makanan",
    status: "accepted",
  },
  {
    id: 3,
    date: "01/12/2025",
    location: "SD Harapan Bangsa, Surabaya",
    category: "Operasional",
    status: "rejected",
  },
]

const statusLabels = {
  pending: { label: "Belum Diverifikasi", variant: "neutral" as const },
  rejected: { label: "Laporan Ditolak", variant: "danger" as const },
  accepted: { label: "Laporan Diterima", variant: "success" as const },
}

export function ReportHistory() {
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
            {historyData.map((report, index) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm text-gray-600">{index + 1}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{report.date}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{report.location}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{report.category}</td>
                <td className="px-4 py-4">
                  <StatusBadge variant={statusLabels[report.status].variant}>
                    {statusLabels[report.status].label}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-200">
        {historyData.map((report, index) => (
          <div key={report.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-800">Laporan #{index + 1}</span>
              <StatusBadge variant={statusLabels[report.status].variant}>
                {statusLabels[report.status].label}
              </StatusBadge>
            </div>
            <p className="text-sm text-gray-600 mb-1">{report.location}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{report.category}</span>
              <span>{report.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
