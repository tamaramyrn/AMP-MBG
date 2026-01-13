import { FileText, MapPin, AlertTriangle, ShieldCheck } from "lucide-react"

const summaryData = [
  {
    icon: FileText,
    value: "1,247",
    label: "Total Laporan",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: MapPin,
    value: "342",
    label: "Kabupaten/Kota",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: AlertTriangle,
    value: "89",
    label: "Laporan Berisiko Tinggi",
    color: "bg-red-100 text-red-600",
  },
  {
    icon: ShieldCheck,
    value: "Keamanan Pangan",
    label: "Kategori Terbanyak",
    color: "bg-yellow-100 text-yellow-600",
  },
]

export function DataSummaryCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {summaryData.map((item, index) => (
        <div key={index} className="bg-white rounded-lg p-5 shadow-md border border-gray-200">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">{item.value}</p>
              <p className="text-sm text-gray-600">{item.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
