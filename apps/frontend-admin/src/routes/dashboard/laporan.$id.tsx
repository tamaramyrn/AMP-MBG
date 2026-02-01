import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { DashboardAnggotaLayout } from "@/components/dashboard/dashboard-admin-layout"
import {
  ArrowLeft,
  User,
  X,
  ChevronDown,
  CheckCircle,
  Loader2,
  Clock,
  Save,
  History,
  ExternalLink,
  MapPin,
  FileText,
  BarChart3,
  Calendar,
  CheckCircle2,
  Building2, 
  Utensils
} from "lucide-react"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminService } from "@/services/admin"
import type { ReportStatus } from "@/services/reports"

export const Route = createFileRoute("/dashboard/laporan/$id")({
  component: LaporanDetail,
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

const STATUS_LABELS: Record<string, { label: string; style: string }> = {
  pending: { label: "Menunggu Verifikasi", style: "bg-orange-20 text-orange-100 border-orange-30" },
  analyzing: { label: "Dalam Proses Analisis", style: "bg-blue-20 text-blue-100 border-blue-30" },
  needs_evidence: { label: "Butuh Bukti Tambahan", style: "bg-yellow-50 text-general-80 border-yellow-100" },
  invalid: { label: "Tidak Valid", style: "bg-red-20 text-red-100 border-red-30" },
  in_progress: { label: "Dalam Proses Penanganan", style: "bg-purple-100/10 text-purple-600 border-purple-200" },
  resolved: { label: "Selesai Ditangani", style: "bg-green-20 text-green-100 border-green-30" },
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Menunggu Verifikasi" },
  { value: "analyzing", label: "Dalam Proses Analisis" },
  { value: "needs_evidence", label: "Butuh Bukti Tambahan" },
  { value: "invalid", label: "Tidak Valid" },
  { value: "in_progress", label: "Dalam Proses Penanganan" },
  { value: "resolved", label: "Selesai Ditangani" },
]

const CREDIBILITY_LABELS: Record<string, { label: string; style: string }> = {
  high: { label: "Tinggi", style: "text-red-100 bg-red-20 border-red-30" },
  medium: { label: "Sedang", style: "text-general-80 bg-yellow-50 border-yellow-100" },
  low: { label: "Rendah", style: "text-green-100 bg-green-20 border-green-30" },
}

const RISK_OPTIONS = [
  { value: "high", label: "Tinggi" },
  { value: "medium", label: "Sedang" },
  { value: "low", label: "Rendah" },
]

const SCORING_LABELS: Record<string, string> = {
  scoreRelation: "Relasi dengan MBG",
  scoreLocationTime: "Validitas Lokasi & Waktu",
  scoreEvidence: "Bukti Pendukung",
  scoreNarrative: "Konsistensi Narasi",
  scoreReporterHistory: "Riwayat Pelapor",
  scoreSimilarity: "Kesesuaian Laporan Lain",
}

function UserHistoryModal({ user, onClose }: { user: { name: string; email: string }; onClose: () => void }) {
  const { data: historyData, isLoading } = useQuery({
    queryKey: ["admin", "reports", "user-history", user.email],
    queryFn: () => adminService.getReports({ search: user.email, limit: 20 }),
  })

  const reports = historyData?.data || []

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-general-20 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-general-30">
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

        <div className="flex-1 overflow-y-auto p-0">
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
                  <th className="p-4 text-center">Kredibilitas</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-general-30">
                {reports.map((report) => {
                  const statusInfo = STATUS_LABELS[report.status] || { label: report.status, style: "bg-general-30 text-general-70 border-general-40" }
                  const credInfo = CREDIBILITY_LABELS[report.credibilityLevel] || { label: "-", style: "" }
                  return (
                    <tr key={report.id} className="hover:bg-general-30/20 transition-colors">
                      <td className="p-4 body-sm text-general-80 align-top whitespace-nowrap">{formatDate(report.createdAt)}</td>
                      <td className="p-4 body-sm align-top">
                        <p className="font-medium text-general-100 line-clamp-1">{report.title}</p>
                        <p className="text-general-60 text-xs mt-0.5">{report.city}, {report.province}</p>
                      </td>
                      <td className="p-4 align-top text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.style}`}>{statusInfo.label}</span>
                      </td>
                      <td className="p-4 align-top text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${credInfo.style}`}>{credInfo.label}</span>
                      </td>
                      <td className="p-4 align-top text-right">
                        <a href={`/dashboard/laporan/${report.id}`} target="_blank" rel="noreferrer" className="text-blue-100 hover:text-blue-90 hover:underline body-sm font-medium">Detail</a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-general-30 bg-general-20 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-general-30 hover:bg-general-40 text-general-100 rounded-lg body-sm font-medium transition-colors">Tutup</button>
        </div>
      </div>
    </div>
  )
}

function LaporanDetail() {
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
      adminService.updateReportStatus(id, { status: data.status, credibilityLevel: data.credibilityLevel, notes: data.notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "report", id] })
      setShowSuccessModal(true)
    },
  })

  const handleSaveChanges = () => {
    if (!newStatus) return
    updateStatus.mutate({ status: newStatus, credibilityLevel: newRisk, notes: notes || undefined })
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    navigate({ to: "/dashboard/laporan" })
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
  const formatDateTime = (dateStr: string) => new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })

  const currentStatus = report ? STATUS_LABELS[report.status] || { label: report.status, style: "bg-general-30 text-general-70" } : null
  const hasChanges = report && (newStatus !== report.status || newRisk !== report.credibilityLevel || notes !== (report.adminNotes || ""))


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
          <Link to="/dashboard/laporan" className="text-blue-100 hover:underline mt-2 inline-block">Kembali ke daftar</Link>
        </div>
      </DashboardAnggotaLayout>
    )
  }

  // --- HELPER UNTUK MENGGABUNGKAN NAMA ---
  const relatedParties = [
    (report as any).schoolName || report.location, 
    (report as any).kitchenName                   
  ].filter(Boolean).join(", ") || "-"

  return (
    <DashboardAnggotaLayout>
      {/* FLUID CONTAINER: Responsif 100% mengikuti standar Dashboard utama */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-8 max-w-[2400px]">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3 flex-1">
            <Link to="/dashboard/laporan" className="p-2 rounded-full hover:bg-general-30 text-general-60 hover:text-general-100 transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
                <h1 className="h4 text-general-100 font-heading">Detail Laporan</h1>
                <p className="body-sm text-general-60 mt-0.5">ID: #{id.slice(0, 8)}</p>
            </div>
          </div>
          <div>
             <span className={`inline-flex px-4 py-2 rounded-full text-xs font-bold border shadow-sm ${currentStatus?.style}`}>
                {currentStatus?.label}
             </span>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left Column (Detail Info) */}
            <div className="xl:col-span-2 space-y-6">

                {/* 1. Informasi Pelapor (Blue Accents) */}
                <div className="bg-general-20 border border-blue-20 rounded-xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-20/50 rounded-bl-full -mr-6 -mt-6 pointer-events-none" />
                    <h4 className="h4 text-general-100 mb-5 flex items-center gap-2 relative z-10">
                        <User className="w-5 h-5 text-blue-100" />
                        Informasi Pelapor
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 relative z-10">
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-general-50 font-bold mb-1">Nama Lengkap</label>
                            <p className="body-sm font-semibold text-general-100">{report.reporter?.name || "Anonim"}</p>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-general-50 font-bold mb-1">Hubungan</label>
                            <p className="body-sm font-semibold text-general-100">{RELATION_LABELS[report.relation] || report.relation}</p>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-general-50 font-bold mb-1">Email</label>
                            <p className="body-sm font-medium text-general-100">{report.reporter?.email || "-"}</p>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-general-50 font-bold mb-1">Nomor Telepon</label>
                            <p className="body-sm font-medium text-general-100">{report.reporter?.phone || "-"}</p>
                        </div>
                    </div>
                    {report.reporter && (
                        <div className="mt-6 pt-4 border-t border-general-30 relative z-10">
                            <button
                                onClick={() => setViewingUserHistory({ name: report.reporter!.name, email: report.reporter!.email })}
                                className="text-xs font-bold text-blue-100 hover:text-blue-80 hover:underline flex items-center gap-1.5 transition-colors"
                            >
                                <History className="w-3.5 h-3.5" />
                                Lihat Riwayat Laporan Pelapor
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. PIHAK YANG TERKAIT (Orange Accents) - UPDATED: NO EXTRA NOTE */}
                <div className="bg-general-20 border border-general-30 rounded-xl p-6 shadow-sm relative overflow-hidden">
                    {/* Decorative Orange element */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-warning/10 rounded-bl-full -mr-6 -mt-6 pointer-events-none" />
                    
                    <h4 className="h4 text-general-100 mb-5 flex items-center gap-2 relative z-10">
                        <Building2 className="w-5 h-5 text-warning" />
                        Pihak Yang Terkait
                    </h4>
                    
                    <div className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-general-50 font-bold mb-2">Entitas Terlibat</label>
                            <p className="body-sm font-semibold text-general-100 flex items-start gap-2">
                                <Utensils className="w-4 h-4 text-general-60 mt-0.5 shrink-0" />
                                {relatedParties}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Detail Kejadian (Neutral) */}
                <div className="bg-general-20 border border-general-30 rounded-xl p-6 shadow-sm">
                    <h4 className="h4 text-general-100 mb-5 flex items-center gap-2 border-b border-general-30 pb-3">
                        <FileText className="w-5 h-5 text-general-100" />
                        Detail Kejadian
                    </h4>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-general-60 mb-1">Judul Laporan</label>
                            <p className="h5 font-bold text-general-100 leading-snug">{report.title}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-general-30/50 text-general-80 text-xs font-medium border border-general-30">
                                {CATEGORY_LABELS[report.category] || report.category}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-general-30/50 text-general-80 text-xs font-medium border border-general-30">
                                <Calendar className="w-3 h-3" />
                                {formatDate(report.incidentDate)}
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-general-60 mb-2">Lokasi Kejadian</label>
                            <div className="flex items-start gap-3 bg-general-30/30 p-3 rounded-lg border border-general-30">
                                <MapPin className="w-4 h-4 text-general-50 mt-0.5 shrink-0" />
                                <div>
                                    <p className="body-sm font-medium text-general-100">{report.location}</p>
                                    <p className="text-xs text-general-60 mt-0.5">{report.district && `${report.district}, `}{report.city}, {report.province}</p>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${report.location}, ${report.district || ""}, ${report.city}, ${report.province}, Indonesia`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-100 hover:underline"
                                    >
                                        Buka Peta <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-general-60 mb-2">Kronologi Lengkap</label>
                            <div className="body-sm text-general-100 leading-relaxed whitespace-pre-wrap bg-general-20 p-0">
                                {report.description}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-general-60 mb-3">Bukti Lampiran</label>
                            {report.files && report.files.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {report.files.map((file: any) => (
                                  <div
                                    key={file.id}
                                    className="group relative aspect-square bg-general-30 rounded-xl overflow-hidden border border-general-30 cursor-pointer shadow-sm hover:shadow-md transition-all"
                                    onClick={() => setSelectedImage(file.fileUrl)}
                                  >
                                    <img src={file.fileUrl} alt={file.fileName || "Bukti"} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ExternalLink className="w-5 h-5 text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-8 bg-general-30/30 rounded-xl border border-dashed border-general-40">
                                <FileText className="w-8 h-8 text-general-50 mb-2" />
                                <p className="body-sm text-general-60">Tidak ada bukti lampiran</p>
                              </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Right Column (Actions & Scoring) */}
            <div className="space-y-6">

                {/* Panel Verifikasi Admin (NO STICKY) */}
                <div className="bg-general-20 border border-blue-20 shadow-md shadow-blue-20/10 rounded-xl p-6">
                    <h4 className="h4 text-general-100 mb-5 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-100" />
                        Tindak Lanjut Admin
                    </h4>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-general-60 mb-1.5">Update Status</label>
                            <div className="relative">
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                                    className="w-full px-4 py-2.5 bg-general-20 border border-general-30 rounded-lg appearance-none cursor-pointer pr-10 body-sm focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 text-general-100 font-medium"
                                >
                                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-general-60 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-general-60 mb-1.5">Penilaian Risiko</label>
                            <div className="relative">
                                <select
                                    value={newRisk}
                                    onChange={(e) => setNewRisk(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-general-20 border border-general-30 rounded-lg appearance-none cursor-pointer pr-10 body-sm focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 text-general-100 font-medium"
                                >
                                    <option value="" disabled>-- Pilih Tingkat --</option>
                                    {RISK_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-general-60 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-general-60 mb-1.5">Catatan Internal</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Tulis alasan perubahan status..."
                                className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg text-general-100 body-sm focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 min-h-[100px] resize-none"
                            />
                        </div>

                        <button
                            onClick={handleSaveChanges}
                            disabled={updateStatus.isPending || !hasChanges}
                            className="w-full py-3 bg-blue-100 text-general-20 font-bold rounded-xl hover:bg-blue-90 shadow-md hover:shadow-lg transition-all body-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan Perubahan
                        </button>
                    </div>
                </div>

                {/* Matriks Penilaian */}
                {scoring && (
                    <div className="bg-general-20 border border-general-30 rounded-xl p-5">
                    <h4 className="h4 text-general-100 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-general-60" />
                        Skor Kredibilitas
                    </h4>
                    <div className="space-y-3">
                        {Object.entries(SCORING_LABELS).map(([key, label]) => {
                        const scoreData = scoring[key as keyof typeof scoring]
                        const value = typeof scoreData === 'object' ? scoreData.value : (typeof scoreData === 'number' ? scoreData : 0)
                        const max = typeof scoreData === 'object' ? scoreData.max : 3
                        const percentage = (Number(value) / Number(max)) * 100
                        return (
                            <div key={key}>
                                <div className="flex justify-between text-[10px] uppercase font-bold text-general-60 mb-1">
                                    <span>{label}</span>
                                    <span>{value}/{max}</span>
                                </div>
                                <div className="w-full h-1.5 bg-general-30 rounded-full overflow-hidden">
                                    <div
                                    className={`h-full rounded-full transition-all ${percentage >= 66 ? 'bg-green-100' : percentage >= 33 ? 'bg-warning' : 'bg-red-100'}`}
                                    style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        )
                        })}
                    </div>
                    <div className="mt-5 pt-4 border-t border-general-30">
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-xs text-general-60">Total Skor</span>
                                <p className="h4 font-bold text-general-100 leading-none mt-1">{scoring.totalScore}<span className="text-sm text-general-50 font-normal">/18</span></p>
                            </div>
                            <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold border ${CREDIBILITY_LABELS[scoring.credibilityLevel]?.style || ''}`}>
                                {CREDIBILITY_LABELS[scoring.credibilityLevel]?.label || scoring.credibilityLevel}
                            </span>
                        </div>
                    </div>
                    </div>
                )}

                {/* Riwayat Status */}
                {history.length > 0 && (
                    <div className="bg-general-20 border border-general-30 rounded-xl p-5">
                    <h4 className="h4 text-general-100 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-general-60" />
                        Log Aktivitas
                    </h4>
                    <div className="relative pl-2 border-l-2 border-general-30 space-y-6 my-2">
                        {history.map((h: any) => (
                        <div key={h.id} className="relative pl-4">
                            <div className="absolute -left-[13px] top-1.5 w-2.5 h-2.5 rounded-full bg-general-40 border-2 border-general-20" />
                            <p className="text-xs text-general-50 mb-0.5">{formatDateTime(h.createdAt)}</p>
                            <div className="body-sm font-medium text-general-100">
                                Status diubah menjadi <span className="text-blue-100">{h.toStatus}</span>
                            </div>
                            <p className="text-xs text-general-60 mt-0.5">Oleh: {h.changedBy}</p>
                            {h.notes && (
                                <div className="mt-2 bg-general-30/30 border border-general-30 p-2 rounded text-xs text-general-80 italic">
                                    "{h.notes}"
                                </div>
                            )}
                        </div>
                        ))}
                    </div>
                    </div>
                )}

            </div>
        </div>
      </div>

      {/* User History Modal */}
      {viewingUserHistory && <UserHistoryModal user={viewingUserHistory} onClose={() => setViewingUserHistory(null)} />}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-general-20 rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200 border border-general-30">
            <div className="mx-auto w-16 h-16 bg-green-20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-100" />
            </div>
            <h3 className="h5 text-general-100 mb-2">Berhasil!</h3>
            <p className="body-sm text-general-60 mb-6">Status laporan berhasil diperbarui.</p>
            <button onClick={handleCloseSuccessModal} className="w-full px-6 py-3 bg-blue-100 hover:bg-blue-90 text-general-20 font-bold rounded-xl transition-colors shadow-md">Kembali ke Daftar</button>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative w-full h-full flex items-center justify-center">
            <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 p-3 bg-general-100/50 hover:bg-general-100 text-general-20 rounded-full transition-colors z-10">
              <X className="w-6 h-6" />
            </button>
            <img src={selectedImage} alt="Bukti Laporan" className="max-w-full max-h-full object-contain rounded-md shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}

    </DashboardAnggotaLayout>
  )
}