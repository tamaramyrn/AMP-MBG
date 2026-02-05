import { createFileRoute } from "@tanstack/react-router"
import { DashboardAnggotaLayout } from "@/components/dashboard/dashboard-admin-layout"
import {
  Search,
  Loader2,
  Users,
  Mail,
  Plus,
  X,
  Trash2,
  Eye,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Phone,
  Building2,
  User,
  FileText,
  Save,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"
import { useState, useMemo, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { memberService, type Member, type CreateMemberData } from "@/services/members"

export const Route = createFileRoute("/dashboard/akun-anggota/")({
  component: AkunAnggotaPage,
})

const MEMBER_TYPE_OPTIONS = [
  { value: "supplier", label: "Supplier/Vendor" },
  { value: "caterer", label: "Katering" },
  { value: "school", label: "Pihak Sekolah" },
  { value: "government", label: "Pemerintah Daerah" },
  { value: "foundation", label: "Yayasan" },
  { value: "ngo", label: "LSM/NGO" },
  { value: "farmer", label: "Petani" },
  { value: "other", label: "Lainnya" },
]

const STATUS_OPTIONS = [
  { value: "verified", label: "Terverifikasi" },
  { value: "pending", label: "Pending" },
]

const getStatusInfo = (isVerified: boolean) => {
  if (!isVerified) return { key: "pending", label: "Pending", style: "bg-orange-20 text-orange-100 border-orange-30" }
  return { key: "verified", label: "Terverifikasi", style: "bg-green-20 text-green-100 border-green-30" }
}

const getMemberTypeLabel = (type: string | null) => {
  const found = MEMBER_TYPE_OPTIONS.find(opt => opt.value === type)
  return found?.label || type || "-"
}

// --- KOMPONEN CUSTOM SELECT ---
interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  label?: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  isError?: boolean
}

function CustomSelect({ label, value, options, onChange, disabled, loading, placeholder, isError }: CustomSelectProps) {
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
      {label && (
        <label className="block body-sm font-semibold text-general-80 mb-2">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2.5 text-left bg-general-20 border rounded-lg text-sm font-medium 
          flex items-center justify-between transition-all duration-200
          ${isError 
            ? 'border-red-100 focus:ring-red-100/10' 
            : isOpen 
              ? 'border-blue-100 ring-4 ring-blue-100/10' 
              : 'border-general-30 hover:border-blue-100'}
          ${disabled ? 'opacity-70 cursor-not-allowed' : 'text-general-100 cursor-pointer'}
        `}
      >
        <span className={`truncate block mr-2 ${!value && !placeholder ? 'text-general-50' : ''}`}>
          {loading ? "Memuat..." : selectedLabel}
        </span>
        <div className="text-general-60 shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-general-30 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 left-0 right-0">
          <div className="max-h-[200px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-general-30 scrollbar-track-transparent">
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

function AkunAnggotaPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // State Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [detailMember, setDetailMember] = useState<Member | null>(null)

  const { data: membersData, isLoading } = useQuery({
    queryKey: ["admin", "members"],
    queryFn: () => memberService.getMembers({ status: "all" }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => memberService.deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] })
      setDeleteId(null)
      // Mundur halaman jika item terakhir dihapus
      if (currentMembers.length === 1 && currentPage > 1) {
        setCurrentPage(p => p - 1)
      }
    },
    onError: (err) => {
      alert("Gagal menghapus: " + err.message)
    }
  })

  // LOGIKA UTAMA: Filter & Sorting
  const allMembers: Member[] = useMemo(() => {
    if (!membersData?.data) return []

    // 1. Filter
    const filtered = membersData.data.filter((m: Member) => {
      const orgName = m.organizationInfo?.name?.toLowerCase() || ""
      const orgEmail = m.organizationInfo?.email?.toLowerCase() || ""
      const matchSearch =
        orgName.includes(searchTerm.toLowerCase()) ||
        orgEmail.includes(searchTerm.toLowerCase()) ||
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchRole = !filterRole || m.memberType === filterRole
      const statusInfo = getStatusInfo(m.isVerified)
      const matchStatus = !filterStatus || statusInfo.key === filterStatus
      
      return matchSearch && matchRole && matchStatus
    })

    // 2. Sort A-Z
    return filtered.sort((a, b) => {
      const nameA = (a.organizationInfo?.name || a.name).toLowerCase()
      const nameB = (b.organizationInfo?.name || b.name).toLowerCase()
      return nameA.localeCompare(nameB)
    })

  }, [membersData, searchTerm, filterRole, filterStatus])

  // --- LOGIKA PAGINATION SLICING ---
  const totalPages = Math.ceil(allMembers.length / itemsPerPage) || 1
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentMembers = allMembers.slice(indexOfFirstItem, indexOfLastItem)

  // Reset page saat filter berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterRole, filterStatus])

  // --- LOGIKA SMART PAGINATION (1 2 ... Last) ---
  const paginationItems = useMemo(() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const pages = new Set([1, 2, totalPages]);
    
    if (currentPage > 2 && currentPage < totalPages) {
      pages.add(currentPage);
    }

    const sortedPages = Array.from(pages).sort((a, b) => a - b);
    const finalItems: (number | string)[] = [];

    for (let i = 0; i < sortedPages.length; i++) {
      const page = sortedPages[i];
      if (i > 0) {
        if (page - sortedPages[i - 1] > 1) {
          finalItems.push("...");
        }
      }
      finalItems.push(page);
    }

    return finalItems;
  }, [currentPage, totalPages]);

  // Handlers
  const confirmDelete = () => { if (deleteId) deleteMutation.mutate(deleteId) }
  const goToFirst = () => setCurrentPage(1)
  const goToLast = () => setCurrentPage(totalPages)
  const goToPrev = () => setCurrentPage(p => Math.max(1, p - 1))
  const goToNext = () => setCurrentPage(p => Math.min(totalPages, p + 1))
  const goToPage = (p: number) => setCurrentPage(p)

  return (
    <DashboardAnggotaLayout>
      <div className="p-4 md:p-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="h4 text-general-100 font-heading">Manajemen Akun Anggota</h1>
            <p className="body-sm text-general-60 mt-2 max-w-2xl">
              Kelola daftar anggota program MBG (Supplier, Katering, Sekolah, dll). Pantau status verifikasi dan keaktifan akun.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-100 hover:bg-blue-90 text-general-20 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 body-sm font-medium"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Tambah Anggota</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-general-20 border border-general-30 rounded-xl p-5 shadow-sm overflow-visible relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
            {/* Search */}
            <div className="md:col-span-12 lg:col-span-4 relative z-0">
              <label className="block body-xs font-semibold text-general-80 mb-2 uppercase tracking-wide">Pencarian</label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Cari nama organisasi atau pemohon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-general-20 border border-general-30 rounded-lg focus:outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-100/10 transition-all body-sm text-general-100 placeholder:text-general-50"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-general-50 group-focus-within:text-blue-100 transition-colors" />
              </div>
            </div>

            {/* Type Filter */}
            <div className="md:col-span-6 lg:col-span-4 relative z-20">
              <label className="block body-xs font-semibold text-general-80 mb-2 uppercase tracking-wide">Filter Jenis</label>
              <CustomSelect
                value={filterRole}
                options={[{ value: "", label: "Semua Jenis" }, ...MEMBER_TYPE_OPTIONS]}
                onChange={setFilterRole}
                placeholder="Semua Jenis"
              />
            </div>

            {/* Status Filter */}
            <div className="md:col-span-6 lg:col-span-4 relative z-10">
              <label className="block body-xs font-semibold text-general-80 mb-2 uppercase tracking-wide">Filter Status</label>
              <CustomSelect
                value={filterStatus}
                options={[{ value: "", label: "Semua Status" }, ...STATUS_OPTIONS]}
                onChange={setFilterStatus}
                placeholder="Semua Status"
              />
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-general-20 border border-general-30 rounded-xl overflow-hidden shadow-sm relative z-0 flex flex-col">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-100" />
              <p className="body-sm text-general-60 animate-pulse">Memuat data anggota...</p>
            </div>
          ) : allMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-20 h-20 bg-general-30/30 rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-general-50" />
              </div>
              <h3 className="h5 text-general-80 mb-1">Tidak ada data ditemukan</h3>
              <p className="body-sm text-general-60 max-w-sm">
                Belum ada akun anggota yang terdaftar atau hasil pencarian tidak ditemukan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-general-20 border-b border-general-30 text-general-100 body-sm font-heading font-semibold">
                    <th className="p-4 w-12 text-center border-r border-general-30">No</th>
                    <th className="p-4 min-w-[200px] border-r border-general-30">Organisasi/Komunitas</th>
                    <th className="p-4 min-w-[120px] border-r border-general-30">Jenis</th>
                    <th className="p-4 min-w-[180px] border-r border-general-30">Surel</th>
                    <th className="p-4 min-w-[140px] border-r border-general-30">Nomor Telepon</th>
                    <th className="p-4 w-32 text-center border-r border-general-30">Status</th>
                    <th className="p-4 w-24 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMembers.map((member, idx) => {
                    const statusInfo = getStatusInfo(member.isVerified)
                    const orgName = member.organizationInfo?.name || member.name
                    const orgEmail = member.organizationInfo?.email || member.email
                    const orgPhone = member.organizationInfo?.phone || member.phone
                    const itemNumber = (currentPage - 1) * itemsPerPage + idx + 1

                    return (
                      <tr key={member.id} className="border-b border-general-30 hover:bg-general-30/20 transition-colors group">
                        <td className="p-4 text-center body-sm text-general-60 border-r border-general-30 group-hover:text-general-80">
                          {itemNumber}
                        </td>

                        <td className="p-4 border-r border-general-30">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-general-100 body-sm">{orgName}</span>
                          </div>
                        </td>

                        <td className="p-4 align-middle border-r border-general-30">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-blue-20 text-blue-100 border-blue-30">
                            <span className="text-xs font-semibold whitespace-nowrap">
                              {getMemberTypeLabel(member.memberType)}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 border-r border-general-30">
                          <div className="flex items-center gap-1.5 text-general-80 text-sm">
                            <Mail className="w-3.5 h-3.5 text-general-50" />
                            <span className="truncate max-w-[160px]">{orgEmail}</span>
                          </div>
                        </td>

                        <td className="p-4 border-r border-general-30">
                          <div className="flex items-center gap-1.5 text-general-80 text-sm">
                            <Phone className="w-3.5 h-3.5 text-general-50" />
                            <span>{orgPhone}</span>
                          </div>
                        </td>

                        <td className="p-4 text-center align-middle border-r border-general-30">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${statusInfo.style}`}>
                            {statusInfo.label}
                          </span>
                        </td>

                        <td className="p-4 align-middle text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setDetailMember(member)}
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
          {allMembers.length > 0 && (
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-general-30 text-general-60 body-sm bg-general-20 mt-auto">
              <span className="text-xs sm:text-sm text-center sm:text-left">
                Menampilkan <span className="font-medium text-general-100">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, allMembers.length)}</span> dari {allMembers.length} data
              </span>
              
              <div className="flex items-center gap-1 select-none">
                
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
                            ? 'bg-blue-100 text-general-20 font-bold shadow-sm' 
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

      {/* --- MODAL ADD --- */}
      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            queryClient.invalidateQueries({ queryKey: ["admin", "members"] })
          }}
        />
      )}

      {/* --- MODAL DELETE CONFIRM --- */}
      {deleteId && (
        <DeleteConfirmModal
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* --- MODAL DETAIL --- */}
      {detailMember && (
        <MemberDetailModal
          member={detailMember}
          onClose={() => setDetailMember(null)}
          onDelete={() => {
            setDetailMember(null)
            setDeleteId(detailMember.id)
          }}
          onStatusUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ["admin", "members"] })
          }}
        />
      )}
    </DashboardAnggotaLayout>
  )
}


