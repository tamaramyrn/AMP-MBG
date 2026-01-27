import { createFileRoute } from "@tanstack/react-router"
import { DashboardAnggotaLayout } from "@/components/dashboard/dashboard-admin-layout"
import {
  Search,
  Loader2,
  Utensils,
  Filter,
  Eye,
  ChevronDown,
  CheckCircle2,
  Briefcase,
  Phone,
  User,
  Save,
  X,
  Calendar,
  ChefHat,
  Truck,
  Calculator,
  Droplets,
  LayoutTemplate,
  Inbox
} from "lucide-react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// --- MOCK DATA ---
const mockRequests = [
  {
    id: "REQ-2024-001",
    sppgName: "Dapur Umum Sejahtera",
    contactPerson: "Budi Santoso",
    position: "Manajer Operasional",
    phone: "08123456789",
    category: "ahli_gizi",
    details: "Kami membutuhkan konsultasi untuk menyusun menu siklus 10 hari yang memenuhi standar gizi lansia.",
    status: "pending", 
    createdAt: "2024-01-26T08:00:00Z"
  },
  {
    id: "REQ-2024-002",
    sppgName: "Katering Berkah",
    contactPerson: "Siti Aminah",
    position: "Pemilik",
    phone: "08198765432",
    category: "peralatan",
    details: "Membutuhkan pengadaan 2 unit oven gas kapasitas besar untuk meningkatkan produksi roti.",
    status: "processed", 
    createdAt: "2024-01-25T14:30:00Z"
  },
  {
    id: "REQ-2024-003",
    sppgName: "Sekolah Alam",
    contactPerson: "Rahmat",
    position: "Kepala Dapur",
    phone: "08567890123",
    category: "ipal",
    details: "Saluran pembuangan limbah cair sering tersumbat dan menimbulkan bau. Butuh asesmen IPAL.",
    status: "completed", 
    createdAt: "2024-01-20T09:15:00Z"
  },
  {
    id: "REQ-2024-004",
    sppgName: "UD. Sumber Rejeki",
    contactPerson: "Joko",
    position: "Staff Logistik",
    phone: "08123456000",
    category: "logistik",
    details: "Kesulitan mendapatkan pasokan beras organik yang stabil. Mencari vendor alternatif.",
    status: "not_found", 
    createdAt: "2024-01-15T11:00:00Z"
  }
]

export const Route = createFileRoute("/dashboard/permintaan-kebutuhan-dapur")({
  component: PermintaanKebutuhanDapurPage,
})

// --- CONFIG ---
const CATEGORY_OPTIONS = [
  { value: "ahli_gizi", label: "Ahli Gizi", icon: Utensils },
  { value: "akuntan", label: "Akuntan/Keuangan", icon: Calculator },
  { value: "ipal", label: "IPAL Dapur", icon: Droplets },
  { value: "peralatan", label: "Peralatan Dapur", icon: ChefHat },
  { value: "layout", label: "Layouting Dapur", icon: LayoutTemplate },
  { value: "logistik", label: "Rantai Pasok", icon: Truck },
]

const STATUS_OPTIONS = [
  { value: "pending", label: "Belum Diproses" },
  { value: "processed", label: "Diproses" },
  { value: "completed", label: "Selesai" },
  { value: "not_found", label: "Tidak Ditemukan" },
]

// --- LOGIKA STYLE SESUAI REQUEST ---
const getStatusStyle = (status: string) => {
  // 1. Definisi Style Variant (Sesuai Design System Anda)
  const variantStyles: Record<string, string> = {
    orange: "bg-orange-20 text-orange-100 border-orange-30",
    green: "bg-green-20 text-green-100 border-green-30",
    red: "bg-red-20 text-red-100 border-red-30",
    yellow: "bg-yellow-50 text-general-80 border-yellow-100", 
    blue: "bg-blue-20 text-blue-100 border-blue-30",
    gray: "bg-general-30 text-general-70 border-general-40",
  }

  // 2. Mapping Status API -> Variant Warna
  let variant = "gray"
  switch (status) {
    case "pending": variant = "orange"; break;
    case "processed": variant = "blue"; break;
    case "completed": variant = "green"; break;
    case "not_found": variant = "red"; break;
    default: variant = "gray";
  }

  // 3. Return Class String
  return variantStyles[variant]
}

const getCategoryInfo = (val: string) => CATEGORY_OPTIONS.find(o => o.value === val) || { label: val, icon: Utensils }

function PermintaanKebutuhanDapurPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  
  // State Modal Detail
  const [detailRequest, setDetailRequest] = useState<typeof mockRequests[0] | null>(null)

  // Fetch Data (Simulasi)
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["admin", "permintaan-kebutuhan"],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 500))
      return mockRequests
    },
  })

  // Filter Logic
  const requests = (requestsData || []).filter((item) => {
    const matchSearch = 
      item.sppgName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = !filterCategory || item.category === filterCategory
    const matchStatus = !filterStatus || item.status === filterStatus
    return matchSearch && matchCategory && matchStatus
  })

  return (
    <DashboardAnggotaLayout>
      <div className="p-4 md:p-8 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="h4 text-general-100 font-heading">Permintaan Kebutuhan Dapur</h1>
            <p className="body-sm text-general-60 mt-2 max-w-2xl">
              Daftar permintaan bantuan operasional yang masuk dari pengguna (SPPG/Anggota).
            </p>
          </div>
          
          <div className="hidden md:block">
             <div className="px-4 py-2 bg-blue-20 text-blue-100 rounded-lg text-xs font-bold border border-blue-30 flex items-center gap-2">
                <Inbox className="w-4 h-4" />
                Masuk: {requests.length}
             </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-general-20 border border-general-30 rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Search */}
            <div className="md:col-span-12 lg:col-span-4">
              <label className="block body-xs font-semibold text-general-80 mb-2 uppercase tracking-wide">Pencarian</label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Cari ID, SPPG, atau Nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-general-20 border border-general-30 rounded-lg focus:outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-100/10 transition-all body-sm text-general-100 placeholder:text-general-50"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-general-50 group-focus-within:text-blue-100 transition-colors" />
              </div>
            </div>

            {/* Category Filter */}
            <div className="md:col-span-6 lg:col-span-4">
              <label className="block body-xs font-semibold text-general-80 mb-2 uppercase tracking-wide">Filter Kategori</label>
              <div className="relative group">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-general-20 border border-general-30 rounded-lg focus:outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-100/10 transition-all body-sm text-general-100 appearance-none cursor-pointer"
                >
                  <option value="">Semua Kategori</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-general-50 group-focus-within:text-blue-100 pointer-events-none transition-colors" />
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-6 lg:col-span-4">
              <label className="block body-xs font-semibold text-general-80 mb-2 uppercase tracking-wide">Filter Status</label>
              <div className="relative group">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-general-20 border border-general-30 rounded-lg focus:outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-100/10 transition-all body-sm text-general-100 appearance-none cursor-pointer"
                >
                  <option value="">Semua Status</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-general-50 group-focus-within:text-blue-100 pointer-events-none transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-general-20 border border-general-30 rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-100" />
              <p className="body-sm text-general-60 animate-pulse">Memuat data permintaan...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-20 h-20 bg-general-30/30 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-10 h-10 text-general-50" />
              </div>
              <h3 className="h5 text-general-80 mb-1">Tidak ada permintaan ditemukan</h3>
              <p className="body-sm text-general-60 max-w-sm">
                Belum ada permintaan yang masuk atau filter Anda terlalu spesifik.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-general-20 border-b border-general-30 text-general-100 body-sm font-heading font-semibold">
                    <th className="p-4 w-12 text-center border-r border-general-30">No</th>
                    <th className="p-4 min-w-[200px] border-r border-general-30">SPPG / Instansi</th>
                    <th className="p-4 min-w-[150px] border-r border-general-30">Kategori</th>
                    <th className="p-4 min-w-[180px] border-r border-general-30">Kontak</th>
                    <th className="p-4 w-40 text-center border-r border-general-30">Status</th>
                    <th className="p-4 w-24 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, idx) => {
                    const catInfo = getCategoryInfo(req.category)
                    const statusClass = getStatusStyle(req.status) // Panggil fungsi helper
                    const StatusLabel = STATUS_OPTIONS.find(s => s.value === req.status)?.label || req.status

                    return (
                      <tr key={req.id} className="border-b border-general-30 hover:bg-general-30/20 transition-colors group">
                        <td className="p-4 text-center body-sm text-general-60 border-r border-general-30 group-hover:text-general-80">
                          {idx + 1}
                        </td>

                        <td className="p-4 border-r border-general-30">
                          <div className="flex flex-col">
                            <span className="font-bold text-general-100 body-sm mb-0.5">{req.sppgName}</span>
                            <div className="flex items-center gap-1.5 text-general-60 text-xs">
                                {new Date(req.createdAt).toLocaleDateString("id-ID")}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 align-middle border-r border-general-30">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-general-20 text-general-80 border-general-30 shadow-sm">
                            <span className="text-md font-semibold whitespace-nowrap">
                              {catInfo.label}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 border-r border-general-30">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-general-90 text-md font-bold">
                                <User className="w-3.5 h-3.5 text-general-50" />
                                {req.contactPerson}
                            </div>
                            <div className="flex items-center gap-1.5 text-general-60 text-md">
                                <Phone className="w-3.5 h-3.5 text-general-50" />
                                {req.phone}
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-center align-middle border-r border-general-30">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border tracking-wide whitespace-nowrap ${statusClass}`}>
                            {StatusLabel}
                          </span>
                        </td>

                        <td className="p-4 align-middle text-center">
                          <div className="flex justify-center">
                            <button
                              onClick={() => setDetailRequest(req)}
                              className="text-blue-100 font-bold text-xs bg-blue-20 hover:bg-blue-30 px-3 py-1.5 rounded-lg transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Detail
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail & Update */}
      {detailRequest && (
        <RequestDetailModal
          request={detailRequest}
          onClose={() => setDetailRequest(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ["admin", "permintaan-kebutuhan"] })
            setDetailRequest(null)
          }}
        />
      )}

    </DashboardAnggotaLayout>
  )
}

