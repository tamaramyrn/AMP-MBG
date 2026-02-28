import { createFileRoute } from "@tanstack/react-router"
import { DashboardAnggotaLayout } from "@/components/dashboard/dashboard-admin-layout"
import {
  Search,
  Loader2,
  UserCog,
  Mail,
  Plus,
  X,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"
import { useState, useMemo, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminAccountService, type Admin, type CreateAdminData } from "@/services/members"

export const Route = createFileRoute("/dashboard/akun-admin/")({
  component: AkunAdminPage,
})

const ADMIN_ROLE_OPTIONS = [
  { value: "Super Admin", label: "Super Admin" },
  { value: "Koordinator Nasional", label: "Koordinator Nasional" },
  { value: "Validator Laporan", label: "Validator Laporan" },
  { value: "Data Analyst", label: "Data Analyst" },
  { value: "Finance Manager", label: "Finance Manager" },
  { value: "Operations Manager", label: "Operations Manager" },
  { value: "HR Manager", label: "HR Manager" },
  { value: "IT Support", label: "IT Support" },
  { value: "Media Relations", label: "Media Relations" },
]

// Custom select component
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
      <label className="block body-sm font-semibold text-general-80 mb-2">
        {label}
      </label>
      
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
        <span className={`truncate block mr-2 ${!value ? 'text-general-50' : ''}`}>
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

function AkunAdminPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("")
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: adminsData, isLoading } = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: () => adminAccountService.getAdmins(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminAccountService.deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] })
      setDeleteId(null)
      // Adjust page on delete
      if (currentAdmins.length === 1 && currentPage > 1) {
        setCurrentPage(p => p - 1)
      }
    },
    onError: (err) => {
        alert("Gagal menghapus: " + err.message)
    }
  })

  // Filter and sort logic
  const allAdmins: Admin[] = useMemo(() => {
    if (!adminsData?.data) return []

    const filtered = adminsData.data.filter((a: Admin) => {
      const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchRole = !filterRole || a.adminRole === filterRole
      return matchSearch && matchRole
    })

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [adminsData, searchTerm, filterRole])

  // Pagination slicing
  const totalPages = Math.ceil(allAdmins.length / itemsPerPage) || 1
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentAdmins = allAdmins.slice(indexOfFirstItem, indexOfLastItem)

  const [prevSearch, setPrevSearch] = useState(searchTerm)
  const [prevRole, setPrevRole] = useState(filterRole)
  if (searchTerm !== prevSearch || filterRole !== prevRole) {
    setPrevSearch(searchTerm)
    setPrevRole(filterRole)
    setCurrentPage(1)
  }

  // Smart pagination logic
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
  const handleDeleteClick = (id: string) => setDeleteId(id)
  const confirmDelete = () => { if (deleteId) deleteMutation.mutate(deleteId) }
  const getRoleStyle = (_role: string) => "bg-blue-20 text-blue-100 border-blue-30"

  const goToFirst = () => setCurrentPage(1)
  const goToLast = () => setCurrentPage(totalPages)
  const goToPrev = () => setCurrentPage(p => Math.max(1, p - 1))
  const goToNext = () => setCurrentPage(p => Math.min(totalPages, p + 1))
  const goToPage = (p: number) => setCurrentPage(p)

  return (
    <DashboardAnggotaLayout>
      <div className="p-4 md:p-8 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="h4 text-general-100 font-heading">Manajemen Akun Admin</h1>
            <p className="body-sm text-general-60 mt-2 max-w-2xl">
              Kelola daftar administrator yang memiliki akses ke dashboard AMP MBG.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-100 hover:bg-blue-90 text-general-20 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 body-sm font-medium"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Tambah Admin</span>
          </button>
        </div>

        {/* Filters Section */}
        <div className="bg-general-20 border border-general-30 rounded-xl p-5 shadow-sm overflow-visible relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
            <div className="md:col-span-7 lg:col-span-8 relative z-0">
              <label className="block body-xs font-semibold text-general-80 mb-2 uppercase tracking-wide">Pencarian</label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Cari nama atau email admin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-general-20 border border-general-30 rounded-lg focus:outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-100/10 transition-all body-sm text-general-100 placeholder:text-general-50"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-general-50 group-focus-within:text-blue-100 transition-colors" />
              </div>
            </div>

            <div className="md:col-span-5 lg:col-span-4 relative z-20">
              <CustomSelect 
                label="Filter Peran"
                value={filterRole}
                options={[{ value: "", label: "Semua Divisi" }, ...ADMIN_ROLE_OPTIONS]}
                onChange={setFilterRole}
                placeholder="Semua Divisi"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-general-20 border border-general-30 rounded-xl overflow-hidden shadow-sm relative z-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-100" />
              <p className="body-sm text-general-60 animate-pulse">Memuat data admin...</p>
            </div>
          ) : allAdmins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-20 h-20 bg-general-30/30 rounded-full flex items-center justify-center mb-4">
                <UserCog className="w-10 h-10 text-general-50" />
              </div>
              <h3 className="h5 text-general-80 mb-1">Tidak ada data ditemukan</h3>
              <p className="body-sm text-general-60 max-w-sm">
                Belum ada akun admin yang terdaftar atau hasil pencarian tidak ditemukan.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-general-20 border-b border-general-30 text-general-100 body-sm font-heading font-semibold">
                      <th className="p-4 w-12 text-center border-r border-general-30">No</th>
                      <th className="p-4 min-w-[200px] border-r border-general-30">Informasi Admin</th>
                      <th className="p-4 min-w-[150px] border-r border-general-30">Peran / Divisi</th>
                      <th className="p-4 w-32 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAdmins.map((admin, idx) => (
                      <tr key={admin.id} className="border-b border-general-30 hover:bg-general-30/20 transition-colors group">
                        <td className="p-4 text-center body-sm text-general-60 border-r border-general-30 group-hover:text-general-80">
                          {indexOfFirstItem + idx + 1}
                        </td>

                        <td className="p-4 border-r border-general-30">
                          <div className="flex flex-col">
                            <span className="font-bold text-general-100 body-sm mb-0.5">{admin.name}</span>
                            <div className="flex items-center gap-1.5 text-general-60">
                              <Mail className="w-3.5 h-3.5" />
                              <span className="text-xs">{admin.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 align-middle border-r border-general-30">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${getRoleStyle(admin.adminRole || "admin")}`}>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold whitespace-nowrap">
                              {admin.adminRole || "Admin"}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 align-middle text-center">
                          <div className="flex justify-center">
                            {admin.adminRole !== "Super Admin" && (
                              <button
                                onClick={() => handleDeleteClick(admin.id)}
                                className="p-2 bg-red-20 text-red-100 hover:bg-red-30 border border-red-30 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                title="Hapus Akun Admin"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* --- PAGINATION CONTROLS --- */}
              {allAdmins.length > 0 && (
                <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-general-30 text-general-60 body-sm bg-general-20">
                  <span className="text-xs sm:text-sm text-center sm:text-left">
                    Menampilkan <span className="font-medium text-general-100">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, allAdmins.length)}</span> dari {allAdmins.length} data
                  </span>
                  
                  <div className="flex items-center gap-1 select-none">
                    
                    {/* First page, hidden mobile */}
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

                    {/* Page Numbers */}
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

                    {/* Last page, hidden mobile */}
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
            </>
          )}
        </div>
      </div>

      {/* Modal Tambah Admin */}
      {showAddModal && (
        <AddAdminModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            queryClient.invalidateQueries({ queryKey: ["admin", "admins"] })
          }}
        />
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteId && (
        <DeleteConfirmModal 
            onClose={() => setDeleteId(null)}
            onConfirm={confirmDelete}
            isLoading={deleteMutation.isPending}
        />
      )}
    </DashboardAnggotaLayout>
  )
}

