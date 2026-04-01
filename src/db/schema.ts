import {
  pgTable,
  text,
  timestamp,
  integer,
  serial,
  varchar,
  boolean,
  real,
  jsonb,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ============================================================================
// Auth.js tables
// ============================================================================

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  role: text("role", { enum: ["admin", "manager", "user"] })
    .notNull()
    .default("user"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);

// ============================================================================
// Application tables
// ============================================================================

export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  candidateName: text("candidate_name").notNull(),
  candidateEmail: text("candidate_email").notNull(),
  targetRole: text("target_role", {
    enum: ["sysadmin", "architect", "ops"],
  }).notNull(),
  answers: jsonb("answers").notNull().default({}),
  overallScore: integer("overall_score"),
  avgPrereq: real("avg_prereq"),
  avgOpenstack: real("avg_openstack"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  completedAt: timestamp("completed_at", { mode: "date" }),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).unique().notNull(),
  category: varchar("category", { length: 200 }).notNull(),
  levels: jsonb("levels").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const baselines = pgTable("baselines", {
  id: serial("id").primaryKey(),
  roleKey: varchar("role_key", { length: 50 }).unique().notNull(),
  label: varchar("label", { length: 200 }).notNull(),
  description: text("description"),
  targets: jsonb("targets").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const trainingModules = pgTable("training_modules", {
  id: serial("id").primaryKey(),
  moduleKey: varchar("module_key", { length: 50 }).unique().notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content"),
  linkedQuestionKeys: jsonb("linked_question_keys"),
  providers: jsonb("providers"),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

// ============================================================================
// Type exports
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Assessment = typeof assessments.$inferSelect;
export type NewAssessment = typeof assessments.$inferInsert;

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

export type Baseline = typeof baselines.$inferSelect;
export type NewBaseline = typeof baselines.$inferInsert;

export type TrainingModule = typeof trainingModules.$inferSelect;
export type NewTrainingModule = typeof trainingModules.$inferInsert;
