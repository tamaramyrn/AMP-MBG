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
  Eye, // Icon Mata
  EyeOff,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Phone,
  Building2,
  User,
  FileText,
  Save
} from "lucide-react"
import { useState } from "react"
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
  { value: "active", label: "Aktif" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Ditolak" },
]

const getStatusInfo = (isVerified: boolean, isActive: boolean) => {
  if (!isActive) return { key: "rejected", label: "Ditolak", style: "bg-red-20 text-red-100 border-red-30" }
  if (!isVerified) return { key: "pending", label: "Pending", style: "bg-orange-20 text-orange-100 border-orange-30" }
  return { key: "active", label: "Aktif", style: "bg-green-20 text-green-100 border-green-30" }
}

const getMemberTypeLabel = (type: string | null) => {
  const found = MEMBER_TYPE_OPTIONS.find(opt => opt.value === type)
  return found?.label || type || "-"
}

function AkunAnggotaPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  // State Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [detailMember, setDetailMember] = useState<Member | null>(null)

  const { data: membersData, isLoading } = useQuery({
    queryKey: ["admin", "members"],
    queryFn: () => memberService.getMembers("all"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => memberService.deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] })
      setDeleteId(null)
    },
    onError: (err) => {
      alert("Gagal menghapus: " + err.message)
    }
  })

  const members: Member[] = (membersData?.data || []).filter((m: Member) => {
    const orgName = m.organizationInfo?.name?.toLowerCase() || ""
    const orgEmail = m.organizationInfo?.email?.toLowerCase() || ""
    const matchSearch =
      orgName.includes(searchTerm.toLowerCase()) ||
      orgEmail.includes(searchTerm.toLowerCase()) ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = !filterRole || m.memberType === filterRole
    const statusInfo = getStatusInfo(m.isVerified, m.isActive)
    const matchStatus = !filterStatus || statusInfo.key === filterStatus
    return matchSearch && matchRole && matchStatus
  })

  const confirmDelete = () => {
    if (deleteId) deleteMutation.mutate(deleteId)
  }

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
        <div className="bg-general-20 border border-general-30 rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Search */}
            <div className="md:col-span-12 lg:col-span-4">
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
            <div className="md:col-span-6 lg:col-span-4">
              <label className="block body-xs font-semibold text-general-80 mb-2 uppercase tracking-wide">Filter Jenis</label>
              <div className="relative group">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-general-20 border border-general-30 rounded-lg focus:outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-100/10 transition-all body-sm text-general-100 appearance-none cursor-pointer"
                >
                  <option value="">Semua Jenis</option>
                  {MEMBER_TYPE_OPTIONS.map((opt) => (
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

        {/* Content Table */}
        <div className="bg-general-20 border border-general-30 rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-100" />
              <p className="body-sm text-general-60 animate-pulse">Memuat data anggota...</p>
            </div>
          ) : members.length === 0 ? (
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
                  {members.map((member, idx) => {
                    const statusInfo = getStatusInfo(member.isVerified, member.isActive)
                    const orgName = member.organizationInfo?.name || member.name
                    const orgEmail = member.organizationInfo?.email || member.email
                    const orgPhone = member.organizationInfo?.phone || member.phone

                    return (
                      <tr key={member.id} className="border-b border-general-30 hover:bg-general-30/20 transition-colors group">
                        <td className="p-4 text-center body-sm text-general-60 border-r border-general-30 group-hover:text-general-80">
                          {idx + 1}
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

                        {/* --- TOMBOL AKSI DIPERBARUI --- */}
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
        </div>
      </div>

      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            queryClient.invalidateQueries({ queryKey: ["admin", "members"] })
          }}
        />
      )}

      {deleteId && (
        <DeleteConfirmModal
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          isLoading={deleteMutation.isPending}
        />
      )}

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
    !member.isActive ? "rejected" : !member.isVerified ? "pending" : "active"
  )
  const [showSuccess, setShowSuccess] = useState(false)

  const statusMutation = useMutation({
    mutationFn: (data: { isVerified?: boolean; isActive?: boolean }) =>
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
    if (newStatus === "active") {
      statusMutation.mutate({ isVerified: true, isActive: true })
    } else if (newStatus === "pending") {
      statusMutation.mutate({ isVerified: false, isActive: true })
    } else if (newStatus === "rejected") {
      statusMutation.mutate({ isVerified: false, isActive: false })
    }
  }

  const orgInfo = member.organizationInfo
  const currentStatus = !member.isActive ? "rejected" : !member.isVerified ? "pending" : "active"
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
          <div className="bg-general-30/30 rounded-xl p-5 border border-general-30">
            <h4 className="body-sm font-bold text-general-100 mb-4">Panel Verifikasi Admin</h4>
            <div>
              <label className="block text-xs text-general-60 mb-2">Status Anggota</label>
              <div className="relative">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg appearance-none cursor-pointer pr-10 body-sm focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 text-general-100"
                >
                  <option value="active">Aktif (Terverifikasi)</option>
                  <option value="pending">Pending (Menunggu Verifikasi)</option>
                  <option value="rejected">Ditolak</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-general-60 pointer-events-none" />
              </div>
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
    password: "",
    memberType: "supplier"
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: CreateMemberData) => memberService.createMember(data),
    onSuccess: () => {
      setIsSuccess(true)
      setErrorMsg(null)
    },
    onError: (error: Error) => {
      setErrorMsg(error.message || "Gagal membuat akun anggota")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
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
      <div className="bg-general-20 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-general-30 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-general-30 flex items-center justify-between bg-general-20 shrink-0">
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

        {/* Form Body - Scrollable */}
        <div className="overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">

              <div>
                <label className="block body-sm font-semibold text-general-80 mb-2">Jenis</label>
                <div className="relative">
                  <select
                    value={formData.memberType}
                    onChange={(e) => setFormData({ ...formData, memberType: e.target.value as CreateMemberData["memberType"] })}
                    className="w-full px-4 py-2.5 bg-general-20 border border-general-30 rounded-lg focus:outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-100/10 transition-all body-sm text-general-100 appearance-none cursor-pointer"
                  >
                    {MEMBER_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-general-50 pointer-events-none" />
                </div>
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
                <div>
                  <label className="block body-sm font-semibold text-general-80 mb-2">Nomor Telepon</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-general-20 border border-general-30 rounded-lg focus:outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-100/10 transition-all body-sm text-general-100"
                      placeholder="08..."
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-general-50" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block body-sm font-semibold text-general-80 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 bg-general-20 border border-general-30 rounded-lg focus:outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-100/10 transition-all body-sm text-general-100"
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