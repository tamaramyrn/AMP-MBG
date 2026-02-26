const BASE_URL = "https://lapormbg.com"

function breadcrumb(name: string, path: string) {
  const items = [
    { "@type": "ListItem" as const, position: 1, name: "Beranda", item: BASE_URL },
  ]
  if (path !== "/") {
    items.push({ "@type": "ListItem" as const, position: 2, name, item: `${BASE_URL}${path}` })
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  }
}

export const SEO = {
  home: {
    title: "Kawal Program Makan Bergizi Gratis",
    description:
      "Platform independen untuk mengawal dan melaporkan pelaksanaan Program Makan Bergizi Gratis di Indonesia. Transparan, akuntabel, dan partisipatif.",
    path: "/",
    jsonLd: [
      breadcrumb("Beranda", "/"),
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "AMP MBG",
        url: BASE_URL,
        description: "Platform independen untuk mengawal Program Makan Bergizi Gratis di Indonesia.",
        inLanguage: "id",
      },
    ],
  },
  tentangKami: {
    title: "Tentang Kami",
    description:
      "Kenali AMP MBG, asosiasi masyarakat yang mengawal transparansi Program Makan Bergizi Gratis di Indonesia.",
    path: "/tentang-kami/",
    jsonLd: [
      breadcrumb("Tentang Kami", "/tentang-kami/"),
      {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "Tentang AMP MBG",
        description: "Kenali AMP MBG, asosiasi masyarakat yang mengawal transparansi Program Makan Bergizi Gratis di Indonesia.",
        mainEntity: { "@type": "Organization", name: "AMP MBG", url: BASE_URL },
      },
    ],
  },
  caraKerja: {
    title: "Cara Kerja Pelaporan",
    description:
      "Pelajari 4 langkah mudah untuk melaporkan temuan Program Makan Bergizi Gratis secara aman dan terverifikasi.",
    path: "/cara-kerja/",
    jsonLd: [
      breadcrumb("Cara Kerja", "/cara-kerja/"),
      {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "Cara Melaporkan Temuan Program MBG",
        description: "4 langkah mudah untuk melaporkan temuan Program Makan Bergizi Gratis.",
        step: [
          { "@type": "HowToStep", position: 1, name: "Dokumentasi", text: "Ambil foto atau video sebagai bukti temuan di lapangan." },
          { "@type": "HowToStep", position: 2, name: "Laporkan", text: "Isi formulir laporan melalui website dengan lengkap." },
          { "@type": "HowToStep", position: 3, name: "Verifikasi", text: "Tim kami akan memverifikasi keakuratan data yang dilaporkan." },
          { "@type": "HowToStep", position: 4, name: "Tindak Lanjut", text: "Laporan diteruskan ke pihak berwenang untuk ditindaklanjuti." },
        ],
      },
    ],
  },
  dataLaporan: {
    title: "Data & Statistik Laporan",
    description:
      "Pantau data dan statistik laporan masyarakat terkait Program Makan Bergizi Gratis secara transparan dan real-time.",
    path: "/data-laporan/",
    jsonLd: [
      breadcrumb("Data Laporan", "/data-laporan/"),
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Data & Statistik Laporan MBG",
        description: "Pantau data dan statistik laporan masyarakat terkait Program Makan Bergizi Gratis secara transparan dan real-time.",
        mainEntity: {
          "@type": "Dataset",
          name: "Laporan Masyarakat Program MBG",
          description: "Kumpulan data laporan masyarakat mengenai pelaksanaan Program Makan Bergizi Gratis.",
        },
      },
    ],
  },
  lapor: {
    title: "Formulir Pelaporan MBG",
    description:
      "Laporkan temuan ketidaksesuaian pelaksanaan Program Makan Bergizi Gratis untuk ditindaklanjuti.",
    path: "/lapor/",
    jsonLd: [breadcrumb("Formulir Pelaporan", "/lapor/")],
  },
  daftarAnggota: {
    title: "Daftar Anggota",
    description:
      "Daftarkan organisasi Anda sebagai anggota resmi AMP MBG untuk berkontribusi dalam pengawasan Program Makan Bergizi Gratis.",
    path: "/daftar-anggota/",
    jsonLd: [breadcrumb("Daftar Anggota", "/daftar-anggota/")],
  },
  kebutuhanDapur: {
    title: "Pusat Kebutuhan Dapur",
    description:
      "Temukan solusi profesional untuk menunjang operasional SPPG dan dapur Program Makan Bergizi Gratis.",
    path: "/kebutuhan-dapur/",
    jsonLd: [breadcrumb("Kebutuhan Dapur", "/kebutuhan-dapur/")],
  },
}
