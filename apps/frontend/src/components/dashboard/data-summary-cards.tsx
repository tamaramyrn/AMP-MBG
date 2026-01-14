import { FileText, MapPin, AlertTriangle, ShieldCheck } from "lucide-react"

const summaryData = [
  {
    icon: FileText,
    value: "1,247",
    label: "Total Laporan",
    color: "bg-blue-100 text-general-20",
  },
  {
    icon: MapPin,
    value: "342",
    label: "Kabupaten/Kota",
    color: "bg-green-100 text-general-20",
  },
  {
    icon: AlertTriangle,
    value: "89",
    label: "Laporan Berisiko Tinggi",
    color: "bg-red-100 text-general-20",
  },
  {
    icon: ShieldCheck,
    value: "Keracunan dan Masalah Kesehatan",
    label: "Kategori Terbanyak",
    color: "bg-orange-500 text-general-20",
  },
]

export function DataSummaryCards() {
  return (
    // 'items-stretch' adalah default grid, memastikan semua kartu tingginya sama
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 items-stretch">
      {summaryData.map((item, index) => (
        <div 
          key={index} 
          // UBAH DISINI:
          // 1. 'h-full': Agar kartu mengisi tinggi penuh grid
          // 2. 'flex items-center': Agar konten di dalamnya turun ke tengah vertikal
          className="bg-general-20 rounded-lg p-5 shadow-sm border border-general-30 hover:border-blue-30 transition-colors h-full flex items-center"
        >
          <div className="flex items-center gap-4 w-full">
            
            {/* Kotak Icon */}
            {/* Tambah 'shrink-0' agar icon tidak tergencet jika teks di sebelahnya panjang */}
            <div className={`p-3 rounded-lg shadow-sm shrink-0 ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            
            {/* Teks Info */}
            <div>
              <p className="body-md font-bold font-heading text-general-100 leading-tight">
                {item.value}
              </p>
              <p className="text-sm text-general-70 body-sm mt-0.5">
                {item.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}