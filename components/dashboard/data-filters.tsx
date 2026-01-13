"use client"

import { useState } from "react"
import { Search, ChevronDown, AlertCircle } from "lucide-react"

// Interface untuk data filter yang akan dikirim ke parent
export interface FilterValues {
  startDate: string
  endDate: string
  province: string
  category: string
}

interface DataFiltersProps {
  onFilter: (filters: FilterValues) => void
}

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
  { value: "poisoning", label: "Keracunan dan Masalah Kesehatan" },
  { value: "kitchen", label: "Operasional Dapur" },
  { value: "quality", label: "Kualitas dan Keamanan Dapur" },
  { value: "policy", label: "Kebijakan dan Anggaran" },
  { value: "implementation", label: "Implementasi Program" },
  { value: "social", label: "Dampak Sosial dan Ekonomi" },
]

export function DataFilters({ onFilter }: DataFiltersProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [province, setProvince] = useState("")
  const [category, setCategory] = useState("")
  const [error, setError] = useState("")

  // --- SETUP BATAS TANGGAL ---
  const today = new Date().toISOString().split("T")[0] // Hari ini (YYYY-MM-DD)
  const minDate = "2024-01-01" // Batas paling lampau

  // --- LOGIKA INPUT TANGGAL (Anti 11111) ---
  const handleDateInput = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: (val: string) => void
  ) => {
    const val = e.target.value
    
    // Validasi: Jika ada isinya, cek tahun
    if (val) {
      const year = val.split("-")[0]
      // Jika tahun lebih dari 4 digit (misal 11111), JANGAN update state
      if (year.length > 4) return 
    }
    
    setter(val)
    // Reset error saat user mengetik ulang agar merahnya hilang
    if (error) setError("") 
  }

  const handleSearch = () => {
    // 1. Validasi Range (Start tidak boleh lebih besar dari End)
    if (startDate && endDate && startDate > endDate) {
      setError("Tanggal mulai tidak boleh lebih besar dari tanggal akhir.")
      return
    }

    // 2. Validasi Masa Depan (Backup jika user bypass kalender)
    if ((startDate && startDate > today) || (endDate && endDate > today)) {
        setError("Tanggal tidak boleh melebihi hari ini.")
        return
    }

    setError("") // Reset error jika valid
    
    // Kirim data ke parent component
    onFilter({
      startDate,
      endDate,
      province,
      category,
    })
  }

  // Helper untuk menentukan apakah input harus merah
  const isDateError = error !== ""

  return (
    <div className="bg-general-20 rounded-lg p-4 md:p-6 shadow-md border border-general-30 mb-6">
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="h5 text-general-100">Filter Laporan</h2>
        {error && (
            <div className="flex items-center gap-2 text-red-100 text-xs bg-red-20 px-3 py-1 rounded-full animate-pulse border border-red-100/20">
                <AlertCircle className="w-3 h-3" />
                {error}
            </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block body-sm font-medium text-general-80 mb-1.5">
            Tanggal Mulai
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            min={minDate}
            max={today}
            onChange={(e) => handleDateInput(e, setStartDate)}
            // UBAH: Logic class border merah jika error
            className={`w-full px-3 py-2 bg-general-20 border rounded-lg focus:ring-2 body-sm transition-colors 
                ${isDateError 
                    ? "border-red-100 focus:border-red-100 focus:ring-red-100 text-red-100" 
                    : "border-general-30 focus:border-blue-100 focus:ring-blue-100 text-general-100"
                }`}
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block body-sm font-medium text-general-80 mb-1.5">
            Tanggal Akhir
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            min={startDate || minDate} // Min otomatis menyesuaikan start date
            max={today}
            onChange={(e) => handleDateInput(e, setEndDate)}
            className={`w-full px-3 py-2 bg-general-20 border rounded-lg focus:ring-2 body-sm transition-colors 
                ${isDateError 
                    ? "border-red-100 focus:border-red-100 focus:ring-red-100 text-red-100" 
                    : "border-general-30 focus:border-blue-100 focus:ring-blue-100 text-general-100"
                }`}
          />
        </div>

        {/* Province */}
        <div>
          <label htmlFor="province" className="block body-sm font-medium text-general-80 mb-1.5">
            Provinsi
          </label>
          <div className="relative">
            <select
              id="province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full px-3 py-2 bg-general-20 border border-general-30 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 text-general-100 body-sm transition-colors appearance-none cursor-pointer"
            >
              {provinces.map((prov) => (
                <option key={prov.value} value={prov.value}>
                  {prov.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-general-60">
                <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block body-sm font-medium text-general-80 mb-1.5">
            Kategori
          </label>
          <div className="relative">
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-general-20 border border-general-30 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 text-general-100 body-sm transition-colors appearance-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-general-60">
                <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleSearch}
            className="w-full px-4 py-2 bg-blue-100 hover:bg-blue-90 text-general-20 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 body-sm font-heading shadow-sm active:scale-95"
          >
            <Search className="w-4 h-4" />
            Cari Data
          </button>
        </div>
      </div>
    </div>
  )
}