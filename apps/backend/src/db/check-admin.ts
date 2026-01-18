import { db, schema } from "./index"
import { eq } from "drizzle-orm"

async function checkAdmin() {
  const admins = await db.select({
    id: schema.users.id,
    email: schema.users.email,
    name: schema.users.name,
    role: schema.users.role,
    adminRole: schema.users.adminRole,
    isVerified: schema.users.isVerified,
    isActive: schema.users.isActive,
  }).from(schema.users).where(eq(schema.users.role, "admin"))

  console.log("Admin users:", admins.length)
  admins.forEach((a, i) => {
    console.log(`${i + 1}. ${a.email} | ${a.name} | role: ${a.role} | adminRole: ${a.adminRole} | verified: ${a.isVerified}`)
  })

  // Check specific admin
  const specificAdmin = await db.query.users.findFirst({
    where: eq(schema.users.email, "admin@ampmbg.id")
  })
  console.log("\nSpecific admin@ampmbg.id:", specificAdmin ? `Found - role: ${specificAdmin.role}` : "Not found")
}

checkAdmin().catch(console.error).finally(() => process.exit(0))
