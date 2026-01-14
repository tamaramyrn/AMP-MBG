
import { ChevronDown, CheckSquare, Square } from "lucide-react"
import type { ReportFormData } from "./report-form"

interface StepIdentityConfirmationProps {
  formData: ReportFormData
  updateFormData: (data: Partial<ReportFormData>) => void
}

const relations = [
  { value: "parent", label: "Orang Tua/Wali Murid" },
  { value: "teacher", label: "Guru/Tenaga Pendidik" },
  { value: "principal", label: "Kepala Sekolah" },
  { value: "supplier", label: "Penyedia Makanan/Supplier" },
  { value: "student", label: "Siswa" },
  { value: "community", label: "Masyarakat Umum" },
  { value: "other", label: "Lainnya" },
]

// Mapping untuk menerjemahkan Value (poisoning) ke Label (Keracunan...)
const categoryLabels: Record<string, string> = {
  poisoning: "Keracunan dan Masalah Kesehatan",
  kitchen: "Operasional Dapur",
  quality: "Kualitas dan Keamanan Dapur",
  policy: "Kebijakan dan Anggaran",
  implementation: "Implementasi Program",
  social: "Dampak Sosial dan Ekonomi",
}

export function StepIdentityConfirmation({ formData, updateFormData }: StepIdentityConfirmationProps) {
  
  // Helper untuk mendapatkan Label Kategori
  const getCategoryLabel = (val: string) => categoryLabels[val] || val

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
            onChange={(e) => updateFormData({ relation: e.target.value })}
            className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg text-general-100 focus:ring-2 focus:ring-blue-100 focus:border-blue-100 transition-colors appearance-none cursor-pointer"
          >
            <option value="">Pilih relasi anda</option>
            {relations.map((rel) => (
              <option key={rel.value} value={rel.value}>
                {rel.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-general-60">
            <ChevronDown className="w-5 h-5" />
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
                    onChange={(e) => updateFormData({ relationDetail: e.target.value })}
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
        onClick={() => updateFormData({ agreement: !formData.agreement })}
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