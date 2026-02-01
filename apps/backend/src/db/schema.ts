import { pgTable, text, timestamp, varchar, pgEnum, uuid, boolean, index, integer, smallint, uniqueIndex } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ============================================
// ENUMS
// ============================================

export const signupMethodEnum = pgEnum("signup_method", ["manual", "google"])
export const memberTypeEnum = pgEnum("member_type", ["supplier", "caterer", "school", "government", "foundation", "ngo", "farmer", "other"])
export const credibilityLevelEnum = pgEnum("credibility_level", ["high", "medium", "low"])
export const reportStatusEnum = pgEnum("report_status", ["pending", "analyzing", "needs_evidence", "invalid", "in_progress", "resolved"])
export const reportCategoryEnum = pgEnum("report_category", ["poisoning", "kitchen", "quality", "policy", "implementation", "social"])
export const relationEnum = pgEnum("relation", ["parent", "teacher", "principal", "supplier", "student", "community", "other"])
export const kitchenNeedsStatusEnum = pgEnum("kitchen_needs_status", ["pending", "processed", "completed", "not_found"])

// ============================================
// LOCATION TABLES
// ============================================

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

// ============================================
// ADMIN TABLE
// ============================================

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 15 }),
  adminRole: varchar("admin_role", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// ============================================
// PUBLICS TABLE (Public users - NOT admin)
// ============================================

export const publics = pgTable("publics", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  phone: varchar("phone", { length: 15 }).unique(),
  password: text("password"), // nullable for Google-only auth
  name: varchar("name", { length: 255 }).notNull(),
  signupMethod: signupMethodEnum("signup_method").default("manual").notNull(),
  googleId: varchar("google_id", { length: 255 }).unique(),
  googleEmail: varchar("google_email", { length: 255 }),
  reportCount: integer("report_count").default(0).notNull(),
  verifiedReportCount: integer("verified_report_count").default(0).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("publics_email_idx").on(table.email),
  index("publics_google_id_idx").on(table.googleId),
])

// ============================================
// MEMBERS TABLE (Extension of publics)
// ============================================

export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: uuid("public_id").references(() => publics.id, { onDelete: "cascade" }).unique().notNull(),
  memberType: memberTypeEnum("member_type").notNull(),
  organizationName: varchar("organization_name", { length: 255 }).notNull(),
  organizationEmail: varchar("organization_email", { length: 255 }),
  organizationPhone: varchar("organization_phone", { length: 20 }),
  roleInOrganization: text("role_in_organization"),
  organizationMbgRole: text("organization_mbg_role"),
  isVerified: boolean("is_verified").default(false).notNull(),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: uuid("verified_by").references(() => admins.id),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("members_public_idx").on(table.publicId),
  index("members_is_verified_idx").on(table.isVerified),
])

// ============================================
// MBG SCHEDULES
// ============================================

export const mbgSchedules = pgTable("mbg_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  schoolName: varchar("school_name", { length: 255 }).notNull(),
  provinceId: varchar("province_id", { length: 2 }).references(() => provinces.id).notNull(),
  cityId: varchar("city_id", { length: 5 }).references(() => cities.id).notNull(),
  districtId: varchar("district_id", { length: 8 }).references(() => districts.id),
  address: text("address"),
  scheduleDays: varchar("schedule_days", { length: 10 }).default("12345").notNull(),
  startTime: varchar("start_time", { length: 5 }).default("07:00").notNull(),
  endTime: varchar("end_time", { length: 5 }).default("12:00").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("mbg_schedules_province_idx").on(table.provinceId),
  index("mbg_schedules_city_idx").on(table.cityId),
])

// ============================================
// REPORTS
// ============================================

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: uuid("public_id").references(() => publics.id, { onDelete: "set null" }),
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
  scoreRelation: smallint("score_relation").default(0).notNull(),
  scoreLocationTime: smallint("score_location_time").default(0).notNull(),
  scoreEvidence: smallint("score_evidence").default(0).notNull(),
  scoreNarrative: smallint("score_narrative").default(0).notNull(),
  scoreReporterHistory: smallint("score_reporter_history").default(0).notNull(),
  scoreSimilarity: smallint("score_similarity").default(0).notNull(),
  totalScore: smallint("total_score").default(0).notNull(),
  credibilityLevel: credibilityLevelEnum("credibility_level").default("low").notNull(),
  adminNotes: text("admin_notes"),
  verifiedBy: uuid("verified_by").references(() => admins.id),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("reports_public_idx").on(table.publicId),
  index("reports_status_idx").on(table.status),
  index("reports_created_at_idx").on(table.createdAt),
  index("reports_credibility_idx").on(table.credibilityLevel),
])

export const reportFiles = pgTable("report_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").references(() => reports.id, { onDelete: "cascade" }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: varchar("file_size", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("report_files_report_idx").on(table.reportId),
])

export const reportStatusHistory = pgTable("report_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").references(() => reports.id, { onDelete: "cascade" }).notNull(),
  fromStatus: reportStatusEnum("from_status"),
  toStatus: reportStatusEnum("to_status").notNull(),
  changedBy: uuid("changed_by").references(() => admins.id).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("status_history_report_idx").on(table.reportId),
])