// Delete confirmation modal
function DeleteConfirmModal({ onClose, onConfirm, isLoading }: { onClose: () => void, onConfirm: () => void, isLoading: boolean }) {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-general-100/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-general-20 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-300 border border-general-30 text-center">
                
                <div className="w-16 h-16 bg-red-20 text-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-30 shadow-inner">
                    <AlertTriangle className="w-8 h-8" />
                </div>

                <h3 className="h5 text-general-100 font-heading mb-2">Hapus Akun Admin?</h3>
                <p className="body-sm text-general-60 mb-6">
                    Tindakan ini tidak dapat dibatalkan. Akun ini akan kehilangan akses sepenuhnya ke dashboard.
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

// Add admin modal
function AddAdminModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState<CreateAdminData>({
    name: "",
    email: "",
    password: "",
    adminRole: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: CreateAdminData) => adminAccountService.createAdmin(data),
    onSuccess: () => {
      setIsSuccess(true)
      setErrorMsg(null)
    },
    onError: (error: Error) => {
      setErrorMsg(error.message || "Terjadi kesalahan saat membuat akun.")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password || !formData.adminRole) {
      setErrorMsg("Mohon lengkapi seluruh kolom formulir.")
      return
    }
    
    setErrorMsg(null)
    createMutation.mutate(formData)
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
            Akun admin untuk <strong>{formData.name}</strong> telah berhasil dibuat.
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
        
        <div className="px-6 py-5 border-b border-general-30 flex items-center justify-between bg-general-20 rounded-t-2xl">
          <div>
             <h3 className="h5 text-general-100 font-heading">Tambah Admin Baru</h3>
             <p className="body-xs text-general-60 mt-0.5">Lengkapi data untuk membuat akun akses baru.</p>
          </div>
          <button onClick={onClose} className="p-2 text-general-50 hover:text-general-100 hover:bg-general-30 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
            <div className="mx-6 mt-6 p-3 bg-red-20 border border-red-30 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-100 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="body-sm font-semibold text-red-100">Perhatian</p>
                    <p className="text-xs text-red-80 mt-0.5">{errorMsg}</p>
                </div>
                <button onClick={() => setErrorMsg(null)} className="text-red-80 hover:text-red-100"><X className="w-4 h-4" /></button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block body-sm font-semibold text-general-80 mb-2">Nama Lengkap</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2.5 bg-general-20 border rounded-lg focus:outline-none focus:ring-4 transition-all body-sm text-general-100 ${errorMsg && !formData.name ? 'border-red-100 focus:border-red-100 focus:ring-red-100/10' : 'border-general-30 focus:border-blue-100 focus:ring-blue-100/10'}`}
                placeholder="Contoh: Budi Santoso"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block body-sm font-semibold text-general-80 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-general-20 border rounded-lg focus:outline-none focus:ring-4 transition-all body-sm text-general-100 ${errorMsg && !formData.email ? 'border-red-100 focus:border-red-100 focus:ring-red-100/10' : 'border-general-30 focus:border-blue-100 focus:ring-blue-100/10'}`}
                  placeholder="nama@email.com"
                />
              </div>

              <div className="relative z-50">
                <CustomSelect 
                  label="Divisi / Peran"
                  value={formData.adminRole}
                  options={ADMIN_ROLE_OPTIONS}
                  onChange={(val) => setFormData({ ...formData, adminRole: val })}
                  placeholder="Pilih Divisi"
                  isError={!!(errorMsg && !formData.adminRole)}
                />
              </div>
            </div>

            <div>
              <label className="block body-sm font-semibold text-general-80 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-4 py-2.5 pr-10 bg-general-20 border rounded-lg focus:outline-none focus:ring-4 transition-all body-sm text-general-100 ${errorMsg && !formData.password ? 'border-red-100 focus:border-red-100 focus:ring-red-100/10' : 'border-general-30 focus:border-blue-100 focus:ring-blue-100/10'}`}
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-general-50 hover:text-blue-100 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-general-60 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Pastikan password aman dan unik.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-general-30 mt-2 rounded-b-2xl">
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
                "Simpan Akun"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}