// --- MODAL DETAIL (ADMIN VIEW) ---
function RequestDetailModal({
  request,
  onClose,
  onUpdate
}: {
  request: typeof mockRequests[0]
  onClose: () => void
  onUpdate: () => void
}) {
  const [status, setStatus] = useState(request.status)
  const [isSaving, setIsSaving] = useState(false)
  const catInfo = getCategoryInfo(request.category)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setIsSaving(false)
    onUpdate()
  }

  const hasChanges = status !== request.status

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-general-100/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-general-20 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-general-30 max-h-[90vh] flex flex-col relative">
        
        {/* Dekorasi Modal */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-general-30 flex items-center justify-between bg-general-20 shrink-0 relative z-10">
          <div>
            <h3 className="h5 text-general-100 font-heading">Detail Permintaan</h3>
          </div>
          <button onClick={onClose} className="p-2 text-general-50 hover:text-general-100 hover:bg-general-30 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-6 space-y-6 relative z-10">

          {/* Info Pemohon */}
          <div className="bg-general-20 border border-general-30 rounded-xl p-5 shadow-sm">
            <h4 className="body-sm font-bold text-general-100 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-100" />
              Informasi Pemohon
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-general-60 mb-1 uppercase tracking-wide">SPPG / Instansi</label>
                <p className="body-sm font-bold text-general-100">{request.sppgName}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-general-60 mb-1 uppercase tracking-wide">Contact Person</label>
                <p className="body-sm font-medium text-general-100">{request.contactPerson}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-general-60 mb-1 uppercase tracking-wide">Jabatan</label>
                <p className="body-sm font-medium text-general-100">{request.position}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-general-60 mb-1 uppercase tracking-wide">Nomor Telepon</label>
                <p className="body-sm font-medium text-general-100">{request.phone}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-general-60 mb-1 uppercase tracking-wide">Tanggal Masuk</label>
                <p className="body-sm font-medium text-general-100">
                    {new Date(request.createdAt).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Detail Kebutuhan */}
          <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-5 shadow-sm">
            <h4 className="body-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
              <catInfo.icon className="w-4 h-4 text-blue-600" />
              Kategori: {catInfo.label}
            </h4>
            
            <div>
               <label className="block text-xs font-bold text-blue-700/70 mb-2 uppercase tracking-wide">Deskripsi Permintaan</label>
               <div className="body-sm text-general-100 bg-white p-4 rounded-lg border border-blue-100/20 leading-relaxed min-h-[80px]">
                 "{request.details}"
               </div>
            </div>
          </div>

          {/* Panel Status Admin */}
          <div className="bg-white border border-blue-100 shadow-md shadow-blue-100/10 rounded-xl p-6">
            <h4 className="body-sm font-bold text-general-100 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-100" /> Tindak Lanjut Admin
            </h4>
            <div>
              <label className="block text-xs font-bold text-general-60 mb-2 uppercase tracking-wide">Update Status Permintaan</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg appearance-none cursor-pointer pr-10 body-sm focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 text-general-100 font-medium transition-all"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-general-60 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-general-30 bg-general-20 flex justify-end gap-3 shrink-0 relative z-10">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-general-30 text-general-80 font-bold rounded-xl hover:bg-general-30 transition-colors body-sm"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="px-6 py-2.5 bg-blue-100 text-general-20 font-bold rounded-xl hover:bg-blue-90 shadow-lg hover:shadow-blue-100/20 transition-all body-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:scale-[0.98]"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan Perubahan
            </button>
        </div>
      </div>
    </div>
  )
}