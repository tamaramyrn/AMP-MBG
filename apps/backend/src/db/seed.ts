import { db } from "./index"
import { provinces, cities, districts, users } from "./schema"
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

  const dataPath = new URL("../../../../indonesia-38-provinsi", import.meta.url).pathname

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

  // Create default admin user if not exists
  console.log("Creating default admin user...")
  const adminEmail = "admin@ampmbg.id"
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  })

  if (!existingAdmin) {
    const hashedPassword = await hashPassword("Admin@123!")
    await db.insert(users).values({
      nik: "0000000000000000",
      email: adminEmail,
      phone: "+62812345678901",
      password: hashedPassword,
      name: "Administrator",
      role: "admin",
      isVerified: true,
      isActive: true,
    })
    console.log("- Admin user created (admin@ampmbg.id / Admin@123!)")
  } else {
    console.log("- Admin user already exists")
  }

  // Create default public test user if not exists
  const testEmail = "test@ampmbg.id"
  const existingTest = await db.query.users.findFirst({
    where: eq(users.email, testEmail),
  })

  if (!existingTest) {
    const hashedPassword = await hashPassword("Test@123!")
    await db.insert(users).values({
      nik: "1234567890123456",
      email: testEmail,
      phone: "+62812345678902",
      password: hashedPassword,
      name: "Test User",
      role: "public",
      isVerified: true,
      isActive: true,
    })
    console.log("- Test user created (test@ampmbg.id / Test@123!)")
  } else {
    console.log("- Test user already exists")
  }

  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users)

  console.log(`Seeding complete!`)
  console.log(`- Provinces: ${provCount.count}`)
  console.log(`- Cities: ${cityCount.count}`)
  console.log(`- Districts: ${distCount.count}`)
  console.log(`- Users: ${userCount.count}`)

  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed error:", err)
  process.exit(1)
})
