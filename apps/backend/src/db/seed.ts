import { db } from "./index"
import { provinces, cities, districts, users, reports, mbgSchedules } from "./schema"
import { sql, eq } from "drizzle-orm"
import { hashPassword } from "../lib/password"

function parseCSV(content: string): { id: string; name: string }[] {
  const lines = content.trim().split("\n")
  const result: { id: string; name: string }[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/"([^"]+)",(.+)/)
    if (match) {
      result.push({ id: match[1], name: match[2].trim() })
    }
  }

  return result
}

async function seed() {
  console.log("Seeding database...")

  const dataPath = new URL(".", import.meta.url).pathname

  const provincesFile = Bun.file(`${dataPath}/provinsi.csv`)
  const citiesFile = Bun.file(`${dataPath}/kabupaten_kota.csv`)
  const districtsFile = Bun.file(`${dataPath}/kecamatan.csv`)

  const provincesData = parseCSV(await provincesFile.text())
  const citiesData = parseCSV(await citiesFile.text())
  const districtsData = parseCSV(await districtsFile.text())

  console.log(`Inserting ${provincesData.length} provinces...`)
  const provValues = provincesData.map((p) => ({ id: p.id, name: p.name }))
  for (let i = 0; i < provValues.length; i += 100) {
    const batch = provValues.slice(i, i + 100)
    await db.insert(provinces).values(batch).onConflictDoNothing()
  }

  console.log(`Inserting ${citiesData.length} cities...`)
  const cityValues = citiesData.map((c) => ({
    id: c.id,
    provinceId: c.id.split(".")[0],
    name: c.name,
  }))
  for (let i = 0; i < cityValues.length; i += 100) {
    const batch = cityValues.slice(i, i + 100)
    await db.insert(cities).values(batch).onConflictDoNothing()
  }

  console.log(`Inserting ${districtsData.length} districts...`)
  const distValues = districtsData.map((d) => {
    const parts = d.id.split(".")
    return { id: d.id, cityId: `${parts[0]}.${parts[1]}`, name: d.name }
  })
  for (let i = 0; i < distValues.length; i += 100) {
    const batch = distValues.slice(i, i + 100)
    await db.insert(districts).values(batch).onConflictDoNothing()
  }

  const [provCount] = await db.select({ count: sql<number>`count(*)` }).from(provinces)
  const [cityCount] = await db.select({ count: sql<number>`count(*)` }).from(cities)
  const [distCount] = await db.select({ count: sql<number>`count(*)` }).from(districts)

  // Create default admin user
  console.log("Creating users...")
  const adminEmail = "admin@ampmbg.id"
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  })

  let adminId: string
  if (!existingAdmin) {
    const hashedPassword = await hashPassword("Admin@123!")
    const [admin] = await db.insert(users).values({
      nik: "0000000000000000",
      email: adminEmail,
      phone: "+62812345678901",
      password: hashedPassword,
      name: "Administrator",
      role: "admin",
      isVerified: true,
      isActive: true,
    }).returning()
    adminId = admin.id
    console.log("- Admin: admin@ampmbg.id / Admin@123!")
  } else {
    adminId = existingAdmin.id
    console.log("- Admin already exists")
  }

  // Create public test users
  const testUsers = [
    { nik: "3201234567890001", email: "budi@example.com", phone: "+62812000001", name: "Budi Santoso", reportCount: 5, verifiedReportCount: 4 },
    { nik: "3201234567890002", email: "siti@example.com", phone: "+62812000002", name: "Siti Rahayu", reportCount: 3, verifiedReportCount: 2 },
    { nik: "3201234567890003", email: "ahmad@example.com", phone: "+62812000003", name: "Ahmad Hidayat", reportCount: 2, verifiedReportCount: 1 },
    { nik: "3201234567890004", email: "dewi@example.com", phone: "+62812000004", name: "Dewi Lestari", reportCount: 1, verifiedReportCount: 0 },
    { nik: "3201234567890005", email: "rudi@example.com", phone: "+62812000005", name: "Rudi Hermawan", reportCount: 4, verifiedReportCount: 3 },
  ]

  const userIds: string[] = []
  for (const userData of testUsers) {
    const existing = await db.query.users.findFirst({ where: eq(users.email, userData.email) })
    if (!existing) {
      const hashedPassword = await hashPassword("Test@123!")
      const [user] = await db.insert(users).values({
        ...userData,
        password: hashedPassword,
        role: "public",
        isVerified: true,
        isActive: true,
      }).returning()
      userIds.push(user.id)
      console.log(`- User: ${userData.email} / Test@123!`)
    } else {
      userIds.push(existing.id)
    }
  }

  // Create MBG schedules for scoring validation
  console.log("Creating MBG schedules...")
  const mbgScheduleData = [
    { schoolName: "SDN Menteng 01", provinceId: "31", cityId: "31.71", districtId: "31.71.01", scheduleDays: "12345", startTime: "07:00", endTime: "12:00" },
    { schoolName: "SDN Kebayoran Baru 05", provinceId: "31", cityId: "31.71", districtId: "31.71.02", scheduleDays: "12345", startTime: "07:00", endTime: "12:00" },
    { schoolName: "SDN Bandung 01", provinceId: "32", cityId: "32.73", districtId: "32.73.01", scheduleDays: "12345", startTime: "07:00", endTime: "12:00" },
    { schoolName: "SDN Surabaya 01", provinceId: "35", cityId: "35.78", districtId: "35.78.01", scheduleDays: "12345", startTime: "07:00", endTime: "12:00" },
    { schoolName: "SDN Semarang 01", provinceId: "33", cityId: "33.74", districtId: "33.74.01", scheduleDays: "12345", startTime: "07:00", endTime: "12:00" },
    { schoolName: "SDN Yogyakarta 01", provinceId: "34", cityId: "34.71", districtId: "34.71.01", scheduleDays: "12345", startTime: "07:00", endTime: "12:00" },
    { schoolName: "SDN Medan 01", provinceId: "12", cityId: "12.71", districtId: "12.71.01", scheduleDays: "12345", startTime: "07:00", endTime: "12:00" },
    { schoolName: "SDN Makassar 01", provinceId: "73", cityId: "73.71", districtId: "73.71.01", scheduleDays: "12345", startTime: "07:00", endTime: "12:00" },
  ]

  const [existingSchedules] = await db.select({ count: sql<number>`count(*)` }).from(mbgSchedules)
  if (Number(existingSchedules.count) === 0) {
    for (const schedule of mbgScheduleData) {
      await db.insert(mbgSchedules).values({
        ...schedule,
        address: `Jl. Pendidikan No. ${Math.floor(Math.random() * 100) + 1}`,
        isActive: true,
      }).onConflictDoNothing()
    }
    console.log(`- Created ${mbgScheduleData.length} MBG schedules`)
  } else {
    console.log("- MBG schedules already exist")
  }

  // Create dummy reports
  console.log("Creating dummy reports...")
  const [existingReports] = await db.select({ count: sql<number>`count(*)` }).from(reports)

  if (Number(existingReports.count) === 0) {
    const dummyReports = [
      {
        userId: userIds[0],
        category: "poisoning" as const,
        title: "Keracunan massal siswa SDN Menteng",
        description: "Pada tanggal 10 Januari 2025 pukul 10:00 WIB, sekitar 15 siswa SDN Menteng 01 mengalami gejala keracunan setelah mengonsumsi makanan program MBG. Gejala yang dialami meliputi mual, muntah, dan diare. Siswa-siswa tersebut langsung dibawa ke puskesmas terdekat untuk mendapat penanganan medis. Makanan yang dicurigai adalah nasi goreng dengan lauk ayam.",
        location: "SDN Menteng 01, Jl. Menteng Raya No. 25",
        provinceId: "31",
        cityId: "31.71",
        districtId: "31.71.01",
        incidentDate: new Date("2025-01-10T10:00:00"),
        status: "pending" as const,
        relation: "parent" as const,
        scoreRelation: 3, scoreLocationTime: 3, scoreEvidence: 2, scoreNarrative: 3, scoreReporterHistory: 3, scoreSimilarity: 2,
        totalScore: 16,
        credibilityLevel: "high" as const,
      },
      {
        userId: userIds[1],
        category: "quality" as const,
        title: "Makanan basi ditemukan di dapur sekolah",
        description: "Saya menemukan bahan makanan yang sudah basi di dapur SDN Kebayoran Baru 05 pada hari Senin tanggal 8 Januari 2025 sekitar pukul 08:30. Bahan makanan tersebut berupa sayuran yang sudah layu dan berbau tidak sedap, serta telur yang sudah melewati tanggal kadaluarsa. Kondisi ini sangat mengkhawatirkan karena dapat membahayakan kesehatan siswa.",
        location: "SDN Kebayoran Baru 05, Jl. Wijaya No. 10",
        provinceId: "31",
        cityId: "31.71",
        districtId: "31.71.02",
        incidentDate: new Date("2025-01-08T08:30:00"),
        status: "verified" as const,
        relation: "teacher" as const,
        verifiedAt: new Date("2025-01-09T14:00:00"),
        scoreRelation: 3, scoreLocationTime: 3, scoreEvidence: 2, scoreNarrative: 3, scoreReporterHistory: 2, scoreSimilarity: 1,
        totalScore: 14,
        credibilityLevel: "high" as const,
      },
      {
        userId: userIds[2],
        category: "kitchen" as const,
        title: "Kondisi dapur tidak higienis",
        description: "Dapur sekolah SDN Bandung 01 dalam kondisi yang sangat tidak higienis. Pada kunjungan tanggal 5 Januari 2025 pukul 09:00, saya melihat lantai dapur kotor, tidak ada sabun cuci tangan, dan peralatan masak tidak dicuci dengan baik. Selain itu, tidak ada pemisahan antara area persiapan makanan mentah dan matang.",
        location: "SDN Bandung 01, Jl. Asia Afrika No. 15",
        provinceId: "32",
        cityId: "32.73",
        districtId: "32.73.01",
        incidentDate: new Date("2025-01-05T09:00:00"),
        status: "verified" as const,
        relation: "principal" as const,
        verifiedAt: new Date("2025-01-06T10:00:00"),
        scoreRelation: 3, scoreLocationTime: 3, scoreEvidence: 1, scoreNarrative: 2, scoreReporterHistory: 1, scoreSimilarity: 0,
        totalScore: 10,
        credibilityLevel: "medium" as const,
      },
      {
        userId: userIds[3],
        category: "policy" as const,
        title: "Dana MBG tidak transparan",
        description: "Saya sebagai orang tua murid merasa khawatir dengan pengelolaan dana program MBG di SDN Surabaya 01. Tidak ada laporan keuangan yang dipublikasikan kepada orang tua sejak program dimulai pada bulan Desember 2024. Ketika kami bertanya kepada pihak sekolah, tidak ada jawaban yang jelas mengenai alokasi dana tersebut.",
        location: "SDN Surabaya 01, Jl. Pemuda No. 20",
        provinceId: "35",
        cityId: "35.78",
        districtId: "35.78.01",
        incidentDate: new Date("2025-01-03T11:00:00"),
        status: "pending" as const,
        relation: "parent" as const,
        scoreRelation: 3, scoreLocationTime: 2, scoreEvidence: 0, scoreNarrative: 2, scoreReporterHistory: 1, scoreSimilarity: 0,
        totalScore: 8,
        credibilityLevel: "medium" as const,
      },
      {
        userId: userIds[4],
        category: "implementation" as const,
        title: "Distribusi makanan tidak merata",
        description: "Program MBG di SDN Semarang 01 mengalami masalah distribusi. Pada hari Selasa tanggal 7 Januari 2025, kelas 1 dan 2 tidak mendapat jatah makanan karena persediaan habis. Hal ini sudah terjadi beberapa kali dalam sebulan terakhir. Siswa yang tidak kebagian harus membeli makanan sendiri di kantin.",
        location: "SDN Semarang 01, Jl. Pandanaran No. 30",
        provinceId: "33",
        cityId: "33.74",
        districtId: "33.74.01",
        incidentDate: new Date("2025-01-07T11:30:00"),
        status: "rejected" as const,
        relation: "teacher" as const,
        adminNotes: "Laporan tidak dapat diverifikasi, informasi kurang lengkap",
        scoreRelation: 3, scoreLocationTime: 2, scoreEvidence: 0, scoreNarrative: 1, scoreReporterHistory: 2, scoreSimilarity: 0,
        totalScore: 8,
        credibilityLevel: "medium" as const,
      },
      {
        userId: userIds[0],
        category: "social" as const,
        title: "Diskriminasi dalam pembagian makanan",
        description: "Di SDN Yogyakarta 01, terjadi diskriminasi dalam pembagian makanan MBG. Siswa dari keluarga mampu mendapat porsi lebih besar dibanding siswa dari keluarga kurang mampu. Hal ini saya amati pada tanggal 9 Januari 2025 saat jam makan siang pukul 12:00. Beberapa siswa bahkan tidak mendapat lauk karena habis duluan.",
        location: "SDN Yogyakarta 01, Jl. Malioboro No. 5",
        provinceId: "34",
        cityId: "34.71",
        districtId: "34.71.01",
        incidentDate: new Date("2025-01-09T12:00:00"),
        status: "pending" as const,
        relation: "community" as const,
        scoreRelation: 2, scoreLocationTime: 2, scoreEvidence: 0, scoreNarrative: 2, scoreReporterHistory: 3, scoreSimilarity: 0,
        totalScore: 9,
        credibilityLevel: "medium" as const,
      },
      {
        userId: userIds[1],
        category: "poisoning" as const,
        title: "Siswa diare setelah makan MBG",
        description: "Anak saya mengalami diare berat setelah mengonsumsi makanan MBG di SDN Medan 01 pada tanggal 6 Januari 2025. Makanan yang dimakan adalah soto ayam dengan nasi. Gejala diare muncul sekitar 2 jam setelah makan siang pukul 12:00. Saat ini anak saya sedang dalam perawatan dokter dan membutuhkan obat-obatan.",
        location: "SDN Medan 01, Jl. Gatot Subroto No. 8",
        provinceId: "12",
        cityId: "12.71",
        districtId: "12.71.01",
        incidentDate: new Date("2025-01-06T12:00:00"),
        status: "verified" as const,
        relation: "parent" as const,
        verifiedAt: new Date("2025-01-07T09:00:00"),
        scoreRelation: 3, scoreLocationTime: 3, scoreEvidence: 1, scoreNarrative: 3, scoreReporterHistory: 2, scoreSimilarity: 1,
        totalScore: 13,
        credibilityLevel: "high" as const,
      },
      {
        userId: userIds[2],
        category: "quality" as const,
        title: "Porsi makanan terlalu sedikit",
        description: "Porsi makanan MBG di SDN Makassar 01 sangat sedikit dan tidak memenuhi kebutuhan gizi siswa. Nasi yang diberikan hanya sekitar 100 gram dengan lauk yang sangat minim. Kondisi ini sudah berlangsung sejak awal Januari 2025. Siswa sering mengeluh masih lapar setelah makan.",
        location: "SDN Makassar 01, Jl. Sultan Hasanuddin No. 12",
        provinceId: "73",
        cityId: "73.71",
        districtId: "73.71.01",
        incidentDate: new Date("2025-01-04T11:00:00"),
        status: "pending" as const,
        relation: "student" as const,
        scoreRelation: 3, scoreLocationTime: 2, scoreEvidence: 0, scoreNarrative: 1, scoreReporterHistory: 1, scoreSimilarity: 0,
        totalScore: 7,
        credibilityLevel: "medium" as const,
      },
      {
        userId: userIds[3],
        category: "kitchen" as const,
        title: "Petugas dapur tidak pakai sarung tangan",
        description: "Saya melihat petugas dapur di SDN Menteng 01 tidak menggunakan sarung tangan saat menyiapkan makanan pada tanggal 11 Januari 2025 pukul 08:00 pagi. Mereka juga tidak mencuci tangan sebelum memegang bahan makanan. Hal ini sangat tidak higienis dan berisiko mencemari makanan.",
        location: "SDN Menteng 01, Jl. Menteng Raya No. 25",
        provinceId: "31",
        cityId: "31.71",
        districtId: "31.71.01",
        incidentDate: new Date("2025-01-11T08:00:00"),
        status: "pending" as const,
        relation: "supplier" as const,
        scoreRelation: 3, scoreLocationTime: 3, scoreEvidence: 0, scoreNarrative: 2, scoreReporterHistory: 1, scoreSimilarity: 3,
        totalScore: 12,
        credibilityLevel: "high" as const,
      },
      {
        userId: userIds[4],
        category: "implementation" as const,
        title: "Jadwal makan tidak konsisten",
        description: "Jadwal pemberian makanan MBG di SDN Kebayoran Baru 05 tidak konsisten. Kadang makanan datang pukul 10:00, kadang pukul 12:00. Hal ini mengganggu jadwal belajar siswa karena mereka harus menunggu makanan datang. Kejadian ini sudah berlangsung sejak minggu pertama Januari 2025.",
        location: "SDN Kebayoran Baru 05, Jl. Wijaya No. 10",
        provinceId: "31",
        cityId: "31.71",
        districtId: "31.71.02",
        incidentDate: new Date("2025-01-02T10:00:00"),
        status: "verified" as const,
        relation: "teacher" as const,
        verifiedAt: new Date("2025-01-03T15:00:00"),
        scoreRelation: 3, scoreLocationTime: 2, scoreEvidence: 0, scoreNarrative: 1, scoreReporterHistory: 3, scoreSimilarity: 1,
        totalScore: 10,
        credibilityLevel: "medium" as const,
      },
    ]

    for (const report of dummyReports) {
      const { verifiedAt, adminNotes, ...reportData } = report
      await db.insert(reports).values({
        ...reportData,
        verifiedAt: verifiedAt || null,
        verifiedBy: verifiedAt ? adminId : null,
        adminNotes: adminNotes || null,
      })
    }
    console.log(`- Created ${dummyReports.length} dummy reports`)
  } else {
    console.log("- Reports already exist")
  }

  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users)
  const [reportCount] = await db.select({ count: sql<number>`count(*)` }).from(reports)
  const [scheduleCount] = await db.select({ count: sql<number>`count(*)` }).from(mbgSchedules)

  console.log(`\nSeeding complete!`)
  console.log(`- Provinces: ${provCount.count}`)
  console.log(`- Cities: ${cityCount.count}`)
  console.log(`- Districts: ${distCount.count}`)
  console.log(`- Users: ${userCount.count}`)
  console.log(`- Reports: ${reportCount.count}`)
  console.log(`- MBG Schedules: ${scheduleCount.count}`)

  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed error:", err)
  process.exit(1)
})
