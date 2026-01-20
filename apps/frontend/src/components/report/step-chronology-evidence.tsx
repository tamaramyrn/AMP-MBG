import { memo, useCallback, useMemo } from "react"
import type React from "react"
import type { ReportFormData } from "./report-form"
import { Upload, X, ImageIcon } from "lucide-react"

interface StepChronologyEvidenceProps {
  formData: ReportFormData
  updateFormData: (data: Partial<ReportFormData>) => void
}

const MIN_DESCRIPTION_LENGTH = 50
const MAX_FILE_SIZE = 10 * 1024 * 1024

function StepChronologyEvidenceComponent({ formData, updateFormData }: StepChronologyEvidenceProps) {
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      const validFiles = selectedFiles.filter((file) => file.type.startsWith("image/") && file.size <= MAX_FILE_SIZE)
      updateFormData({ files: [...formData.files, ...validFiles] })
    },
    [formData.files, updateFormData]
  )

  const removeFile = useCallback(
    (index: number) => {
      updateFormData({ files: formData.files.filter((_, i) => i !== index) })
    },
    [formData.files, updateFormData]
  )

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData({ description: e.target.value }),
    [updateFormData]
  )

  const currentLength = formData.description.length
  const isError = useMemo(() => currentLength > 0 && currentLength < MIN_DESCRIPTION_LENGTH, [currentLength])

  return (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <div className="flex justify-between items-center mb-2">
            <label htmlFor="description" className="block body-sm font-medium text-general-80">
            Deskripsi Kronologi Kejadian <span className="text-red-100">*</span>
            </label>
            {/* INDIKATOR KARAKTER */}
            <span className={`text-xs ${isError ? 'text-red-100 font-bold' : 'text-general-60'}`}>
                {currentLength}/{MIN_DESCRIPTION_LENGTH} Karakter
            </span>
        </div>
        
        <textarea
          id="description"
          value={formData.description}
          onChange={handleDescriptionChange}
          rows={6}
          placeholder="Jelaskan secara detail kronologi kejadian yang Anda laporkan..."
          className={`w-full px-4 py-3 bg-general-20 border rounded-lg text-general-100 placeholder:text-general-40 focus:ring-2 transition-colors resize-none body-sm
            ${isError 
                ? 'border-red-100 focus:border-red-100 focus:ring-red-100' // Merah jika kurang
                : 'border-general-30 focus:border-blue-100 focus:ring-blue-100' // Normal
            }`}
        />
        
        {/* Pesan Bantuan / Error */}
        {isError ? (
            <p className="text-xs text-red-100 mt-1.5 animate-pulse">
                Mohon tulis minimal 50 karakter agar laporan jelas.
            </p>
        ) : (
            <p className="text-xs text-general-60 mt-1.5">
                Minimal 50 karakter. Ceritakan apa, kapan, dan bagaimana kejadiannya.
            </p>
        )}
      </div>

      {/* File Upload (IMAGE ONLY) */}
      <div>
        <label className="block body-sm font-medium text-general-80 mb-2">Unggah Bukti Foto</label>
        
        {/* Upload Area */}
        <div className="border-2 border-dashed border-general-30 rounded-lg p-8 text-center hover:border-blue-100 transition-colors bg-general-20 group">
          <input
            type="file"
            id="file-upload"
            multiple
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
            <div className="w-12 h-12 bg-general-30/30 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-20 transition-colors">
                <Upload className="w-6 h-6 text-general-60 group-hover:text-blue-100 transition-colors" />
            </div>
            <p className="body-sm text-general-70 mb-1">
              <span className="text-blue-100 font-bold hover:underline">Klik untuk unggah</span> atau drag and drop
            </p>
            <p className="text-xs text-general-50">
              PNG, JPG (Maks. 10MB per file)
            </p>
          </label>
        </div>

        {/* File Preview List (UPDATED: Shows Image Thumbnail) */}
        {formData.files.length > 0 && (
          <div className="mt-4 space-y-3">
            {formData.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-general-20 rounded-lg p-3 border border-general-30 hover:border-blue-30 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  
                  {/* --- BAGIAN INI DIPERBARUI UNTUK MENAMPILKAN GAMBAR --- */}
                  <div className="w-16 h-16 bg-general-30 rounded-lg flex-shrink-0 overflow-hidden border border-general-30 relative group/img">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay Icon saat hover (opsional aesthetic) */}
                    <div className="absolute inset-0 bg-black/10 hidden group-hover/img:flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white drop-shadow-md" />
                    </div>
                  </div>
                  {/* ----------------------------------------------------- */}

                  <div className="min-w-0">
                    <p className="body-sm font-medium text-general-100 truncate">{file.name}</p>
                    <p className="text-xs text-general-60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-2 text-general-50 hover:text-red-100 hover:bg-red-20 rounded-full transition-all"
                  aria-label="Hapus file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const StepChronologyEvidence = memo(StepChronologyEvidenceComponent)