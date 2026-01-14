
import { useState, useMemo } from "react"
import { StepLocationCategory } from "./step-location-category"
import { StepChronologyEvidence } from "./step-chronology-evidence"
import { StepIdentityConfirmation } from "./step-identity-confirmation"
import { cn } from "@/lib/utils"

const steps = [
  { id: 1, title: "Lokasi & Kategori", subtitle: "Apa dan di mana kejadiannya?" },
  { id: 2, title: "Kronologi & Bukti", subtitle: "Bagaimana kronologi dan bukti kejadian?" },
  { id: 3, title: "Identitas & Konfirmasi", subtitle: "Data pelapor dan konfirmasi" },
]

export interface ReportFormData {
  // Step 1
  category: string
  date: string
  province: string
  city: string
  district: string
  location: string
  // Step 2
  description: string
  files: File[]
  // Step 3
  relation: string
  relationDetail?: string
  agreement: boolean
}

const initialFormData: ReportFormData = {
  category: "",
  date: "",
  province: "",
  city: "",
  district: "",
  location: "",
  description: "",
  files: [],
  relation: "",
  agreement: false,
}

export function ReportForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ReportFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // --- LOGIKA VALIDASI ---
  const isStepValid = useMemo(() => {
    if (currentStep === 1) {
      // Cek apakah semua field Step 1 terisi (termasuk district)
      return (
        formData.category &&
        formData.date &&
        formData.province &&
        formData.city &&
        formData.district &&
        formData.location
      )
    }
    if (currentStep === 2) {
      // Validasi Step 2: Deskripsi wajib diisi
      return formData.description.trim().length >= 50
    }
    if (currentStep === 3) {
      // Validasi Step 3: Wajib centang agreement dan isi hubungan
      return formData.relation && formData.agreement
    }
    return false
  }, [currentStep, formData])

  const updateFormData = (data: Partial<ReportFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulasi API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="bg-general-20 rounded-lg shadow-md border border-general-30 p-8 text-center">
        <div className="w-16 h-16 bg-blue-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="h3 text-general-100 mb-2">Laporan Berhasil Dikirim!</h2>
        <p className="body-md text-general-70 mb-6">
          Terima kasih atas partisipasi Anda. Tim kami akan memverifikasi laporan Anda.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-100 hover:bg-blue-90 text-general-20 font-medium rounded-lg transition-colors body-sm font-heading"
        >
          Kembali ke Beranda
        </a>
      </div>
    )
  }

  return (
    <div className="bg-general-20 rounded-lg shadow-md border border-general-30 overflow-hidden">
      {/* Step Indicators */}
      <div className="bg-general-20 border-b border-general-30 p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    // Active step styling
                    currentStep >= step.id 
                      ? "bg-blue-100 text-general-20" 
                      : "bg-general-30 text-general-70",
                  )}
                >
                  {step.id}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p 
                    className={cn(
                      "body-sm font-heading font-medium", 
                      // Text color styling
                      currentStep >= step.id ? "text-blue-100" : "text-general-60"
                    )}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div 
                    className={cn(
                      "h-1 rounded", 
                      // Connector line styling
                      currentStep > step.id ? "bg-blue-100" : "bg-general-30"
                    )} 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h2 className="h5 text-general-100">
            Langkah {currentStep} - {steps[currentStep - 1].subtitle}
          </h2>
        </div>

        {currentStep === 1 && <StepLocationCategory formData={formData} updateFormData={updateFormData} />}
        {currentStep === 2 && <StepChronologyEvidence formData={formData} updateFormData={updateFormData} />}
        {currentStep === 3 && <StepIdentityConfirmation formData={formData} updateFormData={updateFormData} />}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-general-30">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-5 py-2.5 border border-general-30 text-general-80 font-medium rounded-lg hover:bg-general-30 transition-colors body-sm"
            >
              Sebelumnya
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid} // <-- VALIDASI TOMBOL NEXT
              className="px-5 py-2.5 bg-blue-100 hover:bg-blue-90 text-general-20 font-medium rounded-lg transition-colors body-sm font-heading disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isStepValid} // <-- VALIDASI TOMBOL SUBMIT
              className="px-8 py-2.5 bg-blue-100 hover:bg-blue-90 text-general-20 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed body-sm font-heading"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Laporan"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}