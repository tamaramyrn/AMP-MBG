import { ShieldCheck, LineChart, Megaphone } from "lucide-react"

export function KeyBenefits() {
  const benefits = [
    {
      // UPDATE: Icon size responsive (w-8 di mobile, w-10 di desktop)
      icon: <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-orange-100" />,
      title: "Identitas Tetap Rahasia",
      desc: "Lapor tanpa rasa khawatir karena identitas Anda kami lindungi sepenuhnya.", 
    },
    {
      icon: <LineChart className="w-8 h-8 md:w-10 md:h-10 text-orange-100" />,
      title: "Pantau Real-time",
      desc: "Setiap laporan yang masuk langsung muncul di dashboard publik.",
    },
    {
      icon: <Megaphone className="w-8 h-8 md:w-10 md:h-10 text-orange-100" />,
      title: "Eskalasi Cepat", 
      desc: "Laporan terverifikasi akan langsung disalurkan ke pihak yang berwenang.",
    },
  ]

  return (
    <section className="py-12 md:py-20 bg-general-20">
      
      {/* CONTAINER FLUID:
          - Mobile: px-5
          - Tablet: px-8
          - Laptop: px-16
          - Monitor Besar: px-24
      */}
      <div className="w-full mx-auto px-5 sm:px-8 lg:px-16 xl:px-24">
        
        <div className="text-center mb-8 md:mb-12">
          {/* Typography: text-2xl (mobile) -> text-3xl (desktop) */}
          <h2 className="text-2xl md:text-3xl font-bold text-general-100">Mengapa Melapor di Sini?</h2>
        </div>
        
        {/* GRID SYSTEM:
            - grid-cols-1: Mobile (Stacked)
            - md:grid-cols-3: Tablet/Desktop (3 kolom sejajar)
            - gap-6 (mobile) -> gap-8 (desktop)
        */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {benefits.map((item, idx) => (
            <div 
              key={idx} 
              // Card Styling:
              // - p-6 (mobile) -> p-8 (desktop)
              // - h-full agar semua kartu tingginya sama
              className="flex flex-col items-center text-center p-6 md:p-8 rounded-2xl bg-orange-20 shadow-sm border border-general-30/50 hover:border-orange-40 transition-colors duration-300 h-full"
            >
              {/* Icon Container: p-3 (mobile) -> p-4 (desktop) */}
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-orange-40 rounded-full shrink-0">
                {item.icon}
              </div>
              
              {/* Title: text-lg (mobile) -> text-xl (desktop) */}
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-general-100">
                {item.title}
              </h3>
              
              {/* Desc: text-sm (mobile) -> text-base (desktop) */}
              <p className="text-general-70 leading-relaxed text-sm md:text-base">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}