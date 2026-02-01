import { memo, useCallback, useMemo } from "react"
import type React from "react"
import type { ReportFormData } from "./report-form"
import { Upload, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepChronologyEvidenceProps {
  formData: ReportFormData
  updateFormData: (data: Partial<ReportFormData>) => void
}

const MIN_DESCRIPTION_LENGTH = 50
const MAX_TOTAL_SIZE = 10 * 1024 * 1024

function StepChronologyEvidenceComponent({ formData, updateFormData }: StepChronologyEvidenceProps) {
  const totalFileSize = useMemo(() => formData.files.reduce((sum, file) => sum + file.size, 0), [formData.files])
  const isSizeExceeded = totalFileSize > MAX_TOTAL_SIZE
  const currentLength = formData.description.length
  const isError = useMemo(() => currentLength > 0 && currentLength < MIN_DESCRIPTION_LENGTH, [currentLength])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validFiles = selectedFiles.filter((file) => file.type.startsWith("image/"))
    // (Logic same as before, simplified for display)
    const currentTotal = formData.files.reduce((sum, f) => sum + f.size, 0)
    const filesToAdd: File[] = []
    let runningTotal = currentTotal
    for (const file of validFiles) {
        if (runningTotal + file.size <= MAX_TOTAL_SIZE) {
            filesToAdd.push(file)
            runningTotal += file.size
        }
    }
    if (filesToAdd.length > 0) updateFormData({ files: [...formData.files, ...filesToAdd] })
  }, [formData.files, updateFormData])

  const removeFile = useCallback((index: number) => {
    updateFormData({ files: formData.files.filter((_, i) => i !== index) })
  }, [formData.files, updateFormData])

  return (
    <div className="space-y-8">
      {/* Description */}
      <div>
        <div className="flex justify-between items-end mb-2">
            <label htmlFor="description" className="block text-sm font-bold text-general-80">
                Kronologi Kejadian <span className="text-red-100">*</span>
            </label>
            <span className={cn("text-xs font-medium", isError ? "text-red-100" : "text-general-60")}>
                {currentLength} Karakter (Min. 50)
            </span>
        </div>
        
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={8}
          placeholder="Ceritakan detail kejadian: Siapa yang terlibat? Apa yang terjadi? Bagaimana kondisinya?"
          className={cn(
            "w-full px-4 py-3 bg-white border rounded-xl text-general-100 placeholder:text-general-40 focus:outline-none focus:ring-2 focus:ring-blue-100/50 focus:border-blue-100 transition-all resize-none",
            isError ? "border-red-100" : "border-general-30"
          )}
        />
        {isError && (
            <p className="text-xs text-red-100 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Deskripsi terlalu pendek.
            </p>
        )}
      </div>

      {/* File Upload */}
      <div>
        <div className="flex justify-between items-end mb-3">
          <label className="block text-sm font-bold text-general-80">Unggah Bukti Foto</label>
          <span className={cn("text-xs font-medium", isSizeExceeded ? "text-red-100" : "text-general-60")}>
            {(totalFileSize / 1024 / 1024).toFixed(2)} / 10 MB
          </span>
        </div>

        {/* Upload Area */}
        <div className={cn(
            "relative border-2 border-dashed rounded-xl p-8 md:p-10 text-center transition-all duration-200 group bg-general-20/30",
            isSizeExceeded ? "border-red-100 bg-red-20/10" : "border-blue-30 hover:border-blue-100 hover:bg-blue-20/10"
        )}>
          <input
            type="file" id="file-upload" multiple accept="image/*"
            onChange={handleFileChange} className="hidden" disabled={isSizeExceeded}
          />
          <label htmlFor="file-upload" className={cn("flex flex-col items-center justify-center w-full h-full", isSizeExceeded ? "cursor-not-allowed" : "cursor-pointer")}>
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-200">
                <Upload className="w-7 h-7 text-blue-100" />
            </div>
            <p className="text-general-80 font-medium mb-1">
              <span className="text-blue-100 font-bold hover:underline">Klik untuk unggah</span> atau drag file ke sini
            </p>
            <p className="text-xs text-general-50">Format: JPG, PNG (Max 10MB Total)</p>
          </label>
        </div>

        {/* File Preview Grid */}
        {formData.files.length > 0 && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {formData.files.map((file, index) => (
              <div key={index} className="relative group rounded-xl overflow-hidden border border-general-30 bg-white aspect-square shadow-sm">
                <img 
                    src={URL.createObjectURL(file)} 
                    alt="Preview" 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <p className="text-[10px] text-white truncate w-full mb-1">{file.name}</p>
                    <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="bg-red-100 text-white p-1.5 rounded-lg w-full flex items-center justify-center hover:bg-red-90 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const StepChronologyEvidence = memo(StepChronologyEvidenceComponent)