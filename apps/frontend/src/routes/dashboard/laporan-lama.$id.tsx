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
  Clock
} from "lucide-react"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminService } from "@/services/admin"
import type { ReportStatus } from "@/services/reports"

export const Route = createFileRoute("/dashboard/laporan-lama/$id")({
  component: LaporanLamaDetail,
})

const CATEGORY_LABELS: Record<string, string> = {
  poisoning: "Keracunan dan Masalah Kesehatan",
  kitchen: "Operasional Dapur",
  quality: "Kualitas dan Keamanan Dapur",
  policy: "Kebijakan dan Anggaran",
  implementation: "Implementasi Program",
  social: "Dampak Sosial dan Ekonomi",
}

const RELATION_LABELS: Record<string, string> = {
  parent: "Orang Tua/Wali Murid",
  teacher: "Guru/Tenaga Pendidik",
  principal: "Kepala Sekolah",
  supplier: "Penyedia Makanan/Supplier",
  student: "Siswa",
  community: "Masyarakat Umum",
  other: "Lainnya",
}

const STATUS_OPTIONS = [
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

function LaporanLamaDetail() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [newStatus, setNewStatus] = useState<ReportStatus | "">("")
  const [notes, setNotes] = useState("")

  // Fetch report detail
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["admin", "report", id],
    queryFn: () => adminService.getReport(id),
  })

  // Set initial values when data loads
  useEffect(() => {
    if (reportData?.data) {
      setNewStatus(reportData.data.status as ReportStatus)
      setNotes(reportData.data.adminNotes || "")
    }
  }, [reportData])

  // Fetch scoring details
  const { data: scoringData } = useQuery({
    queryKey: ["admin", "report", id, "scoring"],
    queryFn: () => adminService.getReportScoring(id),
    enabled: !!reportData,
  })

  // Fetch status history
  const { data: historyData } = useQuery({
    queryKey: ["admin", "report", id, "history"],
    queryFn: () => adminService.getReportHistory(id),
    enabled: !!reportData,
  })

  const report = reportData?.data
  const scoring = scoringData?.data
  const history = historyData?.data || []

  // Mutation for status update
  const updateStatus = useMutation({
    mutationFn: (data: { status: ReportStatus; notes?: string }) => 
      adminService.updateReportStatus(id, data),
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
      notes: notes || undefined,
    })
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    navigate({ to: "/dashboard/laporan-lama" })
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
          <Link to="/dashboard/laporan-lama" className="text-blue-100 hover:underline mt-2 inline-block">
            Kembali ke daftar
          </Link>
        </div>
      </DashboardAnggotaLayout>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <DashboardAnggotaLayout>
      <div className="p-8 max-w-4xl mx-auto font-sans relative">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/dashboard/laporan-lama" 
            className="p-2 rounded-full hover:bg-general-30 text-general-60 hover:text-general-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="h4 text-general-100">Detail Laporan</h1>
            <p className="body-sm text-general-60">ID Laporan: #{id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-general-20 border border-general-30 rounded-xl p-6 md:p-8 shadow-sm relative overflow-hidden">
            
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-100/10"></div>

            <div className="mb-6 pb-6 border-b border-general-30">
                <h2 className="h5 font-heading text-general-100 mb-1">{report.title}</h2>
                <p className="body-sm text-general-60">{CATEGORY_LABELS[report.category] || report.category}</p>
            </div>

            <div className="space-y-6">
                {/* Reporter Info */}
                {report.reporter && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block body-sm font-heading font-bold text-general-100 mb-2">Nama Pelapor</label>
                      <div className="w-full px-4 py-3 bg-general-30/50 border border-general-30 rounded-lg text-general-80 body-sm">
                        {report.reporter.name}
                      </div>
                    </div>
                    <div>
                      <label className="block body-sm font-heading font-bold text-general-100 mb-2">Email Pelapor</label>
                      <div className="w-full px-4 py-3 bg-general-30/50 border border-general-30 rounded-lg text-general-80 body-sm">
                        {report.reporter.email}
                      </div>
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

                {/* Evidence Files */}
                {report.files && report.files.length > 0 && (
                  <div>
                      <label className="block body-sm font-heading font-bold text-general-100 mb-2">
                          Bukti Foto ({report.files.length})
                      </label>
                      <div className="space-y-3">
                          {report.files.map((file: any) => (
                              <div key={file.id} className="flex items-center justify-between px-4 py-3 bg-general-30/50 border border-general-30 rounded-lg group hover:border-blue-40 transition-colors">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                      <div className="p-2 bg-general-20 rounded-md text-general-60 border border-general-30 shrink-0">
                                          <ImageIcon className="w-5 h-5" />
                                      </div>
                                      <span className="body-sm font-medium text-general-80 truncate">
                                          {file.fileName}
                                      </span>
                                  </div>
                                  <button 
                                      onClick={() => setSelectedImage(file.fileUrl)}
                                      className="text-xs font-bold text-blue-100 hover:text-blue-90 hover:underline px-3 shrink-0 transition-colors"
                                  >
                                      Lihat
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
                )}

                <div>
                    <label className="block body-sm font-heading font-bold text-general-100 mb-2">Relasi dengan MBG</label>
                    <div className="w-full px-4 py-3 bg-general-30/50 border border-general-30 rounded-lg text-general-80 body-sm flex items-center gap-2">
                        <User className="w-4 h-4 text-general-60" />
                        {RELATION_LABELS[report.relation] || report.relation}
                    </div>
                </div>

                {/* Scoring Section */}
                {scoring && (
                  <div>
                    <label className="block body-sm font-heading font-bold text-general-100 mb-2">Skor Kredibilitas</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="px-3 py-2 bg-general-30/50 border border-general-30 rounded-lg">
                        <span className="body-xs text-general-60">Relasi MBG</span>
                        <p className="body-sm font-bold text-general-100">{scoring.scoreRelation.value}/{scoring.scoreRelation.max}</p>
                      </div>
                      <div className="px-3 py-2 bg-general-30/50 border border-general-30 rounded-lg">
                        <span className="body-xs text-general-60">Lokasi & Waktu</span>
                        <p className="body-sm font-bold text-general-100">{scoring.scoreLocationTime.value}/{scoring.scoreLocationTime.max}</p>
                      </div>
                      <div className="px-3 py-2 bg-general-30/50 border border-general-30 rounded-lg">
                        <span className="body-xs text-general-60">Bukti</span>
                        <p className="body-sm font-bold text-general-100">{scoring.scoreEvidence.value}/{scoring.scoreEvidence.max}</p>
                      </div>
                      <div className="px-3 py-2 bg-general-30/50 border border-general-30 rounded-lg">
                        <span className="body-xs text-general-60">Narasi</span>
                        <p className="body-sm font-bold text-general-100">{scoring.scoreNarrative.value}/{scoring.scoreNarrative.max}</p>
                      </div>
                      <div className="px-3 py-2 bg-general-30/50 border border-general-30 rounded-lg">
                        <span className="body-xs text-general-60">Riwayat Pelapor</span>
                        <p className="body-sm font-bold text-general-100">{scoring.scoreReporterHistory.value}/{scoring.scoreReporterHistory.max}</p>
                      </div>
                      <div className="px-3 py-2 bg-general-30/50 border border-general-30 rounded-lg">
                        <span className="body-xs text-general-60">Kemiripan</span>
                        <p className="body-sm font-bold text-general-100">{scoring.scoreSimilarity.value}/{scoring.scoreSimilarity.max}</p>
                      </div>
                    </div>
                    <div className="mt-3 px-4 py-3 bg-blue-20 border border-blue-30 rounded-lg flex items-center justify-between">
                      <span className="body-sm font-medium text-blue-100">Total Skor</span>
                      <span className="h5 text-blue-100">{scoring.totalScore}/18 ({CREDIBILITY_LABELS[scoring.credibilityLevel] || scoring.credibilityLevel})</span>
                    </div>
                  </div>
                )}

                {/* Editable Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block body-sm font-heading font-bold text-general-100 mb-2">Status Laporan</label>
                        <div className="relative">
                            <select 
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                                className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg appearance-none cursor-pointer pr-10 body-sm focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100"
                            >
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-general-60 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block body-sm font-heading font-bold text-general-100 mb-2">Tingkat Risiko</label>
                        <div className="w-full px-4 py-3 bg-general-30/50 border border-general-30 rounded-lg text-general-80 body-sm font-semibold">
                            {CREDIBILITY_LABELS[report.credibilityLevel] || report.credibilityLevel}
                        </div>
                    </div>
                </div>

                {/* Admin Notes */}
                <div>
                    <label className="block body-sm font-heading font-bold text-general-100 mb-2">Catatan Admin</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tambahkan catatan (opsional)"
                      className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg text-general-80 body-sm focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 min-h-[80px]"
                    />
                </div>

                {/* Status History */}
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
                            {h.notes && <p className="text-general-60 mt-1">"{h.notes}"</p>}
                            <p className="text-xs text-general-50 mt-1">{formatDate(h.createdAt)} oleh {h.changedBy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Action Button */}
            <div className="mt-10 pt-6 border-t border-general-30 flex justify-end">
                <button 
                    onClick={handleSaveChanges}
                    disabled={updateStatus.isPending}
                    className="px-8 py-3 bg-blue-100 hover:bg-blue-90 text-general-20 font-heading font-semibold rounded-lg shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 body-sm"
                >
                    {updateStatus.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Perubahan"}
                </button>
            </div>
        </div>
      </div>

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
