import { Hono } from "hono"
import { eq } from "drizzle-orm"
import { db, schema } from "../db"

const locations = new Hono()

locations.get("/provinces", async (c) => {
  const data = await db.query.provinces.findMany({
    orderBy: (provinces, { asc }) => [asc(provinces.name)],
  })

  return c.json({ data })
})

locations.get("/provinces/:provinceId/cities", async (c) => {
  const provinceId = c.req.param("provinceId")

  const data = await db.query.cities.findMany({
    where: eq(schema.cities.provinceId, provinceId),
    orderBy: (cities, { asc }) => [asc(cities.name)],
  })

  return c.json({ data })
})

locations.get("/cities/:cityId/districts", async (c) => {
  const cityId = c.req.param("cityId")

  const data = await db.query.districts.findMany({
    where: eq(schema.districts.cityId, cityId),
    orderBy: (districts, { asc }) => [asc(districts.name)],
  })

  return c.json({ data })
})

locations.get("/search", async (c) => {
  const query = c.req.query("q")?.toLowerCase() || ""
  const type = c.req.query("type") || "all"

  if (query.length < 2) {
    return c.json({ data: [] })
  }

  const results: { type: string; id: string; name: string; parent?: string }[] = []

  if (type === "all" || type === "province") {
    const provinces = await db.query.provinces.findMany()
    for (const p of provinces) {
      if (p.name.toLowerCase().includes(query)) {
        results.push({ type: "province", id: p.id, name: p.name })
      }
    }
  }

  if (type === "all" || type === "city") {
    const cities = await db.query.cities.findMany({ with: { province: true } })
    for (const c of cities) {
      if (c.name.toLowerCase().includes(query)) {
        results.push({ type: "city", id: c.id, name: c.name, parent: c.province?.name })
      }
    }
  }

  if (type === "all" || type === "district") {
    const districts = await db.query.districts.findMany({ with: { city: { with: { province: true } } } })
    for (const d of districts) {
      if (d.name.toLowerCase().includes(query)) {
        results.push({ type: "district", id: d.id, name: d.name, parent: `${d.city?.name}, ${d.city?.province?.name}` })
      }
    }
  }

  return c.json({ data: results.slice(0, 20) })
})

export default locations
