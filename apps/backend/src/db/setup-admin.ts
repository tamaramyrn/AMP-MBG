import { db, schema } from "./index"
import { eq } from "drizzle-orm"

async function setupAdmin() {
  const email = "admin@ampmbg.id"
  const password = await Bun.password.hash("Admin@123!", { algorithm: "bcrypt", cost: 10 })

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) })

  if (existing) {
    await db.update(schema.users)
      .set({ password, role: "admin", adminRole: "Director", isVerified: true, isActive: true })
      .where(eq(schema.users.id, existing.id))
    console.log(`Updated admin: ${email}`)
  } else {
    await db.insert(schema.users).values({
      name: "Admin AMP MBG",
      email,
      password,
      role: "admin",
      adminRole: "Director",
      isVerified: true,
      isActive: true,
    })
    console.log(`Created admin: ${email}`)
  }

  console.log("Admin setup complete! Login with:")
  console.log(`  Email: ${email}`)
  console.log("  Password: Admin@123!")
}

setupAdmin().catch(console.error).finally(() => process.exit(0))
