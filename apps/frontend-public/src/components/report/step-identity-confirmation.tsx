import { memo, useCallback } from "react"
import { ChevronDown, CheckSquare, Square, UserCircle2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { ReportFormData } from "./report-form"
import { categoriesService } from "@/services/categories"
import { cn } from "@/lib/utils"

interface StepIdentityConfirmationProps {
  formData: ReportFormData
  updateFormData: (data: Partial<ReportFormData>) => void
}

function StepIdentityConfirmationComponent({ formData, updateFormData }: StepIdentityConfirmationProps) {
  const { data: relationsData, isLoading: relationsLoading } = useQuery({
    queryKey: ["relations"], queryFn: async () => (await categoriesService.getRelations()).data, staleTime: 3600000,
  })
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"], queryFn: async () => (await categoriesService.getCategories()).data, staleTime: 3600000,
  })

  const relations = relationsData || []
  const categories = categoriesData || []
  const getCategoryLabel = useCallback((val: string) => categories.find((cat) => cat.value === val)?.label || val, [categories])

  const commonInputClass = "w-full px-4 py-3 bg-white border rounded-xl text-general-100 focus:outline-none focus:ring-2 focus:ring-blue-100/50 focus:border-blue-100 transition-all duration-200"

  return (
    <div className="space-y-8">
      
      {/* 1. Identity Input */}
      <div>
        <label htmlFor="relation" className="block text-sm font-bold text-general-80 mb-2">
          Relasi Anda dengan Program MBG <span className="text-red-100">*</span>
        </label>
        <div className="relative">
          <select
            id="relation"
            value={formData.relation}
            onChange={(e) => updateFormData({ relation: e.target.value })}
            disabled={relationsLoading}
            className={cn(commonInputClass, "border-general-30 appearance-none pr-10 cursor-pointer disabled:bg-general-20")}
          >
            <option value="">{relationsLoading ? "Memuat..." : "Pilih Relasi"}</option>
            {relations.map((rel) => <option key={rel.value} value={rel.value}>{rel.label}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-general-50 pointer-events-none" />
        </div>

        {formData.relation === "other" && (
            <div className="mt-4 animate-in slide-in-from-top-2">
                <input
                    type="text"
                    placeholder="Sebutkan peran spesifik Anda"
                    value={formData.relationDetail || ""} 
                    onChange={(e) => updateFormData({ relationDetail: e.target.value })}
                    className={cn(commonInputClass, "border-general-30")}
                />
            </div>
        )}
        
        <div className="mt-3 flex items-start gap-2 bg-blue-20/50 p-3 rounded-lg border border-blue-20">
            <UserCircle2 className="w-5 h-5 text-blue-100 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-90 leading-relaxed">
                Identitas Anda sebagai pelapor <strong>dijamin kerahasiaannya</strong>. Kami hanya menggunakan data ini untuk verifikasi laporan.
            </p>
        </div>
      </div>

      <div className="border-t border-general-30 my-6" />

      {/* 2. Report Summary Card */}
      <div className="bg-gradient-to-br from-general-20 to-white rounded-2xl border border-general-30 overflow-hidden shadow-sm">
        <div className="bg-general-100 px-6 py-4 flex items-center justify-between">
            <h3 className="text-white font-bold text-sm md:text-base">Ringkasan Laporan</h3>
            <span className="text-[10px] bg-orange-100 text-white px-2 py-1 rounded font-bold uppercase tracking-wider">Draft</span>
        </div>
        <div className="p-6 grid gap-4 text-sm">
            <div className="grid grid-cols-3 gap-4">
                <span className="text-general-60 font-medium">Judul</span>
                <span className="col-span-2 font-bold text-general-100">{formData.title || "-"}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <span className="text-general-60 font-medium">Kategori</span>
                <span className="col-span-2 font-bold text-blue-100">{getCategoryLabel(formData.category) || "-"}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <span className="text-general-60 font-medium">Waktu</span>
                <span className="col-span-2 text-general-100">{formData.date} • {formData.time} {formData.timezone}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <span className="text-general-60 font-medium">Lokasi</span>
                <span className="col-span-2 text-general-100">{formData.location || "-"}</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <span className="text-general-60 font-medium">Bukti</span>
                <span className="col-span-2 text-general-100">{formData.files.length} File dilampirkan</span>
            </div>
        </div>
      </div>

      {/* 3. Agreement */}
      <div 
        className={cn(
            "rounded-xl p-5 border-2 cursor-pointer transition-all duration-200 flex gap-4 items-start select-none group",
            formData.agreement ? "bg-orange-10/30 border-orange-100" : "bg-white border-general-30 hover:border-general-40"
        )}
        onClick={() => updateFormData({ agreement: !formData.agreement })}
      >
        <div className={cn("mt-0.5 transition-colors", formData.agreement ? "text-orange-100" : "text-general-40 group-hover:text-general-60")}>
            {formData.agreement ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
        </div>
        <p className="text-sm text-general-80 leading-relaxed">
            Saya menyatakan bahwa informasi yang saya berikan adalah <strong>benar</strong> dan dapat dipertanggungjawabkan. Saya memahami konsekuensi hukum atas laporan palsu.
        </p>
      </div>

    </div>
  )
}

export const StepIdentityConfirmation = memo(StepIdentityConfirmationComponent)