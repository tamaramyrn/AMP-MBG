import { memo, useCallback, useMemo } from "react"
import { ChevronDown, AlertCircle, Clock, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { ReportFormData } from "./report-form"
import { categoriesService } from "@/services/categories"
import { locationsService } from "@/services/locations"

interface StepLocationCategoryProps {
  formData: ReportFormData
  updateFormData: (data: Partial<ReportFormData>) => void
}

function StepLocationCategoryComponent({ formData, updateFormData }: StepLocationCategoryProps) {
  // Fetch categories from API
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await categoriesService.getCategories()
      return response.data
    },
    staleTime: 1000 * 60 * 60,
  })

  // Fetch provinces from API
  const { data: provincesData, isLoading: provincesLoading } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const response = await locationsService.getProvinces()
      return response.data
    },
    staleTime: 1000 * 60 * 60,
  })

  // Fetch cities based on selected province
  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ["cities", formData.province],
    queryFn: async () => {
      if (!formData.province) return []
      const response = await locationsService.getCities(formData.province)
      return response.data
    },
    enabled: !!formData.province,
    staleTime: 1000 * 60 * 30,
  })

  // Fetch districts based on selected city
  const { data: districtsData, isLoading: districtsLoading } = useQuery({
    queryKey: ["districts", formData.city],
    queryFn: async () => {
      if (!formData.city) return []
      const response = await locationsService.getDistricts(formData.city)
      return response.data
    },
    enabled: !!formData.city,
    staleTime: 1000 * 60 * 30,
  })

  const categories = categoriesData || []
  const provinces = provincesData || []
  const availableCities = citiesData || []
  const availableDistricts = districtsData || []

  const MAX_TITLE_WORDS = 10
  const MAX_LOCATION_LENGTH = 100
  const MIN_DATE = "2024-01-01"

  const currentTitleWords = useMemo(
    () => (formData.title ? formData.title.trim().split(/\s+/).filter(Boolean).length : 0),
    [formData.title]
  )

  const currentLength = formData.location.length

  const { today, currentTimeString } = useMemo(() => {
    const now = new Date()
    return {
      today: now.toISOString().split("T")[0],
      currentTimeString: now.toTimeString().slice(0, 5),
    }
  }, [])

  const { isDateError, isDateFuture, isYearInvalid } = useMemo(() => {
    const isFuture = formData.date > today
    const isTooOld = formData.date < MIN_DATE && formData.date !== ""
    const isYearInv = formData.date.split("-")[0].length > 4
    return {
      isDateFuture: isFuture,
      isYearInvalid: isYearInv,
      isDateError: isFuture || isTooOld || isYearInv,
    }
  }, [formData.date, today])

  const isTimeError = formData.date === today && formData.time > currentTimeString

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const wordCount = inputValue.trim().split(/\s+/).filter(Boolean).length
      if (wordCount <= MAX_TITLE_WORDS) {
        updateFormData({ title: inputValue })
      } else {
        const isTrailingSpace = inputValue.endsWith(" ")
        if (wordCount === MAX_TITLE_WORDS + 1 && !isTrailingSpace) return
        updateFormData({ title: inputValue })
      }
    },
    [updateFormData]
  )

  const handleLocationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.length <= MAX_LOCATION_LENGTH) {
        updateFormData({ location: e.target.value })
      }
    },
    [updateFormData]
  )

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => updateFormData({ category: e.target.value }), [updateFormData])
  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => updateFormData({ date: e.target.value }), [updateFormData])
  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => updateFormData({ time: e.target.value }), [updateFormData])
  const handleProvinceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => updateFormData({ province: e.target.value, city: "", district: "" }), [updateFormData])
  const handleCityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => updateFormData({ city: e.target.value, district: "" }), [updateFormData])
  const handleDistrictChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => updateFormData({ district: e.target.value }), [updateFormData])

  return (
    <div className="space-y-6">
      
      {/* JUDUL LAPORAN (Maksimal 10 Kata) */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="title" className="block body-sm font-medium text-general-80">
            Judul Laporan <span className="text-red-100">*</span>
          </label>
          <span className={`text-xs ${currentTitleWords === MAX_TITLE_WORDS ? 'text-red-100 font-bold' : 'text-general-60'}`}>
            {currentTitleWords}/{MAX_TITLE_WORDS} Kata
          </span>
        </div>
        
        <input
          type="text"
          id="title"
          value={formData.title || ""}
          onChange={handleTitleChange}
          placeholder="Contoh: Keracunan Makanan Siswa SD Harapan Bangsa"
          className={`w-full px-4 py-3 bg-general-20 border rounded-lg text-general-100 focus:ring-2 transition-colors placeholder:text-general-40
            ${currentTitleWords > MAX_TITLE_WORDS
              ? 'border-red-100 focus:ring-red-100 focus:border-red-100'
              : 'border-general-30 focus:ring-green-100 focus:border-green-100'
            }`}
        />
        {currentTitleWords >= MAX_TITLE_WORDS && (
           <p className="text-xs text-general-50 mt-1">Maksimal 10 kata.</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block body-sm font-medium text-general-80 mb-2">
          Kategori Laporan <span className="text-red-100">*</span>
        </label>
        <div className="relative">
          <select
            id="category"
            value={formData.category}
            onChange={handleCategoryChange}
            disabled={categoriesLoading}
            className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg text-general-100 focus:ring-2 focus:ring-green-100 focus:border-green-100 transition-colors appearance-none cursor-pointer disabled:bg-general-30/30 disabled:cursor-not-allowed"
          >
            <option value="">
              {categoriesLoading ? "Memuat kategori..." : "Pilih kategori laporan"}
            </option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-general-60">
            {categoriesLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* Grid Tanggal & Waktu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
            <label htmlFor="date" className="block body-sm font-medium text-general-80 mb-2">
            Tanggal Kejadian <span className="text-red-100">*</span>
            </label>
            <div className="relative">
            <input
                type="date"
                id="date"
                lang="id-ID"
                value={formData.date}
                min={MIN_DATE}
                max={today}
                onChange={handleDateChange}
                className={`w-full px-4 py-3 bg-general-20 border rounded-lg text-general-100 focus:ring-2 transition-colors appearance-none relative z-10 
                ${isDateError 
                    ? 'border-red-100 focus:border-red-100 focus:ring-red-100' 
                    : 'border-general-30 focus:border-green-100 focus:ring-green-100'
                }`}
                style={{ colorScheme: "light" }} 
            />
            </div>
            {isDateError && (
                <div className="flex items-center gap-2 mt-2 text-red-100 animate-fadeIn">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-xs font-medium">
                        {isYearInvalid ? "Tahun tidak valid." : 
                        isDateFuture ? "Tanggal tidak boleh masa depan." : 
                        "Tanggal terlalu lampau."}
                    </p>
                </div>
            )}
        </div>

        <div>
            <label htmlFor="time" className="block body-sm font-medium text-general-80 mb-2">
            Jam Kejadian <span className="text-red-100">*</span>
            </label>
            <div className="relative">
                <input
                    type="time"
                    id="time"
                    value={formData.time}
                    onChange={handleTimeChange}
                    className={`w-full px-4 py-3 bg-general-20 border rounded-lg text-general-100 focus:ring-2 transition-colors appearance-none relative z-10
                    ${isTimeError 
                        ? 'border-red-100 focus:border-red-100 focus:ring-red-100' 
                        : 'border-general-30 focus:border-green-100 focus:ring-green-100'
                    }`}
                    style={{ colorScheme: "light" }}
                />
                 <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-general-60">
                    <Clock className="w-5 h-5" />
                </div>
            </div>
            {isTimeError ? (
                <div className="flex items-center gap-2 mt-2 text-red-100 animate-fadeIn">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-xs font-medium">Waktu belum terjadi.</p>
                </div>
            ) : (
                <p className="text-xs text-general-60 mt-2">Perkiraan waktu kejadian (WIB/WITA/WIT).</p>
            )}
        </div>
      </div>

      {/* Grid Wilayah */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="province" className="block body-sm font-medium text-general-80 mb-2">
            Provinsi <span className="text-red-100">*</span>
          </label>
          <div className="relative">
            <select
              id="province"
              value={formData.province}
              onChange={handleProvinceChange}
              disabled={provincesLoading}
              className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg text-general-100 focus:ring-2 focus:ring-green-100 focus:border-green-100 transition-colors appearance-none cursor-pointer disabled:bg-general-30/30 disabled:cursor-not-allowed"
            >
              <option value="">
                {provincesLoading ? "Memuat provinsi..." : "Pilih provinsi"}
              </option>
              {provinces.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-general-60">
              {provincesLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="city" className="block body-sm font-medium text-general-80 mb-2">
            Kota/Kabupaten <span className="text-red-100">*</span>
          </label>
          <div className="relative">
            <select
              id="city"
              value={formData.city}
              onChange={handleCityChange}
              disabled={!formData.province || citiesLoading}
              className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg text-general-100 focus:ring-2 focus:ring-green-100 focus:border-green-100 transition-colors appearance-none cursor-pointer disabled:bg-general-30/30 disabled:cursor-not-allowed disabled:text-general-60"
            >
              <option value="">
                {citiesLoading ? "Memuat kota..." : "Pilih kota/kab"}
              </option>
              {availableCities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-general-60">
              {citiesLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>
        </div>

         <div className="md:col-span-2">
          <label htmlFor="district" className="block body-sm font-medium text-general-80 mb-2">
            Kecamatan <span className="text-red-100">*</span>
          </label>
          <div className="relative">
            <select
              id="district"
              value={formData.district || ""} 
              onChange={handleDistrictChange}
              disabled={!formData.city || districtsLoading}
              className="w-full px-4 py-3 bg-general-20 border border-general-30 rounded-lg text-general-100 focus:ring-2 focus:ring-green-100 focus:border-green-100 transition-colors appearance-none cursor-pointer disabled:bg-general-30/30 disabled:cursor-not-allowed disabled:text-general-60"
            >
              <option value="">
                {districtsLoading ? "Memuat kecamatan..." : "Pilih kecamatan"}
              </option>
              {availableDistricts.length > 0 ? (
                availableDistricts.map((dist) => (
                  <option key={dist.id} value={dist.id}>
                    {dist.name}
                  </option>
                ))
              ) : (
                !districtsLoading && formData.city && (
                  <option value="" disabled>Data tidak tersedia</option>
                )
              )}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-general-60">
              {districtsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Specific Location */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="location" className="block body-sm font-medium text-general-80">
            Lokasi Spesifik <span className="text-red-100">*</span>
          </label>
          <span className={`text-xs ${currentLength === MAX_LOCATION_LENGTH ? 'text-red-100 font-bold' : 'text-general-60'}`}>
            {currentLength}/{MAX_LOCATION_LENGTH} Karakter
          </span>
        </div>
        
        <input
          type="text"
          id="location"
          value={formData.location}
          onChange={handleLocationChange}
          placeholder="Contoh: SDN Contoh 01, Jl. Merdeka No. 45"
          className={`w-full px-4 py-3 bg-general-20 border rounded-lg text-general-100 focus:ring-2 transition-colors placeholder:text-general-40
            ${currentLength === MAX_LOCATION_LENGTH
              ? 'border-red-100 focus:ring-red-100 focus:border-red-100'
              : 'border-general-30 focus:ring-green-100 focus:border-green-100'
            }`}
        />
        {currentLength === MAX_LOCATION_LENGTH && (
          <p className="text-xs text-red-100 mt-1">
            Batas maksimal karakter tercapai.
          </p>
        )}
      </div>
    </div>
  )
}

export const StepLocationCategory = memo(StepLocationCategoryComponent)
