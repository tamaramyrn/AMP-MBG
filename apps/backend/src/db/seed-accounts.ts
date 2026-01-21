import { db, schema } from "./index"
import { eq, sql } from "drizzle-orm"
import { hashPassword } from "../lib/password"

const adminAccounts = [
  { name: "Budi Santoso", email: "budi.santoso@ampmbg.id", phone: "+6281100000001", adminRole: "Director" },
  { name: "Siti Rahayu", email: "siti.rahayu@ampmbg.id", phone: "+6281100000002", adminRole: "Marketing" },
  { name: "Ahmad Wijaya", email: "ahmad.wijaya@ampmbg.id", phone: "+6281100000003", adminRole: "IT" },
  { name: "Dewi Lestari", email: "dewi.lestari@ampmbg.id", phone: "+6281100000004", adminRole: "Finance" },
  { name: "Eko Prasetyo", email: "eko.prasetyo@ampmbg.id", phone: "+6281100000005", adminRole: "Operations" },
]

const memberAccounts = [
  {
    nik: "3275012345670001",
    name: "Andi Pratama",
    email: "andi.pratama@gmail.com",
    phone: "+6281234567001",
    memberType: "supplier" as const,
    isVerified: true,
    isActive: true,
    organizationName: "PT Sumber Pangan Nusantara",
    organizationEmail: "contact@sumberpangan.id",
    organizationPhone: "+6221123456001",
    roleInOrganization: "Direktur Operasional yang bertanggung jawab atas distribusi bahan pangan ke sekolah-sekolah",
    organizationMbgRole: "Supplier utama bahan makanan segar seperti sayuran, daging, dan telur untuk program MBG di wilayah Jakarta",
  },
  {
    nik: "3275012345670002",
    name: "Ratna Dewi",
    email: "ratna.dewi@gmail.com",
    phone: "+6281234567002",
    memberType: "caterer" as const,
    isVerified: true,
    isActive: true,
    organizationName: "CV Dapur Sehat Indonesia",
    organizationEmail: "info@dapursehat.id",
    organizationPhone: "+6221123456002",
    roleInOrganization: "Manager Produksi yang mengawasi proses memasak dan pengemasan makanan",
    organizationMbgRole: "Penyedia jasa katering untuk 50 sekolah dasar di Jakarta Selatan dengan menu bergizi seimbang",
  },
  {
    nik: "3275012345670003",
    name: "Hendra Kusuma",
    email: "hendra.kusuma@gmail.com",
    phone: "+6281234567003",
    memberType: "school" as const,
    isVerified: false,
    isActive: true,
    organizationName: "SDN 01 Menteng",
    organizationEmail: "sdn01menteng@edu.id",
    organizationPhone: "+6221123456003",
    roleInOrganization: "Kepala Sekolah yang mengkoordinasikan program MBG di tingkat sekolah",
    organizationMbgRole: "Sekolah penerima program MBG dengan 450 siswa yang mendapat makan bergizi setiap hari sekolah",
  },
  {
    nik: "3275012345670004",
    name: "Maya Sari",
    email: "maya.sari@gmail.com",
    phone: "+6281234567004",
    memberType: "government" as const,
    isVerified: false,
    isActive: true,
    organizationName: "Dinas Pendidikan Kota Bogor",
    organizationEmail: "disdik@bogor.go.id",
    organizationPhone: "+6221123456004",
    roleInOrganization: "Kepala Bidang Kesejahteraan Siswa yang mengawasi implementasi program nutrisi",
    organizationMbgRole: "Koordinator program MBG tingkat kota yang mengawasi 120 sekolah penerima program",
  },
  {
    nik: "3275012345670005",
    name: "Bambang Sutrisno",
    email: "bambang.sutrisno@gmail.com",
    phone: "+6281234567005",
    memberType: "ngo" as const,
    isVerified: false,
    isActive: false,
    organizationName: "Yayasan Gizi Anak Bangsa",
    organizationEmail: "info@ygab.or.id",
    organizationPhone: "+6221123456005",
    roleInOrganization: "Direktur Program yang merancang dan mengevaluasi program nutrisi anak",
    organizationMbgRole: "Mitra pendamping yang melakukan edukasi gizi dan monitoring kualitas makanan di 30 sekolah",
  },
]

async function seedAccounts() {
  console.log("Seeding accounts...")

  const defaultPassword = await hashPassword("Admin@123!")

  // Clear existing member and admin accounts (except main admin)
  console.log("Clearing existing member accounts...")
  await db.execute(sql`DELETE FROM users WHERE role = 'member'`)
  await db.execute(sql`DELETE FROM users WHERE role = 'admin' AND email != 'admin@ampmbg.id'`)

  // Seed admins
  for (const admin of adminAccounts) {
    const existing = await db.query.users.findFirst({ where: eq(schema.users.email, admin.email) })
    if (!existing) {
      await db.insert(schema.users).values({
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        password: defaultPassword,
        role: "admin",
        adminRole: admin.adminRole,
        isVerified: true,
        isActive: true,
      })
      console.log(`Created admin: ${admin.name}`)
    } else {
      console.log(`Admin exists: ${admin.name}`)
    }
  }

  // Seed members with complete organization data (no password - members don't login)
  const now = new Date()
  for (const member of memberAccounts) {
    await db.insert(schema.users).values({
      nik: member.nik,
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: "member",
      memberType: member.memberType,
      organizationName: member.organizationName,
      organizationEmail: member.organizationEmail,
      organizationPhone: member.organizationPhone,
      roleInOrganization: member.roleInOrganization,
      organizationMbgRole: member.organizationMbgRole,
      appliedAt: now,
      verifiedAt: member.isVerified ? now : null,
      isVerified: member.isVerified,
      isActive: member.isActive,
    })
    console.log(`Created member: ${member.name} (${member.organizationName})`)
  }

  // Verify the data
  const members = await db.execute(sql`
    SELECT name, organization_name, organization_email, role_in_organization, applied_at, verified_at
    FROM users WHERE role = 'member'
  `)
  console.log("\nMember data verification:")
  console.log(JSON.stringify(members, null, 2))

  console.log("\nSeeding complete!")
}

seedAccounts().catch(console.error).finally(() => process.exit(0))