// --- MODAL DETAIL ANGGOTA ---
function MemberDetailModal({
  member,
  onClose,
  onDelete,
  onStatusUpdate
}: {
  member: Member
  onClose: () => void
  onDelete: () => void
  onStatusUpdate: () => void
}) {
  const [newStatus, setNewStatus] = useState<string>(
    member.isVerified ? "verified" : "pending"
  )
  const [showSuccess, setShowSuccess] = useState(false)

  const statusMutation = useMutation({
    mutationFn: (data: { isVerified?: boolean }) =>
      memberService.updateMemberStatus(member.id, data),
    onSuccess: () => {
      setShowSuccess(true)
      onStatusUpdate()
    },
    onError: (err) => {
      alert("Gagal memperbarui status: " + err.message)
    }
  })

  const handleSaveStatus = () => {
    if (newStatus === "verified") {
      statusMutation.mutate({ isVerified: true })
    } else {
      statusMutation.mutate({ isVerified: false })
    }
  }

  const orgInfo = member.organizationInfo
  const currentStatus = member.isVerified ? "verified" : "pending"
  const hasChanges = newStatus !== currentStatus

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-general-100/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-general-20 rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-300 border border-general-30">
          <div className="w-16 h-16 bg-green-20 text-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="h5 text-general-100 mb-2">Berhasil!</h3>
          <p className="body-sm text-general-60 mb-6">Status anggota berhasil diperbarui.</p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-100 text-general-20 font-semibold rounded-xl hover:bg-blue-90 transition-colors body-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-general-100/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-general-20 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-general-30 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-general-30 flex items-center justify-between bg-general-20 shrink-0">
          <div>
            <h3 className="h5 text-general-100 font-heading">Detail Anggota</h3>
            <p className="body-xs text-general-60 mt-0.5">Lihat informasi lengkap dan kelola status anggota.</p>
          </div>
          <button onClick={onClose} className="p-2 text-general-50 hover:text-general-100 hover:bg-general-30 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-6 space-y-6">

          {/* Informasi Pemohon */}
          <div className="bg-general-30/30 rounded-xl p-5 border border-general-30">
            <h4 className="body-sm font-bold text-general-100 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-100" />
              Informasi Pemohon
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-general-60 mb-1">Nama Lengkap</label>
                <p className="body-sm font-medium text-general-100">{member.name}</p>
              </div>
              <div>
                <label className="block text-xs text-general-60 mb-1">Email</label>
                <p className="body-sm font-medium text-general-100">{member.email}</p>
              </div>
              <div>
                <label className="block text-xs text-general-60 mb-1">Nomor Telepon</label>
                <p className="body-sm font-medium text-general-100">{member.phone}</p>
              </div>
            </div>
          </div>

          {/* Informasi Organisasi */}
          <div className="bg-blue-20/30 rounded-xl p-5 border border-blue-30">
            <h4 className="body-sm font-bold text-general-100 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-100" />
              Informasi Organisasi/Komunitas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs text-general-60 mb-1">Nama Organisasi</label>
                <p className="body-sm font-bold text-general-100">{orgInfo?.name || member.name}</p>
              </div>
              <div>
                <label className="block text-xs text-general-60 mb-1">Jenis</label>
                <span className="inline-flex items-center px-3 py-1 rounded-full border bg-blue-20 text-blue-100 border-blue-30 text-xs font-semibold">
                  {getMemberTypeLabel(member.memberType)}
                </span>
              </div>
              <div>
                <label className="block text-xs text-general-60 mb-1">Email Organisasi</label>
                <p className="body-sm font-medium text-general-100">{orgInfo?.email || member.email}</p>
              </div>
              <div>
                <label className="block text-xs text-general-60 mb-1">Telepon Organisasi</label>
                <p className="body-sm font-medium text-general-100">{orgInfo?.phone || member.phone}</p>
              </div>
            </div>
          </div>

          {/* Peran di Organisasi */}
          <div className="bg-general-30/30 rounded-xl p-5 border border-general-30">
            <h4 className="body-sm font-bold text-general-100 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-100" />
              Deskripsi Peran
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-general-60 mb-1">Peran di Organisasi/Komunitas</label>
                <p className="body-sm text-general-80 bg-general-20 p-3 rounded-lg border border-general-30">
                  {orgInfo?.roleDescription || "Perwakilan Organisasi"}
                </p>
              </div>
              <div>
                <label className="block text-xs text-general-60 mb-1">Peran Organisasi dalam Program MBG</label>
                <p className="body-sm text-general-80 bg-general-20 p-3 rounded-lg border border-general-30">
                  {orgInfo?.mbgDescription || "Mitra Program MBG"}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-general-30/30 rounded-xl p-5 border border-general-30">
            <h4 className="body-sm font-bold text-general-100 mb-4">Informasi Waktu</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-general-60 mb-1">Tanggal Pengajuan Anggota</label>
                <p className="body-sm font-medium text-general-100">
                  {member.appliedAt ? new Date(member.appliedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : new Date(member.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div>
                <label className="block text-xs text-general-60 mb-1">Tanggal Verifikasi</label>
                <p className="body-sm font-medium text-general-100">
                  {member.verifiedAt ? new Date(member.verifiedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Belum diverifikasi"}
                </p>
              </div>
            </div>
          </div>

          {/* Panel Status Admin */}
          <div className="bg-general-30/30 rounded-xl p-5 border border-general-30 pb-20 md:pb-5">
            <h4 className="body-sm font-bold text-general-100 mb-4">Panel Verifikasi Admin</h4>
            <div className="relative z-50">
              <CustomSelect
                label="Status Anggota"
                value={newStatus}
                options={STATUS_OPTIONS}
                onChange={setNewStatus}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-general-30 bg-general-20 flex justify-between gap-3 shrink-0">
          <button
            onClick={onDelete}
            className="px-4 py-2.5 bg-red-20 text-red-100 hover:bg-red-30 border border-red-30 rounded-lg transition-colors body-sm font-medium flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Hapus
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-general-30 text-general-80 font-semibold rounded-lg hover:bg-general-30 transition-colors body-sm"
            >
              Batal
            </button>
            <button
              onClick={handleSaveStatus}
              disabled={!hasChanges || statusMutation.isPending}
              className="px-6 py-2.5 bg-blue-100 text-general-20 font-semibold rounded-lg hover:bg-blue-90 shadow-lg hover:shadow-blue-100/20 transition-all body-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {statusMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- MODAL KONFIRMASI HAPUS ---
function DeleteConfirmModal({ onClose, onConfirm, isLoading }: { onClose: () => void, onConfirm: () => void, isLoading: boolean }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-general-100/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-general-20 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-300 border border-general-30 text-center">
        <div className="w-16 h-16 bg-red-20 text-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-30 shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="h5 text-general-100 font-heading mb-2">Hapus Akun Anggota?</h3>
        <p className="body-sm text-general-60 mb-6">
          Tindakan ini tidak dapat dibatalkan. Data anggota ini akan dihapus secara permanen dari sistem.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 border border-general-30 text-general-80 font-semibold rounded-xl hover:bg-general-30 transition-colors body-sm"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-red-100 text-general-20 font-semibold rounded-xl hover:bg-red-90 shadow-lg hover:shadow-red-100/20 transition-all body-sm flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- MODAL TAMBAH ANGGOTA ---
function AddMemberModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState<CreateMemberData>({
    name: "",
    email: "",
    phone: "",
    memberType: "supplier"
  })
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: CreateMemberData) => memberService.createMember(data),
    onSuccess: () => {
      setIsSuccess(true)
      setErrorMsg(null)
    },
    onError: (error: Error) => {
      setErrorMsg(error.message || "Gagal membuat data anggota")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.phone) {
      setErrorMsg("Mohon lengkapi seluruh kolom formulir.")
      return
    }

    // Gabungkan +62 ke nomor telepon
    const finalData = {
      ...formData,
      phone: `+62${formData.phone}`
    }

    setErrorMsg(null)
    createMutation.mutate(finalData)
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-general-100/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-general-20 rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-300 border border-general-30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-green-100" />
          <div className="w-20 h-20 bg-green-20 text-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500 delay-100 shadow-sm border border-green-30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="h4 text-general-100 font-heading mb-2">Berhasil Ditambahkan!</h3>
          <p className="body-sm text-general-60 mb-8 leading-relaxed">
            Akun anggota untuk <strong>{formData.name}</strong> telah berhasil dibuat.
          </p>
          <button onClick={onSuccess} className="w-full py-3 bg-blue-100 text-general-20 font-semibold rounded-xl hover:bg-blue-90 shadow-lg transition-all body-sm active:scale-[0.98]">
            Selesai & Tutup
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-general-100/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-general-20 rounded-2xl shadow-2xl w-full max-w-lg overflow-visible animate-in zoom-in-95 duration-300 border border-general-30 flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-general-30 flex items-center justify-between bg-general-20 shrink-0 rounded-t-2xl">
          <div>
            <h3 className="h5 text-general-100 font-heading">Tambah Anggota Baru</h3>
            <p className="body-xs text-general-60 mt-0.5">Lengkapi data untuk membuat akun baru.</p>
          </div>
          <button onClick={onClose} className="p-2 text-general-50 hover:text-general-100 hover:bg-general-30 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-6 p-3 bg-red-20 border border-red-30 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2 shrink-0">
            <AlertCircle className="w-5 h-5 text-red-100 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="body-sm font-semibold text-red-100">Perhatian</p>
              <p className="text-xs text-red-80 mt-0.5">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-80 hover:text-red-100"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Form Body - Scrollable if needed, but container is overflow-visible for dropdowns */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">

              <div className="relative z-50">
                <CustomSelect
                  label="Jenis"
                  value={formData.memberType}
                  options={MEMBER_TYPE_OPTIONS}
                  onChange={(val) => setFormData({ ...formData, memberType: val as CreateMemberData["memberType"] })}
                  placeholder="Pilih Jenis"
                />
              </div>

              <div>
                <label className="block body-sm font-semibold text-general-80 mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-general-20 border border-general-30 rounded-lg focus:outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-100/10 transition-all body-sm text-general-100"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block body-sm font-semibold text-general-80 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-general-20 border border-general-30 rounded-lg focus:outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-100/10 transition-all body-sm text-general-100"
                    placeholder="email@example.com"
                  />
                </div>
                {/* NOMOR TELEPON DENGAN +62 */}
                <div>
                  <label className="block body-sm font-semibold text-general-80 mb-2">Nomor Telepon</label>
                  <div className="flex items-center gap-3 bg-general-20 border border-general-30 rounded-lg px-4 py-2.5 focus-within:border-blue-100 focus-within:ring-4 focus-within:ring-blue-100/10 transition-all">
                    <Phone className="w-4 h-4 text-general-50 shrink-0" />
                    <span className="text-general-60 body-sm font-medium border-r border-general-30 pr-3 mr-1">+62</span>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                      className="w-full outline-none text-general-100 placeholder:text-general-30 body-sm bg-transparent font-medium"
                      placeholder="8xxxxxxxx"
                      maxLength={13}
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="flex gap-3 pt-6 border-t border-general-30 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-general-30 text-general-80 font-semibold rounded-lg hover:bg-general-30 transition-colors body-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 py-2.5 bg-blue-100 text-general-20 font-semibold rounded-lg hover:bg-blue-90 shadow-lg hover:shadow-blue-100/20 transition-all body-sm disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  "Simpan Anggota"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}