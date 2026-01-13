"use client"

import { useState } from "react"
import { Search } from "lucide-react"

const provinces = [
  { value: "", label: "Semua Provinsi" },
  { value: "jakarta", label: "DKI Jakarta" },
  { value: "jabar", label: "Jawa Barat" },
  { value: "jatim", label: "Jawa Timur" },
  { value: "jateng", label: "Jawa Tengah" },
  { value: "banten", label: "Banten" },
]

const categories = [
  { value: "", label: "Semua Kategori" },
  { value: "poisoning", label: "Keracunan & Kesehatan" },
  { value: "kitchen", label: "Operasional Dapur" },
  { value: "quality", label: "Kualitas Makanan" },
  { value: "policy", label: "Kebijakan & Distribusi" },
]

export function DataFilters() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [province, setProvince] = useState("")
  const [category, setCategory] = useState("")

  return (
    <div className="bg-white rounded-lg p-4 md:p-6 shadow-md border border-gray-200 mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Filter Laporan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1.5">
            Tanggal Mulai
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1.5">
            Tanggal Akhir
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
          />
        </div>

        {/* Province */}
        <div>
          <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1.5">
            Provinsi
          </label>
          <select
            id="province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
          >
            {provinces.map((prov) => (
              <option key={prov.value} value={prov.value}>
                {prov.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">
            Kategori
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <button
            type="button"
            className="w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Cari Data
          </button>
        </div>
      </div>
    </div>
  )
}
