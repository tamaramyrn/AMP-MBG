import { memo, useCallback, useMemo, Suspense, lazy } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { ReportFormData, Timezone } from "./report-form"
import type { ResolvedAddress } from "./location-map-preview"
import { categoriesService } from "@/services/categories"
import { locationsService } from "@/services/locations"
import { CustomSelect } from "@/components/ui/custom-select"
import { cn } from "@/lib/utils"

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
  const queryClient = useQueryClient()
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

  const categories = useMemo(() => categoriesData || [], [categoriesData])
  const provinces = useMemo(() => provincesData || [], [provincesData])
  const availableCities = useMemo(() => citiesData || [], [citiesData])
  const availableDistricts = useMemo(() => districtsData || [], [districtsData])

  const MAX_TITLE_WORDS = 10
  const MIN_TITLE_CHARS = 10
  const MAX_LOCATION_LENGTH = 100
  const MIN_DATE = "2024-01-01"

  const currentTitleWords = useMemo(
    () => (formData.title ? formData.title.trim().split(/\s+/).filter(Boolean).length : 0),
    [formData.title]
  )
  
  const isTitleTooShort = formData.title.length > 0 && formData.title.length < MIN_TITLE_CHARS
  
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
    const currentWords = inputValue.trim().split(/\s+/).filter(Boolean)
    const wordCount = currentWords.length
    
    const endsWithSpace = inputValue.endsWith(" ")

    if (wordCount >= MAX_TITLE_WORDS && endsWithSpace) {
      return
    }

    if (wordCount <= MAX_TITLE_WORDS) {
      updateFormData({ title: inputValue })
    }
  }, [updateFormData, MAX_TITLE_WORDS])

  const commonInputClass ="w-full h-[50px] px-4 py-3 bg-white border rounded-xl text-general-100 placeholder:text-general-40 focus:outline-none focus:ring-2 focus:ring-blue-100/50 focus:border-blue-100 transition-all duration-200 disabled:bg-general-20 disabled:cursor-not-allowed"
  const labelClass = "block text-sm font-bold text-general-80 mb-2"

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex justify-between items-end mb-2">
          <label htmlFor="title" className={labelClass}>Judul Laporan <span className="text-red-100">*</span></label>
          <span className={cn("text-xs font-medium", 
            (currentTitleWords === MAX_TITLE_WORDS || isTitleTooShort) ? 'text-red-100' : 'text-general-60'
          )}>
            {isTitleTooShort ? `Min. ${MIN_TITLE_CHARS} Karakter` : `${currentTitleWords}/${MAX_TITLE_WORDS} Kata`}
          </span>
        </div>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={handleTitleChange}
          placeholder="Contoh: Nasi basi di SDN 01 Pagi"
          className={cn(commonInputClass, 
            (currentTitleWords >= MAX_TITLE_WORDS || isTitleTooShort) 
              ? "border-red-100 focus:border-red-100 focus:ring-red-100/30" 
              : "border-general-30"
          )}
        />
        {isTitleTooShort && (
          <p className="text-xs text-red-100 mt-1.5 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-3 h-3"/> Judul terlalu pendek (minimal {MIN_TITLE_CHARS} karakter)
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className={labelClass}>Kategori Masalah <span className="text-red-100">*</span></label>
        <div className="relative z-50">
          <CustomSelect
            value={formData.category}
            onChange={(val) => updateFormData({ category: val })}
            options={categories}
            loading={categoriesLoading}
            placeholder="Pilih Kategori"
          />
        </div>
      </div>

      {/* Date and time */}
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
            className={cn(commonInputClass, "min-h-[50px]", isDateError ? "border-red-100 focus:ring-red-100/30" : "border-general-30")}
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
              className={cn(commonInputClass, "min-h-[50px]", isTimeError ? "border-red-100" : "border-general-30")}
            />
            <div className="relative w-32 shrink-0 z-40">
              <CustomSelect
                value={formData.timezone}
                onChange={(val) => updateFormData({ timezone: val as Timezone })}
                options={TIMEZONES}
                placeholder="WIB"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4 pt-2">
        <p className="text-sm font-bold text-general-100 border-b border-general-30 pb-2">Detail Lokasi</p>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative z-30">
                <label className={labelClass}>Provinsi <span className="text-red-100">*</span></label>
                <CustomSelect
                    value={formData.province}
                    onChange={(val) => updateFormData({ province: val, city: "", district: "", latitude: undefined, longitude: undefined })}
                    options={provinces}
                    loading={provincesLoading}
                    placeholder="Pilih Provinsi"
                />
            </div>
            <div className="relative z-20">
                <label className={labelClass}>Kota/Kabupaten <span className="text-red-100">*</span></label>
                <CustomSelect
                    value={formData.city}
                    onChange={(val) => updateFormData({ city: val, district: "", latitude: undefined, longitude: undefined })}
                    options={availableCities}
                    loading={citiesLoading}
                    disabled={!formData.province}
                    placeholder="Pilih Kota/Kab"
                />
            </div>
            <div className="relative md:col-span-2 z-10">
                <label className={labelClass}>Kecamatan <span className="text-red-100">*</span></label>
                <CustomSelect
                    value={formData.district}
                    onChange={(val) => updateFormData({ district: val, latitude: undefined, longitude: undefined })}
                    options={availableDistricts}
                    loading={districtsLoading}
                    disabled={!formData.city}
                    placeholder="Pilih Kecamatan"
                />
            </div>
        </div>

        <div>
          <label className={labelClass}>Cari di Peta</label>
          <p className="text-xs text-general-50 mb-2">Cari lokasi di peta untuk mengisi provinsi, kota, dan kecamatan secara otomatis.</p>
          <Suspense fallback={<div className="h-[400px] bg-general-20 rounded-xl flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-100" /></div>}>
              <LocationMapPreview
                  onCoordinatesChange={(lat, lng, address) => updateFormData({ latitude: lat, longitude: lng, addressDetail: address || "" })}
                  onAddressResolved={async (addr: ResolvedAddress) => {
                    const result = await locationsService.lookupByName(
                      addr.state, addr.city || addr.county, addr.suburb || addr.village
                    )
                    const d = result.data
                    const updates: Partial<ReportFormData> = {}
                    if (d.provinceId) {
                      updates.province = d.provinceId
                      await queryClient.fetchQuery({
                        queryKey: ["cities", d.provinceId],
                        queryFn: async () => (await locationsService.getCities(d.provinceId!)).data,
                        staleTime: 1800000,
                      })
                    }
                    if (d.cityId) {
                      updates.city = d.cityId
                      await queryClient.fetchQuery({
                        queryKey: ["districts", d.cityId],
                        queryFn: async () => (await locationsService.getDistricts(d.cityId!)).data,
                        staleTime: 1800000,
                      })
                    }
                    if (d.districtId) updates.district = d.districtId
                    if (Object.keys(updates).length > 0) updateFormData(updates)
                  }}
              />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export const StepLocationCategory = memo(StepLocationCategoryComponent)