import { db } from "./index"
import { provinces, cities, districts } from "./schema"
import { readFileSync } from "fs"
import { resolve } from "path"

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

  const dataPath = resolve(__dirname, "../../../../indonesia-38-provinsi")

  const provincesData = parseCSV(readFileSync(`${dataPath}/provinsi.csv`, "utf-8"))
  const citiesData = parseCSV(readFileSync(`${dataPath}/kabupaten_kota.csv`, "utf-8"))
  const districtsData = parseCSV(readFileSync(`${dataPath}/kecamatan.csv`, "utf-8"))

  console.log(`Inserting ${provincesData.length} provinces...`)
  for (const prov of provincesData) {
    await db.insert(provinces).values({ id: prov.id, name: prov.name }).onConflictDoNothing()
  }

  console.log(`Inserting ${citiesData.length} cities...`)
  for (const city of citiesData) {
    const provinceId = city.id.split(".")[0]
    await db.insert(cities).values({ id: city.id, provinceId, name: city.name }).onConflictDoNothing()
  }

  console.log(`Inserting ${districtsData.length} districts...`)
  for (const dist of districtsData) {
    const parts = dist.id.split(".")
    const cityId = `${parts[0]}.${parts[1]}`
    await db.insert(districts).values({ id: dist.id, cityId, name: dist.name }).onConflictDoNothing()
  }

  console.log("Seeding complete!")
  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed error:", err)
  process.exit(1)
})
