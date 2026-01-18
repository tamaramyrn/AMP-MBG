import { db, schema } from "./index"
import { eq } from "drizzle-orm"

const adminAccounts = [
  { name: "Budi Santoso", email: "budi.santoso@ampmbg.id", adminRole: "Director" },
  { name: "Siti Rahayu", email: "siti.rahayu@ampmbg.id", adminRole: "Marketing" },
  { name: "Ahmad Wijaya", email: "ahmad.wijaya@ampmbg.id", adminRole: "IT" },
  { name: "Dewi Lestari", email: "dewi.lestari@ampmbg.id", adminRole: "Finance" },
  { name: "Eko Prasetyo", email: "eko.prasetyo@ampmbg.id", adminRole: "Operations" },
]

const associateAccounts = [
  { nik: "3275012345670001", name: "PT Sumber Pangan Nusantara", email: "contact@sumberpangan.id", phone: "+6281234567001", memberType: "supplier" as const, isVerified: true, isActive: true },
  { nik: "3275012345670002", name: "CV Dapur Sehat Indonesia", email: "info@dapursehat.id", phone: "+6281234567002", memberType: "caterer" as const, isVerified: true, isActive: true },
  { nik: "3275012345670003", name: "SDN 01 Menteng", email: "sdn01menteng@edu.id", phone: "+6281234567003", memberType: "school" as const, isVerified: false, isActive: true },
  { nik: "3275012345670004", name: "Dinas Pendidikan Kota Bogor", email: "disdik@bogor.go.id", phone: "+6281234567004", memberType: "government" as const, isVerified: false, isActive: true },
  { nik: "3275012345670005", name: "Yayasan Gizi Anak Bangsa", email: "info@ygab.or.id", phone: "+6281234567005", memberType: "ngo" as const, isVerified: false, isActive: false },
]

async function seedAccounts() {
  console.log("Seeding accounts...")

  const defaultPassword = await Bun.password.hash("Admin@123!", { algorithm: "bcrypt", cost: 10 })

  // Seed admins
  for (const admin of adminAccounts) {
    const existing = await db.query.users.findFirst({ where: eq(schema.users.email, admin.email) })
    if (!existing) {
      await db.insert(schema.users).values({
        name: admin.name,
        email: admin.email,
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

  // Seed associates
  for (const associate of associateAccounts) {
    const existingEmail = await db.query.users.findFirst({ where: eq(schema.users.email, associate.email) })
    const existingNik = await db.query.users.findFirst({ where: eq(schema.users.nik, associate.nik) })
    if (!existingEmail && !existingNik) {
      await db.insert(schema.users).values({
        nik: associate.nik,
        name: associate.name,
        email: associate.email,
        phone: associate.phone,
        password: defaultPassword,
        role: "associate",
        memberType: associate.memberType,
        isVerified: associate.isVerified,
        isActive: associate.isActive,
      })
      console.log(`Created associate: ${associate.name}`)
    } else {
      console.log(`Associate exists: ${associate.name}`)
    }
  }

  console.log("Seeding complete!")
}

seedAccounts().catch(console.error).finally(() => process.exit(0))
