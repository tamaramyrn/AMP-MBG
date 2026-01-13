"use client"

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

export function StepIdentityConfirmation({ formData, updateFormData }: StepIdentityConfirmationProps) {
  return (
    <div className="space-y-5">
      {/* Relation to MBG */}
      <div>
        <label htmlFor="relation" className="block text-sm font-medium text-gray-700 mb-1.5">
          Relasi dengan MBG <span className="text-red-500">*</span>
        </label>
        <select
          id="relation"
          value={formData.relation}
          onChange={(e) => updateFormData({ relation: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        >
          <option value="">Pilih relasi</option>
          {relations.map((rel) => (
            <option key={rel.value} value={rel.value}>
              {rel.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Identitas Anda akan dijaga kerahasiaannya sesuai kebijakan privasi kami.
        </p>
      </div>

      {/* Agreement */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreement}
            onChange={(e) => updateFormData({ agreement: e.target.checked })}
            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
          />
          <span className="text-sm text-gray-700">
            Saya menyatakan bahwa informasi yang saya berikan dalam laporan ini adalah benar dan dapat
            dipertanggungjawabkan. Saya memahami bahwa laporan palsu dapat dikenakan sanksi sesuai hukum yang berlaku.
          </span>
        </label>
      </div>

      {/* Summary */}
      <div className="bg-primary-light rounded-lg p-4 border border-green-200">
        <h3 className="font-medium text-gray-800 mb-2">Ringkasan Laporan Anda:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            <strong>Kategori:</strong> {formData.category || "-"}
          </li>
          <li>
            <strong>Tanggal:</strong> {formData.date || "-"}
          </li>
          <li>
            <strong>Lokasi:</strong> {formData.location || "-"}
          </li>
          <li>
            <strong>Bukti:</strong> {formData.files.length} file diunggah
          </li>
        </ul>
      </div>
    </div>
  )
}
