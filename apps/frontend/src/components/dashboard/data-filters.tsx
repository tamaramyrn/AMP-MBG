import { useState, useCallback, memo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, ChevronDown, AlertCircle, Loader2 } from "lucide-react"
import { locationsService } from "@/services/locations"
import { categoriesService } from "@/services/categories"

export interface FilterValues {
  startDate: string
  endDate: string
  province: string
  category: string
}

interface DataFiltersProps {
  onFilter: (filters: FilterValues) => void
}

function DataFiltersComponent({ onFilter }: DataFiltersProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [province, setProvince] = useState("")
  const [category, setCategory] = useState("")
  const [error, setError] = useState("")

  // Fetch provinces from API
  const { data: provincesData, isLoading: provincesLoading } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const response = await locationsService.getProvinces()
      return response.data
    },
    staleTime: 1000 * 60 * 60,
  })

  // Fetch categories from API
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoriesService.getCategories()
      return response.data
    },
    staleTime: 1000 * 60 * 60,
  })

  const provinces = provincesData || []
  const categories = categoriesData || []

  // --- SETUP BATAS TANGGAL ---
  const today = new Date().toISOString().split("T")[0] // Hari ini (YYYY-MM-DD)
  const minDate = "2024-01-01" // Batas paling lampau

  const handleDateInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
      const val = e.target.value
      if (val) {
        const year = val.split("-")[0]
        if (year.length > 4) return
      }
      setter(val)
      setError("")
    },
    []
  )

  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleDateInput(e, setStartDate), [handleDateInput])
  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => handleDateInput(e, setEndDate), [handleDateInput])
  const handleProvinceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setProvince(e.target.value), [])
  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value), [])

  const handleSearch = useCallback(() => {
    if (startDate && endDate && startDate > endDate) {
      setError("Tanggal mulai tidak boleh lebih besar dari tanggal akhir.")
      return
    }
    if ((startDate && startDate > today) || (endDate && endDate > today)) {
      setError("Tanggal tidak boleh melebihi hari ini.")
      return
    }
    setError("")
    onFilter({ startDate, endDate, province, category })
  }, [startDate, endDate, province, category, today, onFilter])

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
            onChange={handleStartDateChange}
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
            onChange={handleEndDateChange}
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
              onChange={handleProvinceChange}
              disabled={provincesLoading}
              className="w-full px-3 py-2 bg-general-20 border border-general-30 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 text-general-100 body-sm transition-colors appearance-none cursor-pointer disabled:bg-general-30/30 disabled:cursor-not-allowed"
            >
              <option value="">
                {provincesLoading ? "Memuat..." : "Semua Provinsi"}
              </option>
              {provinces.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-general-60">
              {provincesLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
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
              onChange={handleCategoryChange}
              disabled={categoriesLoading}
              className="w-full px-3 py-2 bg-general-20 border border-general-30 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-100 text-general-100 body-sm transition-colors appearance-none cursor-pointer disabled:bg-general-30/30 disabled:cursor-not-allowed"
            >
              <option value="">
                {categoriesLoading ? "Memuat..." : "Semua Kategori"}
              </option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-general-60">
              {categoriesLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
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

export const DataFilters = memo(DataFiltersComponent)
