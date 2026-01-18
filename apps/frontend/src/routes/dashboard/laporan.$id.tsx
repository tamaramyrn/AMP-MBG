import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { DashboardAnggotaLayout } from "@/components/dashboard/dashboard-anggota-layout"
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  User,
  X,
  ChevronDown,
  CheckCircle,
  Loader2,
  Clock,
  Save,
  Mail,
  History
} from "lucide-react"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminService } from "@/services/admin"
import type { ReportStatus } from "@/services/reports"

export const Route = createFileRoute("/dashboard/laporan/$id")({
  component: LaporanLamaDetail,
})

// --- CONSTANTS ---
const CATEGORY_LABELS: Record<string, string> = {
  poisoning: "Keracunan dan Masalah Kesehatan",
  kitchen: "Operasional Dapur",
  quality: "Kualitas dan Keamanan Dapur",
  policy: "Kebijakan dan Anggaran",
  implementation: "Implementasi Program",
  social: "Dampak Sosial dan Ekonomi",
}

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  pending: { label: "Menunggu Verifikasi", variant: "orange" },
  verified: { label: "Terverifikasi", variant: "green" },
  in_progress: { label: "Sedang Ditindaklanjuti", variant: "yellow" },
  resolved: { label: "Selesai", variant: "blue" },
  rejected: { label: "Ditolak", variant: "red" },
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Menunggu Verifikasi" },
  { value: "verified", label: "Terverifikasi" },
  { value: "in_progress", label: "Sedang Ditindaklanjuti" },
  { value: "resolved", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
]

const CREDIBILITY_LABELS: Record<string, string> = {
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
}

const RISK_OPTIONS = [
  { value: "high", label: "Tinggi" },
  { value: "medium", label: "Sedang" },
  { value: "low", label: "Rendah" },
]

// --- HELPER COMPONENTS ---

const getStatusStyle = (status: string) => {
  const statusInfo = STATUS_LABELS[status] || { label: status, variant: "gray" }
  // Mapping variant ke class tailwind sesuai design system
  const variantStyles: Record<string, string> = {
    orange: "bg-orange-50 text-orange-700 border-orange-200", // Fallback standard tailwind jika var tidak ada
    green: "bg-green-20 text-green-100 border-green-30",
    red: "bg-red-20 text-red-100 border-red-30",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    blue: "bg-blue-20 text-blue-100 border-blue-30",
    gray: "bg-general-30 text-general-70 border-general-40",
  }
  return { label: statusInfo.label, className: variantStyles[statusInfo.variant] || variantStyles.gray }
}

const getRiskStyle = (level: string) => {
  const styles: Record<string, string> = {
    high: "text-red-100 font-semibold",
    medium: "text-yellow-600 font-medium",
    low: "text-green-100 font-medium",
  }
  return styles[level] || "text-general-70"
}

