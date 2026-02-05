import { createFileRoute } from "@tanstack/react-router"
import { DashboardAnggotaLayout } from "@/components/dashboard/dashboard-admin-layout"
import { useState, useRef, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminService, type KitchenNeedItem } from "@/services/admin"
import {
  Plus, Trash2, Image as ImageIcon, Loader2, Save, X, UploadCloud, Link as LinkIcon, Search, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle
} from "lucide-react"

export const Route = createFileRoute("/dashboard/manajemen-kebutuhan")({
  component: ManajemenKebutuhanPage,
})

function ManajemenKebutuhanPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KitchenNeedItem | null>(null)

  // Fetch Data
  const { data: needsData, isLoading } = useQuery({
    queryKey: ["admin", "kitchen-content"],
    queryFn: adminService.kitchen.getAll,
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: adminService.kitchen.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "kitchen-content"] })
      // Jika item terakhir di halaman dihapus, mundur 1 halaman
      if (currentItems.length === 1 && currentPage > 1) {
        setCurrentPage(p => p - 1)
      }
    }
  })

  // Filtering, Sorting (A-Z), & Pagination Logic
  const filteredNeeds = useMemo(() => {
    if (!needsData) return []
    
    // 1. Filter Pencarian
    const filtered = needsData.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // 2. Sort A-Z berdasarkan Title
    return filtered.sort((a, b) => a.title.localeCompare(b.title))

  }, [needsData, searchTerm])

  const totalPages = Math.ceil(filteredNeeds.length / itemsPerPage) || 1
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredNeeds.slice(indexOfFirstItem, indexOfLastItem)

  // --- LOGIKA SMART PAGINATION (1 2 ... Last) ---
  const paginationItems = useMemo(() => {
    // 1. Jika halaman <= 3, tampilkan semua
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // 2. Jika halaman >= 4, gunakan logika gap
    const pages = new Set([1, 2, totalPages]); // Selalu 1, 2, dan Last

    // Masukkan current page jika di tengah
    if (currentPage > 2 && currentPage < totalPages) {
      pages.add(currentPage);
    }

    const sortedPages = Array.from(pages).sort((a, b) => a - b);
    const finalItems: (number | string)[] = [];

    for (let i = 0; i < sortedPages.length; i++) {
      const page = sortedPages[i];
      if (i > 0) {
        const prevPage = sortedPages[i - 1];
        if (page - prevPage > 1) {
          finalItems.push("...");
        }
      }
      finalItems.push(page);
    }

    return finalItems;
  }, [currentPage, totalPages]);

  // Handlers
  const handleDetail = (item: KitchenNeedItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Hapus item kebutuhan ini secara permanen?")) {
      deleteMutation.mutate(id)
      setIsModalOpen(false) // Tutup modal jika delete dari modal
    }
  }

  // Pagination Handlers
  const goToFirst = () => setCurrentPage(1)
  const goToLast = () => setCurrentPage(totalPages)
  const goToPrev = () => setCurrentPage(p => Math.max(1, p - 1))
  const goToNext = () => setCurrentPage(p => Math.min(totalPages, p + 1))
  const handlePageClick = (page: number) => setCurrentPage(page)

  return (
    <DashboardAnggotaLayout>
      <div className="p-4 md:p-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="h4 text-general-100 font-heading">Manajemen Konten Kebutuhan</h1>
            <p className="body-sm text-general-60 mt-2 max-w-2xl">
              Kelola daftar produk atau jasa kebutuhan dapur yang tampil di halaman publik.
            </p>
          </div>

          <button
            onClick={handleAdd}
            className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-100 hover:bg-blue-90 text-general-20 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 body-sm font-medium"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Tambah Konten</span>
          </button>
        </div>

        {/* Filters Section (Search) */}
        <div className="bg-general-20 border border-general-30 rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-1">
            <label className="block body-xs font-semibold text-general-80 mb-2 uppercase tracking-wide">Pencarian</label>
            <div className="relative group">
              <input
                type="text"
                placeholder="Cari judul atau deskripsi..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Reset ke halaman 1 saat search
                }}
                className="w-full pl-11 pr-4 py-2.5 bg-general-20 border border-general-30 rounded-lg focus:outline-none focus:border-blue-100 focus:ring-4 focus:ring-blue-100/10 transition-all body-sm text-general-100 placeholder:text-general-50"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-general-50 group-focus-within:text-blue-100 transition-colors" />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-general-20 border border-general-30 rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-100" />
              <p className="body-sm text-general-60 animate-pulse">Memuat konten...</p>
            </div>
          ) : filteredNeeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-20 h-20 bg-general-30/30 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-general-50" />
              </div>
              <h3 className="h5 text-general-80 mb-1">Data Tidak Ditemukan</h3>
              <p className="body-sm text-general-60 max-w-sm">
                Belum ada konten kebutuhan dapur yang sesuai dengan pencarian Anda.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-general-20 border-b border-general-30 text-general-100 body-sm font-heading font-semibold">
                      <th className="p-4 w-16 text-center border-r border-general-30">No</th>
                      <th className="p-4 w-24 text-center border-r border-general-30">Foto</th>
                      <th className="p-4 min-w-[200px] border-r border-general-30">Judul Kebutuhan</th>
                      <th className="p-4 border-r border-general-30">Deskripsi Singkat</th>
                      <th className="p-4 w-32 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item, idx) => (
                      <tr key={item.id} className="border-b border-general-30 hover:bg-general-30/20 transition-colors group">
                        <td className="p-4 text-center body-sm text-general-60 border-r border-general-30 align-middle">
                          {indexOfFirstItem + idx + 1}
                        </td>

                        <td className="p-4 text-center align-middle border-r border-general-30">
                          <div className="w-12 h-12 rounded-lg bg-general-30/50 flex items-center justify-center overflow-hidden mx-auto border border-general-30">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-general-50" />
                            )}
                          </div>
                        </td>

                        <td className="p-4 align-middle border-r border-general-30">
                          <span className="font-bold text-general-100 body-sm">{item.title}</span>
                        </td>

                        <td className="p-4 align-middle border-r border-general-30">
                          <p className="body-sm text-general-60 line-clamp-2 max-w-md">{item.description}</p>
                        </td>

                        <td className="p-4 align-middle text-center">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleDetail(item)}
                              className="text-blue-100 font-bold text-xs bg-blue-20 hover:bg-blue-30 px-3 py-1.5 rounded-lg transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Detail
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredNeeds.length > 0 && (
                <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-general-30 text-general-60 body-sm bg-general-20">
                  <span className="text-xs sm:text-sm text-center sm:text-left">
                    Menampilkan <span className="font-medium text-general-100">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredNeeds.length)}</span> dari {filteredNeeds.length} data
                  </span>
                  
                  <div className="flex items-center gap-1 select-none">
                    
                    {/* First Page (<<) : HIDDEN DI MOBILE */}
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
                            onClick={() => handlePageClick(pageNum)}
                            className={`
                              w-8 h-8 flex items-center justify-center rounded transition-colors body-sm font-medium
                              ${currentPage === pageNum 
                                ? "bg-blue-100 text-general-20 font-bold shadow-sm" 
                                : "hover:bg-general-30 text-general-80"}
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

                    {/* Last Page (>>) : HIDDEN DI MOBILE */}
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

        {/* Modal Form (Detail / Edit / Add) */}
        {isModalOpen && (
          <KitchenContentModal 
            initialData={editingItem} 
            onClose={() => setIsModalOpen(false)} 
            onDelete={handleDelete}
            onSuccess={() => {
              setIsModalOpen(false)
              queryClient.invalidateQueries({ queryKey: ["admin", "kitchen-content"] })
            }}
          />
        )}

      </div>
    </DashboardAnggotaLayout>
  )
}

// --- FORM MODAL WITH UPLOAD ---
function KitchenContentModal({ initialData, onClose, onDelete, onSuccess }: { initialData: KitchenNeedItem | null, onClose: () => void, onDelete: (id: string) => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState<Partial<KitchenNeedItem>>({
    id: initialData?.id || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || ""
  })

  const [imageMode, setImageMode] = useState<"upload" | "url">("upload")
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: adminService.kitchen.save,
    onSuccess
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
      setSelectedFile(file)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setFormData(prev => ({ ...prev, imageUrl: url }))
    setPreviewUrl(url)
    setSelectedFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let imageUrl = formData.imageUrl

    if (selectedFile) {
      setIsUploading(true)
      try {
        imageUrl = await adminService.kitchen.uploadImage(selectedFile)
      } catch (error) {
        console.error("Upload failed", error)
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    mutation.mutate({ ...formData, imageUrl } as KitchenNeedItem)
  }

  // Styles
  const inputClass = "w-full px-4 py-2.5 bg-general-20 border border-general-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 transition-all body-sm text-general-100 placeholder:text-general-50"
  const labelClass = "block body-sm font-semibold text-general-80 mb-2"

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-general-100/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-general-20 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-general-30 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-general-30 flex items-center justify-between bg-general-20 shrink-0">
          <div>
            <h3 className="h5 text-general-100 font-heading">{initialData ? "Detail & Edit Konten" : "Tambah Konten Baru"}</h3>
            <p className="body-xs text-general-60 mt-0.5">Kelola informasi produk/jasa.</p>
          </div>
          <button onClick={onClose} className="p-2 text-general-50 hover:text-general-100 hover:bg-general-30 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          <form id="content-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Judul */}
            <div>
              <label className={labelClass}>Judul Role / Kebutuhan</label>
              <input 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className={inputClass}
                placeholder="Misal: Ahli Gizi"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <label className={labelClass}>Deskripsi</label>
              <textarea 
                required
                rows={4}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className={`${inputClass} resize-none`}
                placeholder="Jelaskan peran dan kenapa SPPG membutuhkannya..."
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <label className={labelClass}>Foto / Ilustrasi</label>
              
              <div className="flex bg-general-30/30 p-1 rounded-lg mb-3 w-fit border border-general-30">
                <button
                  type="button"
                  onClick={() => setImageMode("upload")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${imageMode === "upload" ? "bg-general-20 text-blue-100 shadow-sm border border-general-30" : "text-general-60 hover:text-general-80"}`}
                >
                  <UploadCloud className="w-3.5 h-3.5" /> Unggah Foto
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${imageMode === "url" ? "bg-general-20 text-blue-100 shadow-sm border border-general-30" : "text-general-60 hover:text-general-80"}`}
                >
                  <LinkIcon className="w-3.5 h-3.5" /> Input URL
                </button>
              </div>

              <div className="space-y-3">
                {imageMode === "upload" ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-general-30 hover:border-blue-100 hover:bg-blue-100/5 bg-general-20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group"
                  >
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    <div className="w-10 h-10 bg-general-30 rounded-full flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-5 h-5 text-general-60 group-hover:text-blue-100" />
                    </div>
                    <p className="text-xs font-bold text-general-80">Klik untuk unggah foto</p>
                    <p className="text-[10px] text-general-50">PNG, JPG, GIF max 5MB</p>
                  </div>
                ) : (
                  <input 
                    value={formData.imageUrl || ""}
                    onChange={handleUrlChange}
                    className={inputClass}
                    placeholder="https://example.com/image.jpg"
                  />
                )}

                {/* Preview Image */}
                {previewUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-general-30 h-48 bg-general-30/30 group">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null)
                        setFormData(prev => ({ ...prev, imageUrl: "" }))
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-general-20/90 rounded-full text-red-100 hover:bg-red-20 border border-general-30 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

          </form>
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-general-30 bg-general-20 flex justify-between gap-3 shrink-0">
          {initialData && (
            <button
              type="button"
              onClick={() => onDelete(initialData.id)}
              className="px-4 py-2.5 bg-red-20 text-red-100 hover:bg-red-30 border border-red-30 rounded-lg transition-colors body-sm font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Hapus
            </button>
          )}
          
          <div className={`flex gap-3 ${!initialData ? 'w-full' : ''}`}>
            <button 
              type="button" 
              onClick={onClose} 
              className={`${!initialData ? 'flex-1' : ''} px-4 py-2.5 border border-general-30 text-general-80 font-semibold rounded-lg hover:bg-general-30 transition-colors body-sm`}
            >
              Batal
            </button>
            <button 
              type="submit" 
              form="content-form"
              disabled={mutation.isPending || isUploading} 
              className={`${!initialData ? 'flex-1' : ''} px-6 py-2.5 bg-blue-100 hover:bg-blue-90 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]`}
            >
              {(mutation.isPending || isUploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}