// ============================================
// SESSIONS
// ============================================

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: uuid("public_id").references(() => publics.id, { onDelete: "cascade" }).notNull(),
  token: text("token").unique().notNull(),
  userAgent: varchar("user_agent", { length: 500 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  isRevoked: boolean("is_revoked").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("sessions_public_idx").on(table.publicId),
  index("sessions_token_idx").on(table.token),
])

export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminId: uuid("admin_id").references(() => admins.id, { onDelete: "cascade" }).notNull(),
  token: text("token").unique().notNull(),
  userAgent: varchar("user_agent", { length: 500 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  isRevoked: boolean("is_revoked").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("admin_sessions_admin_idx").on(table.adminId),
  index("admin_sessions_token_idx").on(table.token),
])

// ============================================
// PASSWORD RESET TOKENS
// ============================================

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: uuid("public_id").references(() => publics.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 64 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("password_reset_token_idx").on(table.token),
])

// ============================================
// KITCHEN NEEDS
// ============================================

export const kitchenNeeds = pgTable("kitchen_needs", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const kitchenNeedsRequests = pgTable("kitchen_needs_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  publicId: uuid("public_id").references(() => publics.id, { onDelete: "set null" }),
  kitchenNeedId: uuid("kitchen_need_id").references(() => kitchenNeeds.id, { onDelete: "set null" }),
  sppgName: varchar("sppg_name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }).notNull(),
  position: varchar("position", { length: 100 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  details: text("details").notNull(),
  status: kitchenNeedsStatusEnum("status").default("pending").notNull(),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("kitchen_needs_requests_status_idx").on(table.status),
])

// ============================================
// RELATIONS
// ============================================

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

export const adminsRelations = relations(admins, ({ many }) => ({
  sessions: many(adminSessions),
  verifiedMembers: many(members, { relationName: "memberVerifier" }),
  verifiedReports: many(reports, { relationName: "reportVerifier" }),
  statusHistoryChanges: many(reportStatusHistory, { relationName: "statusChanger" }),
}))

export const publicsRelations = relations(publics, ({ one, many }) => ({
  member: one(members),
  reports: many(reports, { relationName: "reportAuthor" }),
  sessions: many(sessions),
  passwordResetTokens: many(passwordResetTokens),
  kitchenNeedsRequests: many(kitchenNeedsRequests, { relationName: "kitchenNeedsRequestAuthor" }),
}))

export const membersRelations = relations(members, ({ one }) => ({
  public: one(publics, { fields: [members.publicId], references: [publics.id] }),
  verifier: one(admins, { fields: [members.verifiedBy], references: [admins.id], relationName: "memberVerifier" }),
}))

export const mbgSchedulesRelations = relations(mbgSchedules, ({ one }) => ({
  province: one(provinces, { fields: [mbgSchedules.provinceId], references: [provinces.id] }),
  city: one(cities, { fields: [mbgSchedules.cityId], references: [cities.id] }),
  district: one(districts, { fields: [mbgSchedules.districtId], references: [districts.id] }),
}))

export const reportsRelations = relations(reports, ({ one, many }) => ({
  public: one(publics, { fields: [reports.publicId], references: [publics.id], relationName: "reportAuthor" }),
  province: one(provinces, { fields: [reports.provinceId], references: [provinces.id] }),
  city: one(cities, { fields: [reports.cityId], references: [cities.id] }),
  district: one(districts, { fields: [reports.districtId], references: [districts.id] }),
  verifier: one(admins, { fields: [reports.verifiedBy], references: [admins.id], relationName: "reportVerifier" }),
  files: many(reportFiles),
  statusHistory: many(reportStatusHistory),
}))

export const reportFilesRelations = relations(reportFiles, ({ one }) => ({
  report: one(reports, { fields: [reportFiles.reportId], references: [reports.id] }),
}))

export const reportStatusHistoryRelations = relations(reportStatusHistory, ({ one }) => ({
  report: one(reports, { fields: [reportStatusHistory.reportId], references: [reports.id] }),
  changedByAdmin: one(admins, { fields: [reportStatusHistory.changedBy], references: [admins.id], relationName: "statusChanger" }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  public: one(publics, { fields: [sessions.publicId], references: [publics.id] }),
}))

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  admin: one(admins, { fields: [adminSessions.adminId], references: [admins.id] }),
}))

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  public: one(publics, { fields: [passwordResetTokens.publicId], references: [publics.id] }),
}))

export const kitchenNeedsRelations = relations(kitchenNeeds, ({ many }) => ({
  requests: many(kitchenNeedsRequests),
}))

export const kitchenNeedsRequestsRelations = relations(kitchenNeedsRequests, ({ one }) => ({
  public: one(publics, { fields: [kitchenNeedsRequests.publicId], references: [publics.id], relationName: "kitchenNeedsRequestAuthor" }),
  kitchenNeed: one(kitchenNeeds, { fields: [kitchenNeedsRequests.kitchenNeedId], references: [kitchenNeeds.id] }),
}))
