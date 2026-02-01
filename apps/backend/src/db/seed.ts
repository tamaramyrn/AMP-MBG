import { db } from "./index"
import * as schema from "./schema"
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
    await db.insert(schema.provinces).values(batch).onConflictDoNothing()
  }

  console.log(`Inserting ${citiesData.length} cities...`)
  const cityValues = citiesData.map((c) => ({
    id: c.id,
    provinceId: c.id.split(".")[0],
    name: c.name,
  }))
  for (let i = 0; i < cityValues.length; i += 100) {
    const batch = cityValues.slice(i, i + 100)
    await db.insert(schema.cities).values(batch).onConflictDoNothing()
  }

  console.log(`Inserting ${districtsData.length} districts...`)
  const distValues = districtsData.map((d) => {
    const parts = d.id.split(".")
    return { id: d.id, cityId: `${parts[0]}.${parts[1]}`, name: d.name }
  })
  for (let i = 0; i < distValues.length; i += 100) {
    const batch = distValues.slice(i, i + 100)
    await db.insert(schema.districts).values(batch).onConflictDoNothing()
  }

  const [provCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.provinces)
  const [cityCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.cities)
  const [distCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.districts)

  // Create admin users in admins table
  console.log("Creating admin users...")
  const adminUsersData = [
    { email: "admin@ampmbg.id", phone: "+62812345678901", name: "Administrator", adminRole: "Super Admin" },
    { email: "koordinator@ampmbg.id", phone: "+62812345678902", name: "Andi Koordinator", adminRole: "Koordinator Nasional" },
    { email: "validator1@ampmbg.id", phone: "+62812345678903", name: "Budi Validator", adminRole: "Validator Laporan" },
    { email: "validator2@ampmbg.id", phone: "+62812345678904", name: "Citra Validator", adminRole: "Validator Laporan" },
    { email: "analyst@ampmbg.id", phone: "+62812345678905", name: "Dedi Analyst", adminRole: "Data Analyst" },
    { email: "finance@ampmbg.id", phone: "+62812345678906", name: "Eka Finance", adminRole: "Finance Manager" },
    { email: "ops@ampmbg.id", phone: "+62812345678907", name: "Fajar Operations", adminRole: "Operations Manager" },
    { email: "hr@ampmbg.id", phone: "+62812345678908", name: "Gita HR", adminRole: "HR Manager" },
    { email: "it@ampmbg.id", phone: "+62812345678909", name: "Hendra IT", adminRole: "IT Support" },
    { email: "media@ampmbg.id", phone: "+62812345678910", name: "Indah Media", adminRole: "Media Relations" },
    { email: "regional.jawa@ampmbg.id", phone: "+62812345678911", name: "Joko Regional", adminRole: "Koordinator Jawa" },
    { email: "regional.sumatra@ampmbg.id", phone: "+62812345678912", name: "Kartika Regional", adminRole: "Koordinator Sumatra" },
  ]

  let mainAdminId: string = ""
  for (const adminData of adminUsersData) {
    const existing = await db.query.admins.findFirst({ where: eq(schema.admins.email, adminData.email) })
    if (!existing) {
      const hashedPassword = await hashPassword("Admin@123!")
      const [admin] = await db.insert(schema.admins).values({
        ...adminData,
        password: hashedPassword,
        isActive: true,
      }).returning()
      if (adminData.email === "admin@ampmbg.id") mainAdminId = admin.id
      console.log(`- Admin: ${adminData.email} / Admin@123!`)
    } else {
      if (adminData.email === "admin@ampmbg.id") mainAdminId = existing.id
    }
  }

  // Create public users
  console.log("Creating public users...")
  const testUsers = [
    { email: "budi@example.com", phone: "+62812000001", name: "Budi Santoso", reportCount: 5, verifiedReportCount: 4 },
    { email: "siti@example.com", phone: "+62812000002", name: "Siti Rahayu", reportCount: 3, verifiedReportCount: 2 },
    { email: "ahmad@example.com", phone: "+62812000003", name: "Ahmad Hidayat", reportCount: 2, verifiedReportCount: 1 },
    { email: "dewi@example.com", phone: "+62812000004", name: "Dewi Lestari", reportCount: 1, verifiedReportCount: 0 },
    { email: "rudi@example.com", phone: "+62812000005", name: "Rudi Hermawan", reportCount: 4, verifiedReportCount: 3 },
    { email: "maya@example.com", phone: "+62812000006", name: "Maya Sari", reportCount: 2, verifiedReportCount: 1 },
    { email: "eko@example.com", phone: "+62812000007", name: "Eko Prasetyo", reportCount: 1, verifiedReportCount: 1 },
    { email: "nina@example.com", phone: "+62812000008", name: "Nina Wulandari", reportCount: 3, verifiedReportCount: 2 },
    { email: "tono@example.com", phone: "+62812000009", name: "Tono Sugiarto", reportCount: 0, verifiedReportCount: 0 },
    { email: "ratna@example.com", phone: "+62812000010", name: "Ratna Dewi", reportCount: 2, verifiedReportCount: 1 },
    { email: "hasan@example.com", phone: "+62812000011", name: "Hasan Abdullah", reportCount: 1, verifiedReportCount: 0 },
    { email: "wati@example.com", phone: "+62812000012", name: "Wati Suryani", reportCount: 0, verifiedReportCount: 0 },
  ]

  const userIds: string[] = []
  for (const userData of testUsers) {
    const existing = await db.query.publics.findFirst({ where: eq(schema.publics.email, userData.email) })
    if (!existing) {
      const hashedPassword = await hashPassword("Test@123!")
      const [user] = await db.insert(schema.publics).values({
        ...userData,
        password: hashedPassword,
        isVerified: true,
        isActive: true,
      }).returning()
      userIds.push(user.id)
      console.log(`- User: ${userData.email} / Test@123!`)
    } else {
      userIds.push(existing.id)
    }
  }

  // Create member applications (link existing users to member records)
  // Members are PUBLIC USERS who applied to become organization members
  console.log("Creating member applications...")

  // Foundation members - use some existing public users
  const foundationMembersData = [
    { userIndex: 0, memberType: "foundation" as const, organizationName: "Yayasan Peduli Bangsa", organizationEmail: "contact@pedulibangsa.org", organizationPhone: "+62215550001", roleInOrganization: "Direktur Eksekutif", organizationMbgRole: "Penyedia bahan baku sayuran organik untuk program MBG", isVerified: true },
    { userIndex: 1, memberType: "foundation" as const, organizationName: "Yayasan Kasih Ibu", organizationEmail: "info@kasihibu.org", organizationPhone: "+62215550002", roleInOrganization: "Ketua Yayasan", organizationMbgRole: "Pengelola dapur umum untuk distribusi makanan", isVerified: true },
    { userIndex: 2, memberType: "foundation" as const, organizationName: "Yayasan Cerdas Indonesia", organizationEmail: "hello@cerdasindonesia.org", organizationPhone: "+62215550003", roleInOrganization: "Program Manager", organizationMbgRole: "Monitoring dan evaluasi program gizi sekolah", isVerified: true },
  ]

  // Other member types - use remaining public users
  const otherMembersData = [
    { userIndex: 3, memberType: "supplier" as const, organizationName: "PT Pangan Makmur", organizationEmail: "info@panganmakmur.com", organizationPhone: "+62215551001", roleInOrganization: "Manager Pengadaan", organizationMbgRole: "Supplier bahan baku protein hewani", isVerified: true },
    { userIndex: 4, memberType: "caterer" as const, organizationName: "CV Katering Sehat Selalu", organizationEmail: "order@kateringsehat.com", organizationPhone: "+62215551002", roleInOrganization: "Owner", organizationMbgRole: "Jasa katering untuk sekolah", isVerified: true },
    { userIndex: 5, memberType: "school" as const, organizationName: "SD Negeri Harapan Baru 01", organizationEmail: "sdn.harapanbaru@edu.id", organizationPhone: "+62215551003", roleInOrganization: "Kepala Sekolah", organizationMbgRole: "Penerima manfaat program MBG", isVerified: false },
    { userIndex: 6, memberType: "government" as const, organizationName: "Dinas Pendidikan Kota Bandung", organizationEmail: "dinas.dikbud@bandung.go.id", organizationPhone: "+62215551004", roleInOrganization: "Kepala Bidang", organizationMbgRole: "Koordinator program MBG tingkat kota", isVerified: false },
    { userIndex: 7, memberType: "ngo" as const, organizationName: "LSM Pangan Adil Indonesia", organizationEmail: "contact@panganadil.org", organizationPhone: "+62215551005", roleInOrganization: "Direktur Eksekutif", organizationMbgRole: "Advokasi dan monitoring program MBG", isVerified: true },
    { userIndex: 8, memberType: "farmer" as const, organizationName: "Kelompok Tani Maju Bersama", organizationEmail: "tanimaju@gmail.com", organizationPhone: "+62215551006", roleInOrganization: "Ketua Kelompok", organizationMbgRole: "Pemasok sayuran lokal", isVerified: false },
  ]

  const allMembersData = [...foundationMembersData, ...otherMembersData]

  for (const memberData of allMembersData) {
    const userId = userIds[memberData.userIndex]
    if (!userId) continue

    // Check if member record already exists for this user
    const existingMember = await db.query.members.findFirst({ where: eq(schema.members.publicId, userId) })
    if (!existingMember) {
      await db.insert(schema.members).values({
        publicId: userId,
        memberType: memberData.memberType,
        organizationName: memberData.organizationName,
        organizationEmail: memberData.organizationEmail,
        organizationPhone: memberData.organizationPhone,
        roleInOrganization: memberData.roleInOrganization,
        organizationMbgRole: memberData.organizationMbgRole,
        isVerified: memberData.isVerified,
        verifiedAt: memberData.isVerified ? new Date() : null,
        verifiedBy: memberData.isVerified ? mainAdminId || null : null,
        appliedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      })
      console.log(`- Member (${memberData.memberType}): ${memberData.organizationName}`)
    }
  }

  // Create MBG schedules
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
    { schoolName: "SDN Denpasar 02", provinceId: "51", cityId: "51.71", districtId: "51.71.01", scheduleDays: "12345", startTime: "07:30", endTime: "12:30" },
    { schoolName: "SDN Palembang 03", provinceId: "16", cityId: "16.71", districtId: "16.71.01", scheduleDays: "12345", startTime: "07:00", endTime: "11:30" },
    { schoolName: "SDN Balikpapan 01", provinceId: "64", cityId: "64.71", districtId: "64.71.01", scheduleDays: "12345", startTime: "07:00", endTime: "12:00" },
    { schoolName: "SDN Manado 02", provinceId: "71", cityId: "71.71", districtId: "71.71.01", scheduleDays: "12345", startTime: "07:30", endTime: "12:00" },
  ]

  const [existingSchedules] = await db.select({ count: sql<number>`count(*)` }).from(schema.mbgSchedules)
  if (Number(existingSchedules.count) === 0) {
    for (const schedule of mbgScheduleData) {
      await db.insert(schema.mbgSchedules).values({
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
  const [existingReports] = await db.select({ count: sql<number>`count(*)` }).from(schema.reports)

  if (Number(existingReports.count) === 0) {
    const dummyReports = [
      {
        publicId: userIds[0],
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
        publicId: userIds[1],
        category: "quality" as const,
        title: "Makanan basi ditemukan di dapur sekolah",
        description: "Saya menemukan bahan makanan yang sudah basi di dapur SDN Kebayoran Baru 05 pada hari Senin tanggal 8 Januari 2025 sekitar pukul 08:30. Bahan makanan tersebut berupa sayuran yang sudah layu dan berbau tidak sedap, serta telur yang sudah melewati tanggal kadaluarsa. Kondisi ini sangat mengkhawatirkan karena dapat membahayakan kesehatan siswa.",
        location: "SDN Kebayoran Baru 05, Jl. Wijaya No. 10",
        provinceId: "31",
        cityId: "31.71",
        districtId: "31.71.02",
        incidentDate: new Date("2025-01-08T08:30:00"),
        status: "in_progress" as const,
        relation: "teacher" as const,
        verifiedAt: new Date("2025-01-09T14:00:00"),
        scoreRelation: 3, scoreLocationTime: 3, scoreEvidence: 2, scoreNarrative: 3, scoreReporterHistory: 2, scoreSimilarity: 1,
        totalScore: 14,
        credibilityLevel: "high" as const,
      },
      {
        publicId: userIds[2],
        category: "kitchen" as const,
        title: "Kondisi dapur tidak higienis",
        description: "Dapur sekolah SDN Bandung 01 dalam kondisi yang sangat tidak higienis. Pada kunjungan tanggal 5 Januari 2025 pukul 09:00, saya melihat lantai dapur kotor, tidak ada sabun cuci tangan, dan peralatan masak tidak dicuci dengan baik. Selain itu, tidak ada pemisahan antara area persiapan makanan mentah dan matang.",
        location: "SDN Bandung 01, Jl. Asia Afrika No. 15",
        provinceId: "32",
        cityId: "32.73",
        districtId: "32.73.01",
        incidentDate: new Date("2025-01-05T09:00:00"),
        status: "analyzing" as const,
        relation: "principal" as const,
        verifiedAt: new Date("2025-01-06T10:00:00"),
        scoreRelation: 3, scoreLocationTime: 3, scoreEvidence: 1, scoreNarrative: 2, scoreReporterHistory: 1, scoreSimilarity: 0,
        totalScore: 10,
        credibilityLevel: "medium" as const,
      },
      {
        publicId: userIds[3],
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
        publicId: userIds[4],
        category: "implementation" as const,
        title: "Distribusi makanan tidak merata",
        description: "Program MBG di SDN Semarang 01 mengalami masalah distribusi. Pada hari Selasa tanggal 7 Januari 2025, kelas 1 dan 2 tidak mendapat jatah makanan karena persediaan habis. Hal ini sudah terjadi beberapa kali dalam sebulan terakhir. Siswa yang tidak kebagian harus membeli makanan sendiri di kantin.",
        location: "SDN Semarang 01, Jl. Pandanaran No. 30",
        provinceId: "33",
        cityId: "33.74",
        districtId: "33.74.01",
        incidentDate: new Date("2025-01-07T11:30:00"),
        status: "invalid" as const,
        relation: "teacher" as const,
        adminNotes: "Laporan tidak dapat diverifikasi, informasi kurang lengkap",
        scoreRelation: 3, scoreLocationTime: 2, scoreEvidence: 0, scoreNarrative: 1, scoreReporterHistory: 2, scoreSimilarity: 0,
        totalScore: 8,
        credibilityLevel: "medium" as const,
      },
      {
        publicId: userIds[0],
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
        publicId: userIds[1],
        category: "poisoning" as const,
        title: "Siswa diare setelah makan MBG",
        description: "Anak saya mengalami diare berat setelah mengonsumsi makanan MBG di SDN Medan 01 pada tanggal 6 Januari 2025. Makanan yang dimakan adalah soto ayam dengan nasi. Gejala diare muncul sekitar 2 jam setelah makan siang pukul 12:00. Saat ini anak saya sedang dalam perawatan dokter dan membutuhkan obat-obatan.",
        location: "SDN Medan 01, Jl. Gatot Subroto No. 8",
        provinceId: "12",
        cityId: "12.71",
        districtId: "12.71.01",
        incidentDate: new Date("2025-01-06T12:00:00"),
        status: "resolved" as const,
        relation: "parent" as const,
        verifiedAt: new Date("2025-01-07T09:00:00"),
        scoreRelation: 3, scoreLocationTime: 3, scoreEvidence: 1, scoreNarrative: 3, scoreReporterHistory: 2, scoreSimilarity: 1,
        totalScore: 13,
        credibilityLevel: "high" as const,
      },
      {
        publicId: userIds[2],
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
        publicId: userIds[3],
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
        publicId: userIds[4],
        category: "implementation" as const,
        title: "Jadwal makan tidak konsisten",
        description: "Jadwal pemberian makanan MBG di SDN Kebayoran Baru 05 tidak konsisten. Kadang makanan datang pukul 10:00, kadang pukul 12:00. Hal ini mengganggu jadwal belajar siswa karena mereka harus menunggu makanan datang. Kejadian ini sudah berlangsung sejak minggu pertama Januari 2025.",
        location: "SDN Kebayoran Baru 05, Jl. Wijaya No. 10",
        provinceId: "31",
        cityId: "31.71",
        districtId: "31.71.02",
        incidentDate: new Date("2025-01-02T10:00:00"),
        status: "needs_evidence" as const,
        relation: "teacher" as const,
        verifiedAt: new Date("2025-01-03T15:00:00"),
        scoreRelation: 3, scoreLocationTime: 2, scoreEvidence: 0, scoreNarrative: 1, scoreReporterHistory: 3, scoreSimilarity: 1,
        totalScore: 10,
        credibilityLevel: "medium" as const,
      },
    ]

    for (const report of dummyReports) {
      const { verifiedAt, adminNotes, ...reportData } = report
      await db.insert(schema.reports).values({
        ...reportData,
        verifiedAt: verifiedAt || null,
        verifiedBy: verifiedAt ? mainAdminId : null,
        adminNotes: adminNotes || null,
      })
    }
    console.log(`- Created ${dummyReports.length} dummy reports`)
  } else {
    console.log("- Reports already exist")
  }

  // Seed kitchen needs
  console.log("Creating kitchen needs...")
  const [existingKitchenNeeds] = await db.select({ count: sql<number>`count(*)` }).from(schema.kitchenNeeds)
  let kitchenNeedIds: string[] = []
  if (Number(existingKitchenNeeds.count) === 0) {
    const kitchenNeedsData = [
      { title: "Ahli Gizi", description: "Memastikan menu dan porsi memenuhi standar gizi penerima manfaat sesuai kelompok sasaran. Ini juga mengurangi risiko keluhan, alergi, dan ketidaksesuaian menu saat bahan berubah.", imageUrl: null, sortOrder: 1 },
      { title: "Logistik & Supply Chain", description: "Manajemen supply chain agar pasokan bahan stabil, kualitas terjaga, dan distribusi tepat waktu. Ini mencegah stockout, lonjakan biaya, dan bahan tidak sesuai spesifikasi.", imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800", sortOrder: 2 },
      { title: "Peralatan Dapur", description: "Peralatan yang tepat agar kapasitas produksi tercapai secara konsisten dan aman. Peralatan yang sesuai juga mempercepat proses dan menurunkan human error.", imageUrl: null, sortOrder: 3 },
      { title: "Bahan Baku Makanan", description: "Pasokan bahan baku berkualitas untuk menjamin rasa dan nilai gizi makanan yang disajikan kepada penerima manfaat program MBG.", imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800", sortOrder: 4 },
      { title: "Tenaga Masak Profesional", description: "Juru masak berpengalaman yang mampu mengolah makanan dalam jumlah besar dengan standar kebersihan dan kualitas yang konsisten.", imageUrl: null, sortOrder: 5 },
      { title: "Sistem Manajemen Dapur", description: "Software dan sistem untuk mengelola inventori, jadwal produksi, dan monitoring kualitas makanan secara terintegrasi.", imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800", sortOrder: 6 },
      { title: "Pelatihan Keamanan Pangan", description: "Program pelatihan untuk memastikan semua staf dapur memahami standar keamanan pangan dan praktik higienis yang benar.", imageUrl: null, sortOrder: 7 },
      { title: "Pengelolaan Limbah", description: "Sistem pengelolaan limbah dapur yang ramah lingkungan termasuk pengolahan sisa makanan menjadi kompos.", imageUrl: null, sortOrder: 8 },
      { title: "Monitoring Kualitas Air", description: "Pemantauan dan pemurnian air bersih untuk memastikan keamanan air yang digunakan dalam proses memasak.", imageUrl: null, sortOrder: 9 },
      { title: "Kemasan Ramah Lingkungan", description: "Solusi pengemasan makanan yang aman, higienis, dan ramah lingkungan untuk distribusi ke sekolah.", imageUrl: null, sortOrder: 10 },
      { title: "Transportasi Makanan", description: "Kendaraan khusus dengan pendingin untuk menjaga kualitas makanan selama distribusi ke berbagai lokasi sekolah.", imageUrl: null, sortOrder: 11 },
      { title: "Quality Control", description: "Tim dan peralatan untuk melakukan pengecekan kualitas bahan baku dan makanan jadi sebelum didistribusikan.", imageUrl: null, sortOrder: 12 },
    ]
    const insertedNeeds = await db.insert(schema.kitchenNeeds).values(kitchenNeedsData).returning()
    kitchenNeedIds = insertedNeeds.map(k => k.id)
    console.log(`- Created ${kitchenNeedsData.length} kitchen needs`)
  } else {
    const existingNeeds = await db.query.kitchenNeeds.findMany({ columns: { id: true } })
    kitchenNeedIds = existingNeeds.map(k => k.id)
    console.log("- Kitchen needs already exist")
  }

  // Seed kitchen needs requests
  console.log("Creating kitchen needs requests...")
  const [existingRequests] = await db.select({ count: sql<number>`count(*)` }).from(schema.kitchenNeedsRequests)
  if (Number(existingRequests.count) === 0 && kitchenNeedIds.length > 0 && userIds.length > 0) {
    const requestsData = [
      { publicId: userIds[0], kitchenNeedId: kitchenNeedIds[0], sppgName: "SPPG Jakarta Pusat", contactPerson: "Budi Santoso", position: "Koordinator", phoneNumber: "+62812000001", details: "Membutuhkan ahli gizi untuk konsultasi menu harian program MBG di 5 sekolah wilayah Jakarta Pusat. Diharapkan dapat membantu menyusun menu seimbang untuk 2000 siswa.", status: "pending" as const },
      { publicId: userIds[1], kitchenNeedId: kitchenNeedIds[1], sppgName: "SPPG Bandung Barat", contactPerson: "Siti Rahayu", position: "Manager Operasional", phoneNumber: "+62812000002", details: "Butuh bantuan manajemen supply chain untuk distribusi bahan ke 10 sekolah. Saat ini mengalami kendala keterlambatan pengiriman dan kualitas bahan yang tidak konsisten.", status: "processed" as const, adminNotes: "Sudah dihubungkan dengan tim logistik regional Jawa Barat" },
      { publicId: userIds[2], kitchenNeedId: kitchenNeedIds[2], sppgName: "SPPG Surabaya Timur", contactPerson: "Ahmad Hidayat", position: "Kepala Dapur", phoneNumber: "+62812000003", details: "Memerlukan upgrade peralatan dapur untuk kapasitas produksi 3000 porsi/hari. Peralatan lama sudah tidak memadai dan sering rusak.", status: "completed" as const, adminNotes: "Peralatan sudah dikirim dan diinstall tanggal 15 Januari 2025" },
      { publicId: userIds[3], kitchenNeedId: kitchenNeedIds[3], sppgName: "SPPG Semarang Selatan", contactPerson: "Dewi Lestari", position: "Procurement", phoneNumber: "+62812000004", details: "Mencari supplier bahan baku sayuran organik lokal untuk program MBG. Kebutuhan sekitar 500kg sayuran per minggu.", status: "pending" as const },
      { publicId: userIds[4], kitchenNeedId: kitchenNeedIds[4], sppgName: "SPPG Medan Kota", contactPerson: "Rudi Hermawan", position: "HR Manager", phoneNumber: "+62812000005", details: "Membutuhkan 10 tenaga masak profesional untuk dapur sentral. Diutamakan yang memiliki sertifikat keamanan pangan.", status: "not_found" as const, adminNotes: "Belum ada kandidat yang sesuai di wilayah Medan" },
      { publicId: userIds[5], kitchenNeedId: kitchenNeedIds[5], sppgName: "SPPG Makassar Utara", contactPerson: "Maya Sari", position: "IT Coordinator", phoneNumber: "+62812000006", details: "Memerlukan sistem digital untuk tracking inventori dan jadwal produksi. Saat ini masih menggunakan pencatatan manual.", status: "processed" as const, adminNotes: "Sedang dalam proses implementasi sistem" },
      { publicId: userIds[6], kitchenNeedId: kitchenNeedIds[6], sppgName: "SPPG Yogyakarta", contactPerson: "Eko Prasetyo", position: "Quality Assurance", phoneNumber: "+62812000007", details: "Membutuhkan program pelatihan keamanan pangan untuk 25 staf dapur. Pelatihan harus mencakup HACCP dan food handling.", status: "pending" as const },
      { publicId: userIds[7], kitchenNeedId: kitchenNeedIds[7], sppgName: "SPPG Denpasar", contactPerson: "Nina Wulandari", position: "Environmental Officer", phoneNumber: "+62812000008", details: "Mencari solusi pengelolaan limbah dapur yang ramah lingkungan. Sisa makanan rata-rata 50kg/hari perlu ditangani.", status: "completed" as const, adminNotes: "Sudah bekerja sama dengan bank sampah lokal" },
      { publicId: userIds[8], kitchenNeedId: kitchenNeedIds[8], sppgName: "SPPG Palembang", contactPerson: "Tono Sugiarto", position: "Facility Manager", phoneNumber: "+62812000009", details: "Memerlukan sistem pemurnian air untuk dapur sentral. Kualitas air di lokasi kurang memadai untuk memasak.", status: "pending" as const },
      { publicId: userIds[9], kitchenNeedId: kitchenNeedIds[9], sppgName: "SPPG Pontianak", contactPerson: "Ratna Dewi", position: "Packaging Supervisor", phoneNumber: "+62812000010", details: "Butuh supplier kemasan makanan yang food-grade dan ramah lingkungan untuk 2000 porsi/hari.", status: "processed" as const, adminNotes: "Sedang negosiasi dengan vendor lokal" },
      { publicId: userIds[10], kitchenNeedId: kitchenNeedIds[10], sppgName: "SPPG Balikpapan", contactPerson: "Hasan Abdullah", position: "Logistics Head", phoneNumber: "+62812000011", details: "Memerlukan kendaraan berpendingin untuk distribusi makanan ke 8 sekolah dalam radius 20km.", status: "pending" as const },
      { publicId: userIds[11], kitchenNeedId: kitchenNeedIds[11], sppgName: "SPPG Manado", contactPerson: "Wati Suryani", position: "QC Manager", phoneNumber: "+62812000012", details: "Butuh peralatan dan pelatihan untuk tim quality control. Saat ini belum ada standar pengecekan yang baku.", status: "not_found" as const, adminNotes: "Menunggu alokasi budget dari pusat" },
    ]

    for (const reqData of requestsData) {
      const { adminNotes, ...data } = reqData
      await db.insert(schema.kitchenNeedsRequests).values({
        ...data,
        adminNotes: adminNotes || null,
      })
    }
    console.log(`- Created ${requestsData.length} kitchen needs requests`)
  } else {
    console.log("- Kitchen needs requests already exist or no data to link")
  }

  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.publics)
  const [adminCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.admins)
  const [memberCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.members)
  const [reportCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.reports)
  const [scheduleCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.mbgSchedules)
  const [kitchenCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.kitchenNeeds)
  const [requestCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.kitchenNeedsRequests)

  console.log(`\nSeeding complete!`)
  console.log(`- Provinces: ${provCount.count}`)
  console.log(`- Cities: ${cityCount.count}`)
  console.log(`- Districts: ${distCount.count}`)
  console.log(`- Admins: ${adminCount.count}`)
  console.log(`- Users: ${userCount.count}`)
  console.log(`- Members: ${memberCount.count}`)
  console.log(`- Reports: ${reportCount.count}`)
  console.log(`- MBG Schedules: ${scheduleCount.count}`)
  console.log(`- Kitchen Needs: ${kitchenCount.count}`)
  console.log(`- Kitchen Requests: ${requestCount.count}`)

}

seed().catch((err) => {
  console.error("Seed error:", err)
})
