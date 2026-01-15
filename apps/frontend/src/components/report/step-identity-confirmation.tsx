import { memo, useCallback } from "react"
import { ChevronDown, CheckSquare, Square, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { ReportFormData } from "./report-form"
import { categoriesService } from "@/services/categories"

interface StepIdentityConfirmationProps {
  formData: ReportFormData
  updateFormData: (data: Partial<ReportFormData>) => void
}

function StepIdentityConfirmationComponent({ formData, updateFormData }: StepIdentityConfirmationProps) {
  // Fetch relations from API
  const { data: relationsData, isLoading: relationsLoading } = useQuery({
    queryKey: ["relations"],
    queryFn: async () => {
      const response = await categoriesService.getRelations()
      return response.data
    },
    staleTime: 1000 * 60 * 60,
  })

  // Fetch categories for label mapping
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoriesService.getCategories()
      return response.data
    },
    staleTime: 1000 * 60 * 60,
  })

  const relations = relationsData || []
  const categories = categoriesData || []

  const getCategoryLabel = useCallback(
    (val: string) => categories.find((cat) => cat.value === val)?.label || val,
    [categories]
  )

  const handleRelationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => updateFormData({ relation: e.target.value }), [updateFormData])
  const handleRelationDetailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => updateFormData({ relationDetail: e.target.value }), [updateFormData])
  const toggleAgreement = useCallback(() => updateFormData({ agreement: !formData.agreement }), [formData.agreement, updateFormData])

  return (
    <div className="space-y-6">
      
      {/* 1. Relation to MBG */}
      <div>
        <label htmlFor="relation" className="block body-sm font-medium text-general-80 mb-2">
          Relasi dengan MBG <span className="text-red-100">*</span>
        </label>
        <div className="relative">
          <select
            id="relation"
            value={formData.relation}
            onChange={handleRelationChange}
            disabled={relationsLoading}
            className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg text-general-100 focus:ring-2 focus:ring-blue-100 focus:border-blue-100 transition-colors appearance-none cursor-pointer disabled:bg-general-30/30 disabled:cursor-not-allowed"
          >
            <option value="">
              {relationsLoading ? "Memuat relasi..." : "Pilih relasi anda"}
            </option>
            {relations.map((rel) => (
              <option key={rel.value} value={rel.value}>
                {rel.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-general-60">
            {relationsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* INPUT TAMBAHAN: Muncul hanya jika pilih "Lainnya" */}
        {formData.relation === "other" && (
            <div className="mt-3 animate-fadeIn">
                <input
                    type="text"
                    placeholder="Sebutkan peran spesifik Anda (Opsional)"
                    // Pastikan Anda sudah menambahkan field 'relationDetail' di interface ReportFormData
                    value={formData.relationDetail || ""} 
                    onChange={handleRelationDetailChange}
                    className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg text-general-100 placeholder:text-general-40 focus:ring-2 focus:ring-blue-100 focus:border-blue-100 transition-colors body-sm"
                />
            </div>
        )}

        <p className="text-xs text-general-60 mt-1.5">
          Identitas Anda akan dijaga kerahasiaannya sesuai kebijakan privasi kami.
        </p>
      </div>

      {/* 2. Agreement Checkbox */}
      <div 
        className={`rounded-lg p-4 border transition-colors cursor-pointer ${
            formData.agreement 
            ? "bg-blue-20/50 border-blue-100" 
            : "bg-general-20 border-general-30"
        }`}
        onClick={toggleAgreement}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 transition-colors ${formData.agreement ? "text-blue-100" : "text-general-40"}`}>
            {formData.agreement ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
          </div>
          <span className="body-sm text-general-80 select-none">
            Saya menyatakan bahwa informasi yang saya berikan dalam laporan ini adalah benar dan dapat
            dipertanggungjawabkan. Saya memahami bahwa laporan palsu dapat dikenakan sanksi sesuai hukum yang berlaku.
          </span>
        </div>
      </div>

      {/* 3. Summary Box (Ringkasan) */}
      <div className="bg-blue-20 rounded-lg p-5 border border-blue-30">
        <h3 className="h6 text-blue-100 mb-3 font-bold">Ringkasan Laporan Anda:</h3>
        <ul className="body-sm text-general-80 space-y-2">
          <li className="flex justify-between border-b border-blue-30/50 pb-2">
            <span className="text-general-60">Kategori:</span>
            {/* Menggunakan Helper function agar muncul Label (Keracunan), bukan Value (poisoning) */}
            <span className="font-medium text-right text-general-100">
                {getCategoryLabel(formData.category) || "-"}
            </span>
          </li>
          <li className="flex justify-between border-b border-blue-30/50 pb-2">
            <span className="text-general-60">Tanggal:</span>
            <span className="font-medium text-right text-general-100">{formData.date || "-"}</span>
          </li>
          <li className="flex justify-between border-b border-blue-30/50 pb-2">
            <span className="text-general-60">Lokasi:</span>
            <span className="font-medium text-right text-general-100">{formData.location || "-"}</span>
          </li>
          <li className="flex justify-between pt-1">
            <span className="text-general-60">Bukti:</span>
            <span className="font-medium text-right text-general-100">{formData.files.length} file diunggah</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export const StepIdentityConfirmation = memo(StepIdentityConfirmationComponent)
