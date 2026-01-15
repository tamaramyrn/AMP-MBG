import { memo } from "react"

export interface ReportData {
  id: string
  category: string
  // categoryVariant tidak perlu dipakai lagi di sini, tapi dibiarkan di interface agar tidak error di parent
  categoryVariant: "danger" | "warning" | "info" | "success" | "neutral"
  title: string
  location: string
  date: string
  reporter: string
}

interface ReportCardProps {
  report: ReportData
}

function ReportCardComponent({ report }: ReportCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-300 p-5 hover:shadow-md transition-shadow">
      <div className="mb-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-20 text-red-90 border border-red-30">
          {report.category}
        </span>
      </div>
      
      <h3 className="font-bold text-gray-800 mb-4 text-base">{report.title}</h3>
      
      <div className="space-y-1 text-sm text-gray-600">
        <p>Lokasi: {report.location}</p>
        <p>Tanggal Kejadian: {report.date}</p>
        <p>Diunggah oleh: {report.reporter}</p>
      </div>
    </div>
  )
}

export const ReportCard = memo(ReportCardComponent)