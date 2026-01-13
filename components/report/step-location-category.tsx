"use client"

import type { ReportFormData } from "./report-form"

interface StepLocationCategoryProps {
  formData: ReportFormData
  updateFormData: (data: Partial<ReportFormData>) => void
}

const categories = [
  { value: "poisoning", label: "Keracunan & Kesehatan" },
  { value: "kitchen", label: "Operasional Dapur" },
  { value: "quality", label: "Kualitas Makanan" },
  { value: "policy", label: "Kebijakan & Distribusi" },
]

const provinces = [
  { value: "jakarta", label: "DKI Jakarta" },
  { value: "jabar", label: "Jawa Barat" },
  { value: "jatim", label: "Jawa Timur" },
  { value: "jateng", label: "Jawa Tengah" },
  { value: "banten", label: "Banten" },
]

const cities: Record<string, { value: string; label: string }[]> = {
  jakarta: [
    { value: "jaksel", label: "Jakarta Selatan" },
    { value: "jakbar", label: "Jakarta Barat" },
    { value: "jaktim", label: "Jakarta Timur" },
    { value: "jakut", label: "Jakarta Utara" },
    { value: "jakpus", label: "Jakarta Pusat" },
  ],
  jabar: [
    { value: "bandung", label: "Bandung" },
    { value: "bogor", label: "Bogor" },
    { value: "bekasi", label: "Bekasi" },
    { value: "depok", label: "Depok" },
  ],
  jatim: [
    { value: "surabaya", label: "Surabaya" },
    { value: "malang", label: "Malang" },
    { value: "sidoarjo", label: "Sidoarjo" },
  ],
  jateng: [
    { value: "semarang", label: "Semarang" },
    { value: "solo", label: "Solo" },
  ],
  banten: [
    { value: "tangerang", label: "Tangerang" },
    { value: "serang", label: "Serang" },
  ],
}

export function StepLocationCategory({ formData, updateFormData }: StepLocationCategoryProps) {
  const availableCities = formData.province ? cities[formData.province] || [] : []

  return (
    <div className="space-y-5">
      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">
          Kategori Laporan <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => updateFormData({ category: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        >
          <option value="">Pilih kategori</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1.5">
          Tanggal Kejadian <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="date"
          value={formData.date}
          onChange={(e) => updateFormData({ date: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
      </div>

      {/* Province & City */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1.5">
            Provinsi <span className="text-red-500">*</span>
          </label>
          <select
            id="province"
            value={formData.province}
            onChange={(e) => updateFormData({ province: e.target.value, city: "" })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          >
            <option value="">Pilih provinsi</option>
            {provinces.map((prov) => (
              <option key={prov.value} value={prov.value}>
                {prov.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">
            Kota/Kabupaten <span className="text-red-500">*</span>
          </label>
          <select
            id="city"
            value={formData.city}
            onChange={(e) => updateFormData({ city: e.target.value })}
            disabled={!formData.province}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Pilih kota/kabupaten</option>
            {availableCities.map((city) => (
              <option key={city.value} value={city.value}>
                {city.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Specific Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
          Lokasi Spesifik (Nama Sekolah) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="location"
          value={formData.location}
          onChange={(e) => updateFormData({ location: e.target.value })}
          placeholder="Contoh: SDN Contoh 01"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
      </div>
    </div>
  )
}
