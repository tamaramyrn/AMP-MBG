import { memo, useCallback, useMemo, Suspense, lazy } from "react"
import { ChevronDown, AlertCircle, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { ReportFormData, Timezone } from "./report-form"
import { categoriesService } from "@/services/categories"
import { locationsService } from "@/services/locations"
import { cn } from "@/lib/utils" // <--- IMPORT ADDED

const LocationMapPreview = lazy(() =>
  import("./location-map-preview").then((m) => ({ default: m.LocationMapPreview }))
)

interface StepLocationCategoryProps {
  formData: ReportFormData
  updateFormData: (data: Partial<ReportFormData>) => void
}

const TIMEZONES: { value: Timezone; label: string; offset: number }[] = [
  { value: "WIB", label: "WIB", offset: 7 },
  { value: "WITA", label: "WITA", offset: 8 },
  { value: "WIT", label: "WIT", offset: 9 },
]

function StepLocationCategoryComponent({ formData, updateFormData }: StepLocationCategoryProps) {
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"], queryFn: async () => (await categoriesService.getCategories()).data, staleTime: 3600000,
  })
  const { data: provincesData, isLoading: provincesLoading } = useQuery({
    queryKey: ["provinces"], queryFn: async () => (await locationsService.getProvinces()).data, staleTime: 3600000,
  })
  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ["cities", formData.province], queryFn: async () => formData.province ? (await locationsService.getCities(formData.province)).data : [], enabled: !!formData.province, staleTime: 1800000,
  })
  const { data: districtsData, isLoading: districtsLoading } = useQuery({
    queryKey: ["districts", formData.city], queryFn: async () => formData.city ? (await locationsService.getDistricts(formData.city)).data : [], enabled: !!formData.city, staleTime: 1800000,
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

  const { todayInTz, isDateError, isTimeError } = useMemo(() => {
    const now = new Date()
    const tz = TIMEZONES.find((t) => t.value === formData.timezone) || TIMEZONES[0]
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    const tzDate = new Date(utc + tz.offset * 3600000)
    return {
      todayInTz: tzDate.toISOString().split("T")[0],
      isDateFuture: formData.date > tzDate.toISOString().split("T")[0],
      isYearInvalid: formData.date.split("-")[0].length > 4,
      isDateError: formData.date > tzDate.toISOString().split("T")[0] || (formData.date < MIN_DATE && formData.date !== "") || formData.date.split("-")[0].length > 4,
      isTimeError: formData.date === tzDate.toISOString().split("T")[0] && formData.time > tzDate.toTimeString().slice(0, 5),
    }
  }, [formData.date, formData.time, formData.timezone])

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const wordCount = inputValue.trim().split(/\s+/).filter(Boolean).length
    if (wordCount <= MAX_TITLE_WORDS || (wordCount === MAX_TITLE_WORDS + 1 && !inputValue.endsWith(" "))) {
      updateFormData({ title: inputValue })
    }
  }, [updateFormData])

  const commonInputClass = "w-full px-4 py-3 bg-white border rounded-xl text-general-100 placeholder:text-general-40 focus:outline-none focus:ring-2 focus:ring-blue-100/50 focus:border-blue-100 transition-all duration-200 disabled:bg-general-20 disabled:cursor-not-allowed"
  const labelClass = "block text-sm font-bold text-general-80 mb-2"

  // Location Names for Map
  const locationNames = useMemo(() => ({
    province: provinces.find((p) => p.id === formData.province)?.name || "",
    city: availableCities.find((c) => c.id === formData.city)?.name || "",
    district: availableDistricts.find((d) => d.id === formData.district)?.name || "",
  }), [provinces, availableCities, availableDistricts, formData.province, formData.city, formData.district])

  return (
    <div className="space-y-6">
      {/* JUDUL */}
      <div>
        <div className="flex justify-between items-end mb-2">
          <label htmlFor="title" className={labelClass}>Judul Laporan <span className="text-red-100">*</span></label>
          <span className={`text-xs font-medium ${currentTitleWords === MAX_TITLE_WORDS ? 'text-red-100' : 'text-general-60'}`}>
            {currentTitleWords}/{MAX_TITLE_WORDS} Kata
          </span>
        </div>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={handleTitleChange}
          placeholder="Contoh: Nasi basi di SDN 01 Pagi"
          className={cn(commonInputClass, currentTitleWords >= MAX_TITLE_WORDS ? "border-red-100 focus:border-red-100 focus:ring-red-100/30" : "border-general-30")}
        />
      </div>

      {/* KATEGORI */}
      <div>
        <label htmlFor="category" className={labelClass}>Kategori Masalah <span className="text-red-100">*</span></label>
        <div className="relative">
          <select
            id="category"
            value={formData.category}
            onChange={(e) => updateFormData({ category: e.target.value })}
            disabled={categoriesLoading}
            className={cn(commonInputClass, "border-general-30 appearance-none pr-10 cursor-pointer")}
          >
            <option value="">{categoriesLoading ? "Memuat..." : "Pilih Kategori"}</option>
            {categories.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-general-50 pointer-events-none" />
        </div>
      </div>

      {/* TANGGAL & WAKTU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="date" className={labelClass}>Tanggal Kejadian <span className="text-red-100">*</span></label>
          <input
            type="date"
            id="date"
            value={formData.date}
            min={MIN_DATE}
            max={todayInTz}
            onChange={(e) => updateFormData({ date: e.target.value })}
            className={cn(commonInputClass, isDateError ? "border-red-100 focus:ring-red-100/30" : "border-general-30")}
          />
          {isDateError && <p className="text-xs text-red-100 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Tanggal tidak valid</p>}
        </div>
        <div>
          <label htmlFor="time" className={labelClass}>Waktu Kejadian <span className="text-red-100">*</span></label>
          <div className="flex gap-3">
            <input
              type="time"
              id="time"
              value={formData.time}
              onChange={(e) => updateFormData({ time: e.target.value })}
              className={cn(commonInputClass, isTimeError ? "border-red-100" : "border-general-30")}
            />
            <div className="relative w-32 shrink-0">
                <select
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => updateFormData({ timezone: e.target.value as Timezone })}
                    className={cn(commonInputClass, "border-general-30 appearance-none pr-8 cursor-pointer")}
                >
                    {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-general-50 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* WILAYAH */}
      <div className="space-y-4 pt-2">
        <p className="text-sm font-bold text-general-100 border-b border-general-30 pb-2">Detail Lokasi</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
                <label className={labelClass}>Provinsi <span className="text-red-100">*</span></label>
                <select
                    value={formData.province}
                    onChange={(e) => updateFormData({ province: e.target.value, city: "", district: "", latitude: undefined, longitude: undefined })}
                    disabled={provincesLoading}
                    className={cn(commonInputClass, "border-general-30 appearance-none pr-10 cursor-pointer")}
                >
                    <option value="">{provincesLoading ? "Memuat..." : "Pilih Provinsi"}</option>
                    {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-[42px] w-5 h-5 text-general-50 pointer-events-none" />
            </div>
            <div className="relative">
                <label className={labelClass}>Kota/Kabupaten <span className="text-red-100">*</span></label>
                <select
                    value={formData.city}
                    onChange={(e) => updateFormData({ city: e.target.value, district: "", latitude: undefined, longitude: undefined })}
                    disabled={!formData.province || citiesLoading}
                    className={cn(commonInputClass, "border-general-30 appearance-none pr-10 cursor-pointer")}
                >
                    <option value="">{citiesLoading ? "Memuat..." : "Pilih Kota/Kab"}</option>
                    {availableCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-[42px] w-5 h-5 text-general-50 pointer-events-none" />
            </div>
            <div className="relative md:col-span-2">
                <label className={labelClass}>Kecamatan <span className="text-red-100">*</span></label>
                <select
                    value={formData.district}
                    onChange={(e) => updateFormData({ district: e.target.value, latitude: undefined, longitude: undefined })}
                    disabled={!formData.city || districtsLoading}
                    className={cn(commonInputClass, "border-general-30 appearance-none pr-10 cursor-pointer")}
                >
                    <option value="">{districtsLoading ? "Memuat..." : "Pilih Kecamatan"}</option>
                    {availableDistricts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-[42px] w-5 h-5 text-general-50 pointer-events-none" />
            </div>
        </div>
      </div>

      {/* LOKASI SPESIFIK */}
      <div>
        <div className="flex justify-between items-end mb-2">
            <label htmlFor="location" className={labelClass}>Lokasi Spesifik <span className="text-red-100">*</span></label>
            <span className="text-xs text-general-60 font-medium">{currentLength}/{MAX_LOCATION_LENGTH}</span>
        </div>
        <input
          type="text"
          id="location"
          value={formData.location}
          onChange={(e) => e.target.value.length <= MAX_LOCATION_LENGTH && updateFormData({ location: e.target.value })}
          placeholder="Nama Sekolah / Gedung / Jalan"
          className={cn(commonInputClass, "border-general-30")}
        />
      </div>

      {/* MAP PREVIEW */}
      {formData.district && (
        <div className="pt-2">
            <label className={labelClass}>Titik Peta (Opsional)</label>
            <Suspense fallback={<div className="h-[240px] bg-general-20 rounded-xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-100" /></div>}>
                <LocationMapPreview
                    provinceName={locationNames.province}
                    cityName={locationNames.city}
                    districtName={locationNames.district}
                    specificLocation={formData.location}
                    onCoordinatesChange={(lat, lng) => updateFormData({ latitude: lat, longitude: lng })}
                />
            </Suspense>
        </div>
      )}
    </div>
  )
}

export const StepLocationCategory = memo(StepLocationCategoryComponent)