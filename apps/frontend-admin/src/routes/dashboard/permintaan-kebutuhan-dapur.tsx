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
  Phone,
  User,
  Save,
  X,
  Inbox,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"
import { useState, useRef, useEffect, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminService, type KitchenRequest } from "@/services/admin"

export const Route = createFileRoute("/dashboard/permintaan-kebutuhan-dapur")({
  component: PermintaanKebutuhanDapurPage,
})

const STATUS_OPTIONS = [
  { value: "pending", label: "Belum Diproses" },
  { value: "processed", label: "Diproses" },
  { value: "completed", label: "Selesai" },
  { value: "not_found", label: "Tidak Ditemukan" },
]

// --- LOGIKA STYLE ---
const getStatusStyle = (status: string) => {
  const variantStyles: Record<string, string> = {
    orange: "bg-orange-20 text-orange-100 border-orange-30",
    green: "bg-green-20 text-green-100 border-green-30",
    red: "bg-red-20 text-red-100 border-red-30",
    blue: "bg-blue-20 text-blue-100 border-blue-30",
    gray: "bg-general-30 text-general-70 border-general-40",
  }

  let variant = "gray"
  switch (status) {
    case "pending": variant = "orange"; break;
    case "processed": variant = "blue"; break;
    case "completed": variant = "green"; break;
    case "not_found": variant = "red"; break;
    default: variant = "gray";
  }

  return variantStyles[variant]
}

// --- KOMPONEN CUSTOM SELECT ---
interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  disabled?: boolean
  loading?: boolean
  placeholder?: string
}

