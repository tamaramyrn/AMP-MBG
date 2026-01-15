import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { DashboardAnggotaLayout } from "@/components/dashboard/dashboard-anggota-layout"
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  CheckCircle, 
  XCircle, 
  User,
  AlertCircle,
  X,
  Loader2
} from "lucide-react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminService } from "@/services/admin"

export const Route = createFileRoute("/dashboard/laporan-baru/$id")({
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

function LaporanDetail() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [notes, setNotes] = useState("")

  // Fetch report detail
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["admin", "report", id],
    queryFn: () => adminService.getReport(id),
  })

  const report = reportData?.data

  // Mutation for status update
  const updateStatus = useMutation({
    mutationFn: (data: { status: "verified" | "rejected"; notes?: string }) => 
      adminService.updateReportStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] })
      navigate({ to: "/dashboard/laporan-lama" })
    },
  })

  const handleAction = (action: 'verify' | 'reject') => {
    updateStatus.mutate({
      status: action === 'verify' ? 'verified' : 'rejected',
      notes: notes || undefined,
    })
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
          <Link to="/dashboard/laporan-baru" className="text-blue-100 hover:underline mt-2 inline-block">
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
    })
  }

  return (
    <DashboardAnggotaLayout>
      <div className="p-8 max-w-4xl mx-auto font-sans relative">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/dashboard/laporan-baru" 
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
            
            <div className="absolute top-0 left-0 w-full h-2 bg-green-100/10"></div>

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
                    <label className="block body-sm font-heading font-bold text-general-100 mb-2">Tanggal Kejadian</label>
                    <div className="w-full px-4 py-3 bg-general-30/50 border border-general-30 rounded-lg text-general-80 body-sm">
                        {formatDate(report.incidentDate)}
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
                              <div key={file.id} className="flex items-center justify-between px-4 py-3 bg-general-30/50 border border-general-30 rounded-lg group hover:border-green-40 transition-colors">
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
                        {report.relationDetail && ` - ${report.relationDetail}`}
                    </div>
                </div>

                {/* Admin Notes */}
                <div>
                    <label className="block body-sm font-heading font-bold text-general-100 mb-2">Catatan Admin</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tambahkan catatan verifikasi (opsional)"
                      className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg text-general-80 body-sm focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 min-h-[80px]"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-10 pt-6 border-t border-general-30 flex flex-col-reverse sm:flex-row justify-end gap-4">
                <button 
                    onClick={() => handleAction('reject')}
                    disabled={updateStatus.isPending}
                    className="px-6 py-3 bg-red-100 hover:bg-red-90 text-general-20 font-heading font-semibold rounded-lg shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 body-sm"
                >
                    {updateStatus.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><XCircle className="w-5 h-5" /> Tolak Laporan</>}
                </button>

                <button 
                    onClick={() => handleAction('verify')}
                    disabled={updateStatus.isPending}
                    className="px-6 py-3 bg-green-100 hover:bg-green-90 text-general-20 font-heading font-semibold rounded-lg shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 body-sm"
                >
                    {updateStatus.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Verifikasi</>}
                </button>
            </div>
        </div>
        
        {/* Info Box */}
        <div className="mt-6 flex items-start gap-3 p-4 bg-blue-20 border border-blue-30 rounded-lg text-blue-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="body-sm">
                <p className="font-bold mb-1">Catatan Verifikator:</p>
                <p>Pastikan bukti foto valid dan kronologi masuk akal sebelum memverifikasi laporan.</p>
            </div>
        </div>

      </div>

      {/* Modal Image */}
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
                    alt="Bukti Laporan Full" 
                    className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
                    onClick={(e) => e.stopPropagation()} 
                />
            </div>
        </div>
      )}

    </DashboardAnggotaLayout>
  )
}
