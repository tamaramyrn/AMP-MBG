import { createFileRoute } from "@tanstack/react-router"
import { DashboardAnggotaLayout } from "@/components/dashboard/dashboard-anggota-layout"
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Loader2, 
  UserCheck, 
  UserX,
  MoreHorizontal,
  Phone,
  Mail,
  CreditCard // Icon untuk NIK
} from "lucide-react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { memberService, type Member } from "@/services/members"

export const Route = createFileRoute("/dashboard/akun-anggota/")({
  component: AkunAnggotaPage,
})

// Mapping label role agar lebih rapi
const ROLE_LABELS: Record<string, string> = {
  supplier: "Supplier/Vendor",
  caterer: "Katering",
  school: "Pihak Sekolah",
  government: "Pemerintah Daerah",
  ngo: "LSM/NGO",
  other: "Lainnya",
}

function AkunAnggotaPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending')
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch data berdasarkan tab yang aktif
  const { data: membersData, isLoading } = useQuery({
    queryKey: ["admin", "members", activeTab],
    queryFn: () => memberService.getMembers(activeTab),
  })

  // Mutation untuk Verifikasi
  const verifyMutation = useMutation({
    mutationFn: (id: string) => memberService.verifyMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] })
      alert("Akun berhasil diverifikasi!")
    }
  })

  // Mutation untuk Tolak
  const rejectMutation = useMutation({
    mutationFn: (id: string) => memberService.rejectMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] })
      alert("Akun berhasil ditolak/dihapus.")
    }
  })

  // Filter client-side sederhana untuk search
  const members: Member[] = (membersData?.data || []).filter((m: Member) => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.nik.includes(searchTerm)
  )

  const handleVerify = (id: string) => {
    if (confirm("Apakah Anda yakin ingin memverifikasi akun ini? User akan bisa login setelah ini.")) {
      verifyMutation.mutate(id)
    }
  }

  const handleReject = (id: string) => {
    if (confirm("Hapus pendaftaran akun ini? Tindakan ini tidak bisa dibatalkan.")) {
      rejectMutation.mutate(id)
    }
  }

  return (
    <DashboardAnggotaLayout>
      <div className="p-4 md:p-8">
        
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="h4 text-general-100">Manajemen Akun Anggota</h1>
            <p className="body-sm text-general-60 mt-1">Verifikasi pendaftaran anggota baru program MBG.</p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Cari nama, email, atau NIK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-general-20 border border-general-30 rounded-lg focus:ring-2 focus:ring-blue-100 text-general-100 body-sm transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-general-60" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-general-30 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 body-sm font-medium transition-colors border-b-2 ${
              activeTab === 'pending' 
                ? "border-blue-100 text-blue-100" 
                : "border-transparent text-general-60 hover:text-general-80"
            }`}
          >
            Menunggu Verifikasi
            {/* Badge Counter Dummy */}
            <span className="ml-2 bg-orange-100 text-general-20 text-[10px] px-1.5 py-0.5 rounded-full">Baru</span>
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            className={`px-6 py-3 body-sm font-medium transition-colors border-b-2 ${
              activeTab === 'verified' 
                ? "border-blue-100 text-blue-100" 
                : "border-transparent text-general-60 hover:text-general-80"
            }`}
          >
            Anggota Aktif
          </button>
        </div>

        {/* Content Table */}
        <div className="bg-general-20 border border-general-30 rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-100" />
            </div>
          ) : members.length === 0 ? (
            <div className="p-10 text-center">
              <div className="bg-general-30/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-8 h-8 text-general-50" />
              </div>
              <h3 className="h6 text-general-80">Tidak ada data</h3>
              <p className="body-sm text-general-60 mt-1">
                {activeTab === 'pending' ? "Semua akun pendaftar sudah diverifikasi." : "Belum ada anggota aktif."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-general-20 border-b border-general-30 text-general-100 body-sm font-heading font-semibold">
                    <th className="p-4 w-12 text-center border-r border-general-30">No</th>
                    <th className="p-4 min-w-[250px] border-r border-general-30">Info Personal</th>
                    <th className="p-4 min-w-[200px] border-r border-general-30">Kontak</th>
                    <th className="p-4 min-w-[150px] border-r border-general-30">Peran</th>
                    <th className="p-4 w-40 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-general-30">
                  {members.map((member, idx) => (
                    <tr key={member.id} className="hover:bg-general-30/20 transition-colors">
                      <td className="p-4 text-center body-sm text-general-60 border-r border-general-30">{idx + 1}</td>
                      
                      {/* Info Personal */}
                      <td className="p-4 border-r border-general-30">
                        <div className="flex flex-col">
                          <span className="font-bold text-general-100 body-sm">{member.name}</span>
                          <div className="flex items-center gap-1.5 mt-1 text-general-60 text-xs">
                            <CreditCard className="w-3 h-3" />
                            <span>NIK: {member.nik}</span>
                          </div>
                          <span className="text-[10px] text-general-50 mt-0.5">
                            Daftar: {new Date(member.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </td>

                      {/* Kontak */}
                      <td className="p-4 border-r border-general-30">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-general-80 text-xs">
                            <Mail className="w-3.5 h-3.5 text-blue-100" />
                            {member.email}
                          </div>
                          <div className="flex items-center gap-2 text-general-80 text-xs">
                            <Phone className="w-3.5 h-3.5 text-green-100" />
                            +{member.phone}
                          </div>
                        </div>
                      </td>

                      {/* Peran */}
                      <td className="p-4 border-r border-general-30">
                        <span className="inline-flex px-2.5 py-1 rounded-md bg-blue-100/10 text-blue-100 text-xs font-medium border border-blue-100/20">
                          {ROLE_LABELS[member.role] || member.role}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="p-4">
                        {activeTab === 'pending' ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleVerify(member.id)}
                              disabled={verifyMutation.isPending}
                              className="p-2 bg-green-20 text-green-100 hover:bg-green-30 border border-green-30 rounded-lg transition-colors tooltip-trigger group relative"
                              title="Verifikasi Akun"
                            >
                              {verifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-general-100 text-general-20 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Terima
                              </span>
                            </button>
                            
                            <button
                              onClick={() => handleReject(member.id)}
                              disabled={rejectMutation.isPending}
                              className="p-2 bg-red-20 text-red-100 hover:bg-red-30 border border-red-30 rounded-lg transition-colors group relative"
                              title="Tolak Pendaftaran"
                            >
                              {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-general-100 text-general-20 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Tolak
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <button className="p-2 text-general-60 hover:bg-general-30 rounded-lg transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardAnggotaLayout>
  )
}