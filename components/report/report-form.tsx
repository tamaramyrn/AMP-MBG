"use client"

import { useState } from "react"
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
  location: string
  // Step 2
  description: string
  files: File[]
  // Step 3
  relation: string
  agreement: boolean
}

const initialFormData: ReportFormData = {
  category: "",
  date: "",
  province: "",
  city: "",
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
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Laporan Berhasil Dikirim!</h2>
        <p className="text-gray-600 mb-6">
          Terima kasih atas partisipasi Anda. Tim kami akan memverifikasi laporan Anda dalam waktu 1-3 hari kerja.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
        >
          Kembali ke Beranda
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Step Indicators */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    currentStep >= step.id ? "bg-primary text-white" : "bg-gray-200 text-gray-600",
                  )}
                >
                  {step.id}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={cn("text-sm font-medium", currentStep >= step.id ? "text-primary" : "text-gray-500")}>
                    {step.title}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className={cn("h-1 rounded", currentStep > step.id ? "bg-primary" : "bg-gray-200")} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            Langkah {currentStep} - {steps[currentStep - 1].subtitle}
          </h2>
        </div>

        {currentStep === 1 && <StepLocationCategory formData={formData} updateFormData={updateFormData} />}
        {currentStep === 2 && <StepChronologyEvidence formData={formData} updateFormData={updateFormData} />}
        {currentStep === 3 && <StepIdentityConfirmation formData={formData} updateFormData={updateFormData} />}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
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
              className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
            >
              Selanjutnya
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.agreement}
              className="px-8 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Laporan"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
