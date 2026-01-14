import { pgTable, text, timestamp, varchar, pgEnum, uuid, boolean, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const roleEnum = pgEnum("role", ["user", "admin", "moderator", "member"])
export const organizationEnum = pgEnum("organization", ["supplier", "caterer", "school", "government", "ngo", "other"])
export const reportStatusEnum = pgEnum("report_status", ["pending", "verified", "in_progress", "resolved", "rejected"])
export const reportCategoryEnum = pgEnum("report_category", ["poisoning", "kitchen", "quality", "policy", "implementation", "social"])

export const provinces = pgTable("provinces", {
  id: varchar("id", { length: 2 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
})

export const cities = pgTable("cities", {
  id: varchar("id", { length: 5 }).primaryKey(),
  provinceId: varchar("province_id", { length: 2 }).references(() => provinces.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
}, (table) => [index("cities_province_idx").on(table.provinceId)])

export const districts = pgTable("districts", {
  id: varchar("id", { length: 8 }).primaryKey(),
  cityId: varchar("city_id", { length: 5 }).references(() => cities.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
}, (table) => [index("districts_city_idx").on(table.cityId)])

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  nik: varchar("nik", { length: 16 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  phone: varchar("phone", { length: 20 }).unique(),
  password: text("password").notNull(),
  name: varchar("name", { length: 255 }),
  role: roleEnum("role").default("user").notNull(),
  organization: organizationEnum("organization"),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  category: reportCategoryEnum("category").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  provinceId: varchar("province_id", { length: 2 }).references(() => provinces.id).notNull(),
  cityId: varchar("city_id", { length: 5 }).references(() => cities.id).notNull(),
  districtId: varchar("district_id", { length: 8 }).references(() => districts.id),
  incidentDate: timestamp("incident_date").notNull(),
  status: reportStatusEnum("status").default("pending").notNull(),
  relation: varchar("relation", { length: 100 }),
  relationDetail: varchar("relation_detail", { length: 255 }),
  reporterName: varchar("reporter_name", { length: 255 }),
  reporterPhone: varchar("reporter_phone", { length: 20 }),
  reporterEmail: varchar("reporter_email", { length: 255 }),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("reports_province_idx").on(table.provinceId),
  index("reports_city_idx").on(table.cityId),
  index("reports_category_idx").on(table.category),
  index("reports_status_idx").on(table.status),
])

export const reportFiles = pgTable("report_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").references(() => reports.id, { onDelete: "cascade" }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: varchar("file_size", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const provincesRelations = relations(provinces, ({ many }) => ({
  cities: many(cities),
}))

export const citiesRelations = relations(cities, ({ one, many }) => ({
  province: one(provinces, { fields: [cities.provinceId], references: [provinces.id] }),
  districts: many(districts),
}))

export const districtsRelations = relations(districts, ({ one }) => ({
  city: one(cities, { fields: [districts.cityId], references: [cities.id] }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  reports: many(reports),
  sessions: many(sessions),
}))

export const reportsRelations = relations(reports, ({ one, many }) => ({
  user: one(users, { fields: [reports.userId], references: [users.id] }),
  province: one(provinces, { fields: [reports.provinceId], references: [provinces.id] }),
  city: one(cities, { fields: [reports.cityId], references: [cities.id] }),
  district: one(districts, { fields: [reports.districtId], references: [districts.id] }),
  files: many(reportFiles),
}))

export const reportFilesRelations = relations(reportFiles, ({ one }) => ({
  report: one(reports, { fields: [reportFiles.reportId], references: [reports.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))
