import { createFileRoute } from "@tanstack/react-router"
import { DashboardAnggotaLayout } from "@/components/dashboard/dashboard-admin-layout"
import { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminService, type KitchenNeedItem } from "@/services/admin"
import { 
  Plus, Edit, Trash2, Image as ImageIcon, Loader2, Save, X, UploadCloud, Link as LinkIcon 
} from "lucide-react"

export const Route = createFileRoute("/dashboard/manajemen-kebutuhan")({
  component: ManajemenKebutuhanPage,
})

function ManajemenKebutuhanPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KitchenNeedItem | null>(null)

  // Fetch Data
  const { data: needs, isLoading } = useQuery({
    queryKey: ["admin", "kitchen-content"],
    queryFn: adminService.kitchen.getAll,
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: adminService.kitchen.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "kitchen-content"] })
  })

  const handleEdit = (item: KitchenNeedItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Hapus item kebutuhan ini?")) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <DashboardAnggotaLayout>
      <div className="p-4 md:p-8 space-y-8">
        
        {/* Header Section (Style matched with AkunAdminPage) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="h4 text-general-100 font-heading">Manajemen Konten Kebutuhan Dapur</h1>
            <p className="body-sm text-general-60 mt-2 max-w-2xl">
              Atur daftar produk/jasa yang akan ditampilkan di halaman publik untuk SPPG.
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

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-100" />
            <p className="body-sm text-general-60 animate-pulse">Memuat konten...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {needs?.map((item) => (
              <div key={item.id} className="bg-general-20 border border-general-30 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                
                {/* Preview Image */}
                <div className="h-48 w-full bg-general-30/30 relative flex items-center justify-center overflow-hidden shrink-0 border-b border-general-30">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex flex-col items-center text-general-50">
                      <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                      <span className="text-xs font-semibold">Tidak ada foto</span>
                    </div>
                  )}
                  
                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-general-100/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <button 
                      onClick={() => handleEdit(item)} 
                      className="p-2.5 bg-general-20 text-blue-100 rounded-lg hover:scale-110 transition-transform shadow-lg border border-general-30"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="p-2.5 bg-general-20 text-red-100 rounded-lg hover:scale-110 transition-transform shadow-lg border border-general-30"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="h5 text-general-100 font-heading mb-2 line-clamp-1">{item.title}</h3>
                  <p className="body-sm text-general-60 line-clamp-3 flex-1 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Form */}
        {isModalOpen && (
          <KitchenContentModal 
            initialData={editingItem} 
            onClose={() => setIsModalOpen(false)} 
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
function KitchenContentModal({ initialData, onClose, onSuccess }: { initialData: KitchenNeedItem | null, onClose: () => void, onSuccess: () => void }) {
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

  // Handle File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
      setSelectedFile(file)
    }
  }

  // Handle URL Input
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setFormData(prev => ({ ...prev, imageUrl: url }))
    setPreviewUrl(url)
    setSelectedFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let imageUrl = formData.imageUrl

    // Upload file if selected
    if (selectedFile) {
      setIsUploading(true)
      try {
        imageUrl = await adminService.kitchen.uploadImage(selectedFile)
      } catch (error) {
        console.error("Upload failed:", error)
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    mutation.mutate({ ...formData, imageUrl } as KitchenNeedItem)
  }

  // Common Input Class (Matches AkunAdminModal)
  const inputClass = "w-full px-4 py-2.5 bg-general-20 border border-general-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100/20 focus:border-blue-100 transition-all body-sm text-general-100 placeholder:text-general-50"
  const labelClass = "block body-sm font-semibold text-general-80 mb-2"

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-general-100/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-general-20 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-general-30 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-general-30 flex items-center justify-between bg-general-20 shrink-0">
          <div>
            <h3 className="h5 text-general-100 font-heading">{initialData ? "Edit Konten" : "Tambah Konten"}</h3>
            <p className="body-xs text-general-60 mt-0.5">Lengkapi informasi kebutuhan dapur.</p>
          </div>
          <button onClick={onClose} className="p-2 text-general-50 hover:text-general-100 hover:bg-general-30 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form Body - Scrollable */}
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
                placeholder="Jelaskan peran dan kenapa SPPG membutuhkannya produk/jasa tersebut."
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <label className={labelClass}>Foto / Ilustrasi</label>
              
              {/* Tab Switcher */}
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
                  <LinkIcon className="w-3.5 h-3.5" /> Masukkan Link Foto
                </button>
              </div>

              {/* Input Area */}
              <div className="space-y-3">
                {imageMode === "upload" ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-general-30 hover:border-blue-100 hover:bg-blue-100/5 bg-general-20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
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
                  <div className="relative rounded-xl overflow-hidden border border-general-30 h-40 bg-general-30/30 group">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null)
                        setFormData(prev => ({ ...prev, imageUrl: "" }))
                        setSelectedFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-general-20/90 rounded-full text-red-100 hover:bg-red-20 border border-general-30 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {!previewUrl}
              </div>
            </div>

          </form>
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-general-30 bg-general-20 flex gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-2.5 border border-general-30 text-general-80 font-semibold rounded-lg hover:bg-general-30 transition-colors body-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            form="content-form"
            disabled={mutation.isPending || isUploading}
            className="flex-1 py-2.5 bg-blue-100 text-general-20 font-semibold rounded-lg hover:bg-blue-90 shadow-lg hover:shadow-blue-100/20 transition-all body-sm disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {(mutation.isPending || isUploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isUploading ? "Mengunggah..." : "Simpan"}
          </button>
        </div>

      </div>
    </div>
  )
}

function AlertTriangle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
    )
}