// --- MODAL RIWAYAT USER (Styling Updated) ---
function UserHistoryModal({ 
  user, 
  onClose 
}: { 
  user: { name: string; email: string }; 
  onClose: () => void 
}) {
  const { data: historyData, isLoading } = useQuery({
    queryKey: ["admin", "reports", "user-history", user.email],
    queryFn: () => adminService.getReports({ search: user.email, limit: 20 }),
  })

  const reports = historyData?.data || []

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric"
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-general-20 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-general-30">
        
        {/* Header Modal */}
        <div className="p-6 border-b border-general-30 flex justify-between items-center bg-general-30/30">
          <div>
            <h3 className="h6 text-general-100 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-100" />
              Riwayat Laporan
            </h3>
            <div className="flex flex-col mt-1">
              <span className="body-sm font-bold text-general-100">{user.name}</span>
              <span className="body-xs text-general-60">{user.email}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-general-40 rounded-full text-general-60 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-general-40 scrollbar-track-transparent">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
              <p className="body-sm text-general-60">Memuat riwayat...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="p-4 bg-general-30 rounded-full"><History className="w-8 h-8 text-general-50" /></div>
              <p className="body-sm text-general-60">Tidak ada riwayat laporan lain.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-general-20 sticky top-0 z-10 shadow-sm">
                <tr className="text-general-80 body-xs font-heading font-bold uppercase tracking-wider border-b border-general-30">
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Judul / Lokasi</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Risiko</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-general-30">
                {reports.map((report) => {
                  const statusStyle = getStatusStyle(report.status)
                  const riskLevel = report.credibilityLevel || (report as any).credibility_level
                  
                  return (
                    <tr key={report.id} className="hover:bg-general-30/20 transition-colors">
                      <td className="p-4 body-sm text-general-80 align-top whitespace-nowrap">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="p-4 body-sm align-top">
                        <p className="font-medium text-general-100 line-clamp-1">{report.title}</p>
                        <p className="text-general-60 text-xs mt-0.5">{report.city}, {report.province}</p>
                      </td>
                      <td className="p-4 align-top text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.className}`}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className={`p-4 align-top text-center body-sm ${getRiskStyle(riskLevel)}`}>
                        {CREDIBILITY_LABELS[riskLevel] || "-"}
                      </td>
                      <td className="p-4 align-top text-right">
                        <a 
                          href={`/dashboard/laporan/${report.id}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-100 hover:text-blue-90 hover:underline body-sm font-medium"
                        >
                          Detail
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer Modal */}
        <div className="p-4 border-t border-general-30 bg-general-20 flex justify-end">
            <button 
                onClick={onClose}
                className="px-4 py-2 bg-general-30 hover:bg-general-40 text-general-100 rounded-lg body-sm font-medium transition-colors"
            >
                Tutup
            </button>
        </div>
      </div>
    </div>
  )
}

// --- MAIN DETAIL COMPONENT ---
function LaporanLamaDetail() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [viewingUserHistory, setViewingUserHistory] = useState<{ name: string; email: string } | null>(null)

  const [newStatus, setNewStatus] = useState<ReportStatus | "">("")
  const [newRisk, setNewRisk] = useState<string>("") 
  const [notes, setNotes] = useState("")

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["admin", "report", id],
    queryFn: () => adminService.getReport(id),
  })

  useEffect(() => {
    if (reportData?.data) {
      setNewStatus(reportData.data.status as ReportStatus)
      setNewRisk(reportData.data.credibilityLevel || "") 
      setNotes(reportData.data.adminNotes || "")
    }
  }, [reportData])

  const { data: scoringData } = useQuery({
    queryKey: ["admin", "report", id, "scoring"],
    queryFn: () => adminService.getReportScoring(id),
    enabled: !!reportData,
  })

  const { data: historyData } = useQuery({
    queryKey: ["admin", "report", id, "history"],
    queryFn: () => adminService.getReportHistory(id),
    enabled: !!reportData,
  })

  const report = reportData?.data
  const scoring = scoringData?.data
  const history = historyData?.data || []

  const updateStatus = useMutation({
    mutationFn: (data: { status: ReportStatus; credibilityLevel: string; notes?: string }) => 
      adminService.updateReportStatus(id, {
        status: data.status,
        credibilityLevel: data.credibilityLevel,
        notes: data.notes
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "report", id] })
      setShowSuccessModal(true)
    },
  })

  const handleSaveChanges = () => {
    if (!newStatus) return
    updateStatus.mutate({
      status: newStatus,
      credibilityLevel: newRisk,
      notes: notes || undefined,
    })
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    navigate({ to: "/dashboard/laporan" })
  }

  if (isLoading) {
    return (
      <DashboardAnggotaLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
        </div>
      </DashboardAnggotaLayout>
    )
  }

  if (!report) {
    return (
      <DashboardAnggotaLayout>
        <div className="p-8 text-center">
          <p className="body-sm text-general-60">Laporan tidak ditemukan</p>
          <Link to="/dashboard/laporan" className="text-blue-100 hover:underline mt-2 inline-block">
            Kembali ke daftar
          </Link>
        </div>
      </DashboardAnggotaLayout>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <DashboardAnggotaLayout>
      <div className="p-8 max-w-4xl mx-auto font-sans relative">
        
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/dashboard/laporan" 
            className="p-2 rounded-full hover:bg-general-30 text-general-60 hover:text-general-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="h4 text-general-100">Detail Laporan</h1>
            <p className="body-sm text-general-60">ID Laporan: #{id.slice(0, 8)}</p>
          </div>
        </div>

        <div className="bg-general-20 border border-general-30 rounded-xl p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${newStatus === 'pending' ? 'bg-orange-400' : 'bg-blue-100/10'}`}></div>

            <div className="mb-6 pb-6 border-b border-general-30">
                <h2 className="h5 font-heading text-general-100 mb-1">{report.title}</h2>
                <p className="body-sm text-general-60">{CATEGORY_LABELS[report.category] || report.category}</p>
            </div>

            <div className="space-y-6">
                {/* --- DATA PELAPOR --- */}
                {report.reporter && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block body-sm font-heading font-bold text-general-100 mb-2">Nama Pelapor</label>
                      <div className="w-full px-4 py-3 bg-general-30/50 border border-general-30 rounded-lg text-general-80 body-sm flex items-center gap-2">
                        <User className="w-4 h-4 text-general-60" />
                        {report.reporter.name}
                      </div>
                    </div>
                    <div>
                      <label className="block body-sm font-heading font-bold text-general-100 mb-2">Email Pelapor</label>
                      <button 
                        onClick={() => setViewingUserHistory({ 
                          name: report.reporter!.name, 
                          email: report.reporter!.email 
                        })}
                        className="w-full px-4 py-3 bg-blue-100/5 border border-blue-20 rounded-lg text-blue-100 body-sm flex items-center justify-between group hover:bg-blue-100/10 hover:border-blue-40 transition-all text-left"
                        title="Klik untuk melihat riwayat laporan pengguna ini"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Mail className="w-4 h-4 shrink-0" />
                          <span className="truncate underline decoration-blue-100/30 group-hover:decoration-blue-100">{report.reporter.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs bg-blue-100 text-general-20 px-2 py-0.5 rounded-full shrink-0 font-medium">
                          <History className="w-3 h-3" />
                          Riwayat
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                    <label className="block body-sm font-heading font-bold text-general-100 mb-2">Detail Lokasi</label>
                    <div className="w-full px-4 py-3 bg-general-30/50 border border-general-30 rounded-lg text-general-80 body-sm font-medium">
                        {report.location} - {report.district || report.city}, {report.city}, {report.province}
                    </div>
                </div>

                <div>
                    <label className="block body-sm font-heading font-bold text-general-100 mb-2">Kronologi Kejadian</label>
                    <div className="w-full px-4 py-3 bg-general-30/50 border border-general-30 rounded-lg text-general-80 body-sm leading-relaxed min-h-[100px]">
                        {report.description}
                    </div>
                </div>

                {report.files && report.files.length > 0 && (
                  <div>
                      <label className="block body-sm font-heading font-bold text-general-100 mb-2">Bukti Foto ({report.files.length})</label>
                      <div className="space-y-3">
                          {report.files.map((file: any) => (
                              <div key={file.id} className="flex items-center justify-between px-4 py-3 bg-general-30/50 border border-general-30 rounded-lg group hover:border-blue-40 transition-colors">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                      <div className="p-2 bg-general-20 rounded-md text-general-60 border border-general-30 shrink-0"><ImageIcon className="w-5 h-5" /></div>
                                      <span className="body-sm font-medium text-general-80 truncate">{file.fileName}</span>
                                  </div>
                                  <button onClick={() => setSelectedImage(file.fileUrl)} className="text-xs font-bold text-blue-100 hover:text-blue-90 hover:underline px-3 shrink-0 transition-colors">Lihat</button>
                              </div>
                          ))}
                      </div>
                  </div>
                )}

                {/* Scoring */}
                {scoring && (
                  <div>
                    <label className="block body-sm font-heading font-bold text-general-100 mb-2">Skor Kredibilitas</label>
                    <div className="mt-1 px-4 py-3 bg-blue-20 border border-blue-30 rounded-lg flex items-center justify-between">
                      <span className="body-sm font-medium text-blue-100">Total Skor Sistem</span>
                      <span className="h5 text-blue-100">{scoring.totalScore}/18 ({CREDIBILITY_LABELS[scoring.credibilityLevel] || scoring.credibilityLevel})</span>
                    </div>
                  </div>
                )}

                {/* --- AREA EDIT ADMIN --- */}
                <div className="p-5 bg-general-30/30 border border-general-30 rounded-xl space-y-4">
                    <h3 className="body-md font-bold text-general-100 border-b border-general-30 pb-2">Panel Verifikasi Admin</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block body-sm font-heading font-bold text-general-100 mb-2">Status Laporan</label>
                            <div className="relative">
                                <select 
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                                    className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg appearance-none cursor-pointer pr-10 body-sm focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 text-general-100"
                                >
                                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-general-60 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block body-sm font-heading font-bold text-general-100 mb-2">Tingkat Masalah</label>
                            <div className="relative">
                                <select 
                                    value={newRisk}
                                    onChange={(e) => setNewRisk(e.target.value)}
                                    className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg appearance-none cursor-pointer pr-10 body-sm focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 text-general-100"
                                >
                                    <option value="" disabled>-- Pilih Tingkat Masalah --</option>
                                    {RISK_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-general-60 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block body-sm font-heading font-bold text-general-100 mb-2">Catatan Admin</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Tambahkan alasan perubahan status atau tingkat masalah..."
                          className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg text-general-100 body-sm focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 min-h-[80px]"
                        />
                    </div>
                </div>

                {/* Riwayat Status */}
                {history.length > 0 && (
                  <div>
                    <label className="block body-sm font-heading font-bold text-general-100 mb-2">Riwayat Status</label>
                    <div className="space-y-2">
                      {history.map((h: any) => (
                        <div key={h.id} className="flex items-start gap-3 px-4 py-3 bg-general-30/30 border border-general-30 rounded-lg">
                          <Clock className="w-4 h-4 text-general-60 mt-0.5 shrink-0" />
                          <div className="body-sm">
                            <span className="text-general-60">{h.fromStatus || "Baru"}</span>
                            <span className="mx-2 text-general-60">→</span>
                            <span className="font-medium text-general-100">{h.toStatus}</span>
                            {h.notes && <p className="text-general-60 mt-1 italic">"{h.notes}"</p>}
                            <p className="text-xs text-general-50 mt-1">{formatDate(h.createdAt)} oleh {h.changedBy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="mt-10 pt-6 border-t border-general-30 flex justify-end">
                <button 
                    onClick={handleSaveChanges}
                    disabled={updateStatus.isPending}
                    className="px-8 py-3 bg-blue-100 hover:bg-blue-90 text-general-20 font-heading font-semibold rounded-lg shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 body-sm"
                >
                    {updateStatus.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Simpan Perubahan</>}
                </button>
            </div>
        </div>
      </div>

      {/* MODAL RIWAYAT USER */}
      {viewingUserHistory && (
        <UserHistoryModal 
          user={viewingUserHistory} 
          onClose={() => setViewingUserHistory(null)} 
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-general-20 rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-green-20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-100" />
            </div>
            <h3 className="h5 text-general-100 mb-2">Berhasil!</h3>
            <p className="body-sm text-general-60 mb-6">Status laporan berhasil diperbarui.</p>
            <button 
              onClick={handleCloseSuccessModal}
              className="w-full px-6 py-3 bg-blue-100 hover:bg-blue-90 text-general-20 font-semibold rounded-lg transition-colors"
            >
              Kembali ke Daftar
            </button>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200 p-4"
            onClick={() => setSelectedImage(null)}
        >
            <div className="relative w-full h-full flex items-center justify-center">
                <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-4 right-4 p-3 bg-general-100/50 hover:bg-general-100 text-general-20 rounded-full transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>
                <img 
                    src={selectedImage} 
                    alt="Bukti Laporan" 
                    className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
                    onClick={(e) => e.stopPropagation()} 
                />
            </div>
        </div>
      )}

    </DashboardAnggotaLayout>
  )
}