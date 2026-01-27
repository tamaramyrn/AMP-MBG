import { pgTable, text, timestamp, varchar, pgEnum, uuid, boolean, index, integer, smallint } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// User role enum: admin=dashboard, member=anggota MBG, public=masyarakat
export const roleEnum = pgEnum("role", ["admin", "member", "public"])

// Member type enum for anggota MBG
export const memberTypeEnum = pgEnum("member_type", ["supplier", "caterer", "school", "government", "foundation", "ngo", "farmer", "other"])

// Credibility level for reports
export const credibilityLevelEnum = pgEnum("credibility_level", ["high", "medium", "low"])

// Report status workflow
export const reportStatusEnum = pgEnum("report_status", ["pending", "verified", "in_progress", "resolved", "rejected"])

// Report category types
export const reportCategoryEnum = pgEnum("report_category", ["poisoning", "kitchen", "quality", "policy", "implementation", "social"])

// Reporter relation to MBG
export const relationEnum = pgEnum("relation", ["parent", "teacher", "principal", "supplier", "student", "community", "other"])

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

// MBG schedule - tracks where and when MBG program runs
export const mbgSchedules = pgTable("mbg_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolName: varchar("school_name", { length: 255 }).notNull(),
  provinceId: varchar("province_id", { length: 2 }).references(() => provinces.id).notNull(),
  cityId: varchar("city_id", { length: 5 }).references(() => cities.id).notNull(),
  districtId: varchar("district_id", { length: 8 }).references(() => districts.id),
  address: text("address"),
  // Schedule: 1=Monday, 2=Tuesday, ..., 5=Friday
  scheduleDays: varchar("schedule_days", { length: 10 }).default("12345").notNull(),
  startTime: varchar("start_time", { length: 5 }).default("07:00").notNull(),
  endTime: varchar("end_time", { length: 5 }).default("12:00").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("mbg_schedules_province_idx").on(table.provinceId),
  index("mbg_schedules_city_idx").on(table.cityId),
  index("mbg_schedules_district_idx").on(table.districtId),
])

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  phone: varchar("phone", { length: 15 }).unique(),
  password: text("password"),
  name: varchar("name", { length: 255 }).notNull(),
  role: roleEnum("role").default("public").notNull(),
  memberType: memberTypeEnum("member_type"),
  adminRole: varchar("admin_role", { length: 100 }),
  organizationName: varchar("organization_name", { length: 255 }),
  organizationEmail: varchar("organization_email", { length: 255 }),
  organizationPhone: varchar("organization_phone", { length: 20 }),
  roleInOrganization: text("role_in_organization"),
  organizationMbgRole: text("organization_mbg_role"),
  appliedAt: timestamp("applied_at"),
  verifiedAt: timestamp("verified_at"),
  isVerified: boolean("is_verified").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  reportCount: integer("report_count").default(0).notNull(),
  verifiedReportCount: integer("verified_report_count").default(0).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("users_email_idx").on(table.email),
  index("users_role_idx").on(table.role),
])

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  category: reportCategoryEnum("category").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  provinceId: varchar("province_id", { length: 2 }).references(() => provinces.id).notNull(),
  cityId: varchar("city_id", { length: 5 }).references(() => cities.id).notNull(),
  districtId: varchar("district_id", { length: 8 }).references(() => districts.id),
  incidentDate: timestamp("incident_date").notNull(),
  status: reportStatusEnum("status").default("pending").notNull(),
  relation: relationEnum("relation").notNull(),
  relationDetail: varchar("relation_detail", { length: 255 }),

  // Scoring fields (0-3 each, total 0-18)
  scoreRelation: smallint("score_relation").default(0).notNull(),
  scoreLocationTime: smallint("score_location_time").default(0).notNull(),
  scoreEvidence: smallint("score_evidence").default(0).notNull(),
  scoreNarrative: smallint("score_narrative").default(0).notNull(),
  scoreReporterHistory: smallint("score_reporter_history").default(0).notNull(),
  scoreSimilarity: smallint("score_similarity").default(0).notNull(),
  totalScore: smallint("total_score").default(0).notNull(),
  credibilityLevel: credibilityLevelEnum("credibility_level").default("low").notNull(),

  adminNotes: text("admin_notes"),
  verifiedBy: uuid("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("reports_user_idx").on(table.userId),
  index("reports_province_idx").on(table.provinceId),
  index("reports_city_idx").on(table.cityId),
  index("reports_district_idx").on(table.districtId),
  index("reports_category_idx").on(table.category),
  index("reports_status_idx").on(table.status),
  index("reports_incident_date_idx").on(table.incidentDate),
  index("reports_created_at_idx").on(table.createdAt),
  index("reports_credibility_idx").on(table.credibilityLevel),
  index("reports_total_score_idx").on(table.totalScore),
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
  userAgent: varchar("user_agent", { length: 500 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  isRevoked: boolean("is_revoked").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("sessions_user_idx").on(table.userId),
  index("sessions_token_idx").on(table.token),
  index("sessions_expires_idx").on(table.expiresAt),
])

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 64 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("password_reset_user_idx").on(table.userId),
  index("password_reset_token_idx").on(table.token),
])

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 64 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("email_verification_user_idx").on(table.userId),
  index("email_verification_token_idx").on(table.token),
])

// Report status history for audit
export const reportStatusHistory = pgTable("report_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").references(() => reports.id, { onDelete: "cascade" }).notNull(),
  fromStatus: reportStatusEnum("from_status"),
  toStatus: reportStatusEnum("to_status").notNull(),
  changedBy: uuid("changed_by").references(() => users.id).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("status_history_report_idx").on(table.reportId),
  index("status_history_changed_by_idx").on(table.changedBy),
])

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

export const mbgSchedulesRelations = relations(mbgSchedules, ({ one }) => ({
  province: one(provinces, { fields: [mbgSchedules.provinceId], references: [provinces.id] }),
  city: one(cities, { fields: [mbgSchedules.cityId], references: [cities.id] }),
  district: one(districts, { fields: [mbgSchedules.districtId], references: [districts.id] }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  reports: many(reports),
  sessions: many(sessions),
  passwordResetTokens: many(passwordResetTokens),
  emailVerificationTokens: many(emailVerificationTokens),
}))

export const reportsRelations = relations(reports, ({ one, many }) => ({
  user: one(users, { fields: [reports.userId], references: [users.id] }),
  province: one(provinces, { fields: [reports.provinceId], references: [provinces.id] }),
  city: one(cities, { fields: [reports.cityId], references: [cities.id] }),
  district: one(districts, { fields: [reports.districtId], references: [districts.id] }),
  verifier: one(users, { fields: [reports.verifiedBy], references: [users.id] }),
  files: many(reportFiles),
  statusHistory: many(reportStatusHistory),
}))

export const reportFilesRelations = relations(reportFiles, ({ one }) => ({
  report: one(reports, { fields: [reportFiles.reportId], references: [reports.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const reportStatusHistoryRelations = relations(reportStatusHistory, ({ one }) => ({
  report: one(reports, { fields: [reportStatusHistory.reportId], references: [reports.id] }),
  changedByUser: one(users, { fields: [reportStatusHistory.changedBy], references: [users.id] }),
}))

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}))

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, { fields: [emailVerificationTokens.userId], references: [users.id] }),
}))