function CustomSelect({ label, value, options, onChange, disabled, loading, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder || "Pilih Opsi"

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-bold text-general-80 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 text-left bg-white border rounded-lg text-sm font-medium 
          flex items-center justify-between transition-all duration-200
          ${isOpen ? 'border-blue-100 ring-2 ring-blue-100/20' : 'border-general-30 hover:border-blue-100'}
          ${disabled ? 'bg-general-20 text-general-60 cursor-not-allowed' : 'text-general-100 cursor-pointer'}
        `}
      >
        <span className="truncate block mr-2">
          {loading ? "Memuat..." : selectedLabel}
        </span>
        <div className="text-general-60 shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-general-30 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 left-0 right-0">
          <div className="max-h-[150px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-general-30 scrollbar-track-transparent">
            {options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={`
                    w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between
                    ${isSelected ? 'bg-blue-100/10 text-blue-100 font-bold' : 'text-general-80 hover:bg-general-20'}
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function PermintaanKebutuhanDapurPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  
  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [detailRequest, setDetailRequest] = useState<KitchenRequest | null>(null)

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["admin", "permintaan-kebutuhan", filterStatus],
    queryFn: () => adminService.kitchen.getRequests({ status: filterStatus || undefined }),
  })

  // Filter Logic
  const allRequests = (requestsData?.data || []).filter((item) => {
    const matchSearch =
      item.sppgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

  // --- LOGIKA PAGINATION SLICING ---
  const totalPages = Math.ceil(allRequests.length / itemsPerPage)
  
  const currentRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return allRequests.slice(start, start + itemsPerPage)
  }, [currentPage, allRequests])

  // Reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus])

  // --- LOGIKA SMART PAGINATION (1 2 ... Last) ---
  const paginationItems = useMemo(() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items: (number | string)[] = [1];
    if (totalPages > 1) items.push(2);
    
    // Logic gap
    if (currentPage > 2 && currentPage < totalPages) {
      if (currentPage > 3) items.push("...");
      items.push(currentPage);
      if (currentPage < totalPages - 1) items.push("...");
    } else {
      items.push("...");
    }

    if (totalPages > 2) items.push(totalPages);
    
    // Sort & Unique (Simple approach: rebuild cleanly)
    // Versi lebih bersih yang pasti urut:
    const pages = new Set([1, 2, totalPages]);
    if (currentPage > 2 && currentPage < totalPages) pages.add(currentPage);
    
    const sorted = Array.from(pages).sort((a, b) => a - b);
    const final: (number | string)[] = [];
    
    for (let i = 0; i < sorted.length; i++) {
        const page = sorted[i];
        if (i > 0) {
            if (page - sorted[i-1] > 1) final.push("...");
        }
        final.push(page);
    }
    return final;
  }, [currentPage, totalPages]);

  // Handlers
  const goToFirst = () => setCurrentPage(1)
  const goToLast = () => setCurrentPage(totalPages)
  const goToPrev = () => setCurrentPage(p => Math.max(1, p - 1))
  const goToNext = () => setCurrentPage(p => Math.min(totalPages, p + 1))
  const goToPage = (page: number) => setCurrentPage(page)

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
                Masuk: {allRequests.length}
             </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-general-20 border border-general-30 rounded-xl p-5 shadow-sm overflow-visible relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
            {/* Search */}
            <div className="md:col-span-6 lg:col-span-6">
              <label className="block text-xs font-bold text-general-80 mb-1.5 uppercase tracking-wide">Pencarian</label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Cari ID, SPPG, atau Nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-general-30 rounded-lg focus:outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-100/10 transition-all body-sm text-general-100 placeholder:text-general-50"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-general-50 group-focus-within:text-blue-100 transition-colors" />
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-6 lg:col-span-6 relative z-20">
              <CustomSelect 
                label="Filter Status"
                value={filterStatus}
                options={STATUS_OPTIONS}
                onChange={setFilterStatus}
                placeholder="Semua Status"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-general-20 border border-general-30 rounded-xl overflow-hidden shadow-sm relative z-0 flex flex-col">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-100" />
              <p className="body-sm text-general-60 animate-pulse">Memuat data permintaan...</p>
            </div>
          ) : allRequests.length === 0 ? (
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
                  {currentRequests.map((req, idx) => {
                    const statusClass = getStatusStyle(req.status)
                    const StatusLabel = STATUS_OPTIONS.find(s => s.value === req.status)?.label || req.status
                    // Hitung nomor urut berdasarkan page
                    const itemNumber = (currentPage - 1) * itemsPerPage + idx + 1

                    return (
                      <tr key={req.id} className="border-b border-general-30 hover:bg-general-30/20 transition-colors group">
                        <td className="p-4 text-center body-sm text-general-60 border-r border-general-30 group-hover:text-general-80">
                          {itemNumber}
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
                              {req.category}
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
                                {req.phoneNumber}
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

          {/* --- PAGINATION CONTROLS --- */}
          {totalPages > 1 && (
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-general-30 text-general-60 body-sm bg-white mt-auto">
              <span className="text-xs sm:text-sm text-center sm:text-left">
                Menampilkan <span className="font-medium text-general-100">
                  {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, allRequests.length)}
                </span> dari {allRequests.length} data
              </span>
              
              <div className="flex items-center gap-1">
                
                {/* First Page (<<) : HIDDEN ON MOBILE */}
                <button 
                  onClick={goToFirst} 
                  disabled={currentPage === 1}
                  className="hidden sm:flex w-8 h-8 items-center justify-center rounded hover:bg-general-30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-general-80"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Prev Page (<) */}
                <button 
                  onClick={goToPrev} 
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-general-30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-general-80"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers Mapping */}
                <div className="flex gap-1 mx-2">
                  {paginationItems.map((item, idx) => {
                    if (item === "...") {
                      return (
                        <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-general-60 font-medium">
                          ...
                        </span>
                      )
                    }

                    const pageNum = item as number
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`
                          w-8 h-8 flex items-center justify-center rounded transition-colors body-sm font-medium
                          ${currentPage === pageNum 
                            ? 'bg-blue-100 text-white font-bold shadow-sm' 
                            : 'hover:bg-general-30 text-general-80'}
                        `}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                {/* Next Page (>) */}
                <button 
                  onClick={goToNext} 
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-general-30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-general-80"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page (>>) : HIDDEN ON MOBILE */}
                <button 
                  onClick={goToLast} 
                  disabled={currentPage === totalPages}
                  className="hidden sm:flex w-8 h-8 items-center justify-center rounded hover:bg-general-30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-general-80"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>

              </div>
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

// Modal detail for admin view
function RequestDetailModal({
  request,
  onClose,
  onUpdate
}: {
  request: KitchenRequest
  onClose: () => void
  onUpdate: () => void
}) {
  const [status, setStatus] = useState(request.status)
  const [isSaving, setIsSaving] = useState(false)

  const updateMutation = useMutation({
    mutationFn: (data: { status: string }) => adminService.kitchen.updateRequestStatus(request.id, data),
    onSuccess: () => {
      setIsSaving(false)
      onUpdate()
    },
    onError: () => {
      setIsSaving(false)
    }
  })

  const handleSave = async () => {
    setIsSaving(true)
    updateMutation.mutate({ status })
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
                <p className="body-sm font-medium text-general-100">{request.phoneNumber}</p>
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
              <Utensils className="w-4 h-4 text-blue-600" />
              Kategori: {request.category}
            </h4>

            <div>
               <label className="block text-xs font-bold text-blue-700/70 mb-2 uppercase tracking-wide">Deskripsi Permintaan</label>
               <div className="body-sm text-general-100 bg-white p-4 rounded-lg border border-blue-100/20 leading-relaxed min-h-[80px]">
                 "{request.details}"
               </div>
            </div>
          </div>

          {/* Panel Status Admin - Overflow Visible untuk Dropdown */}
          <div className="bg-white border border-blue-100 shadow-md shadow-blue-100/10 rounded-xl p-6 relative overflow-visible z-20">
            <h4 className="body-sm font-bold text-general-100 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-100" /> Tindak Lanjut Admin
            </h4>
            <div className="relative z-50">
              <CustomSelect 
                label="Update Status Permintaan"
                value={status}
                options={STATUS_OPTIONS}
                onChange={setStatus}
              />
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