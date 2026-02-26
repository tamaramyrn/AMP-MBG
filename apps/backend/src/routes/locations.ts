import { Hono } from "hono"
import { eq, ilike, and } from "drizzle-orm"
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

// Reverse geocode name lookup
locations.get("/lookup", async (c) => {
  const province = c.req.query("province")?.trim()
  const city = c.req.query("city")?.trim()
  const district = c.req.query("district")?.trim()

  if (!province && !city && !district) {
    return c.json({ data: null })
  }

  let provinceId: string | null = null
  let cityId: string | null = null
  let districtId: string | null = null

  if (province) {
    const found = await db.query.provinces.findFirst({
      where: ilike(schema.provinces.name, `%${province}%`),
    })
    if (found) provinceId = found.id
  }

  if (city && provinceId) {
    const found = await db.query.cities.findFirst({
      where: and(
        eq(schema.cities.provinceId, provinceId),
        ilike(schema.cities.name, `%${city}%`)
      ),
    })
    if (found) cityId = found.id
  } else if (city) {
    const found = await db.query.cities.findFirst({
      where: ilike(schema.cities.name, `%${city}%`),
    })
    if (found) {
      cityId = found.id
      provinceId = found.provinceId
    }
  }

  if (district && cityId) {
    const found = await db.query.districts.findFirst({
      where: and(
        eq(schema.districts.cityId, cityId),
        ilike(schema.districts.name, `%${district}%`)
      ),
    })
    if (found) districtId = found.id
  }

  return c.json({
    data: { provinceId, cityId, districtId },
  })
})

// Location search
locations.get("/search", async (c) => {
  const query = (c.req.query("q")?.trim() || "").slice(0, 100)
  const type = c.req.query("type") || "all"

  if (query.length < 2) {
    return c.json({ data: [] })
  }

  const searchPattern = `%${query}%`
  const results: { type: string; id: string; name: string; parent?: string }[] = []

  // ILIKE search query
  if (type === "all" || type === "province") {
    const provinces = await db.select({ id: schema.provinces.id, name: schema.provinces.name })
      .from(schema.provinces)
      .where(ilike(schema.provinces.name, searchPattern))
      .limit(10)
    results.push(...provinces.map((p) => ({ type: "province", id: p.id, name: p.name })))
  }

  if (type === "all" || type === "city") {
    const cities = await db.select({
      id: schema.cities.id,
      name: schema.cities.name,
      provinceName: schema.provinces.name,
    })
      .from(schema.cities)
      .innerJoin(schema.provinces, eq(schema.cities.provinceId, schema.provinces.id))
      .where(ilike(schema.cities.name, searchPattern))
      .limit(10)
    results.push(...cities.map((c) => ({ type: "city", id: c.id, name: c.name, parent: c.provinceName })))
  }

  if (type === "all" || type === "district") {
    const districts = await db.select({
      id: schema.districts.id,
      name: schema.districts.name,
      cityName: schema.cities.name,
      provinceName: schema.provinces.name,
    })
      .from(schema.districts)
      .innerJoin(schema.cities, eq(schema.districts.cityId, schema.cities.id))
      .innerJoin(schema.provinces, eq(schema.cities.provinceId, schema.provinces.id))
      .where(ilike(schema.districts.name, searchPattern))
      .limit(10)
    results.push(...districts.map((d) => ({
      type: "district",
      id: d.id,
      name: d.name,
      parent: `${d.cityName}, ${d.provinceName}`,
    })))
  }

  return c.json({ data: results.slice(0, 20) })
})

export default locations
