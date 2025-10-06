import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  real,
  serial,
  primaryKey,
  date,
  jsonb,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------- Enums ----------------
export const scopeEnum = pgEnum("scope", ["user", "admin", "dev"]);
export const roleEnum = pgEnum("role", ["user", "admin", "dev"]);
export const verificationEnum = pgEnum("verification-type", ["verify", "forgot"])
export const toolsAndSimulationsEnum = pgEnum("tools-and-simulations-type", ["tool", "simulation"])

// ---------------- Primitive and GitHub Token Tables ----------------
export const primitiveUsersTable = pgTable(
  "primitive_users",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    name: varchar("name", { length: 255 }).unique().notNull(),
    used: boolean("used").default(false).notNull(),
  },
  (table) => [
    index("primitive_users_name_idx").on(table.name),
  ]
);


// ---------------- Users Table (NextAuth Compatible) ----------------
export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    name: varchar("name", { length: 255 }),
    publicName: varchar("public_name", { length: 255 }),
    year: varchar("year", { length: 255 }),
    role: roleEnum("role").notNull(),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    image: text("image"),
    password: text("password"),
    primitiveId: uuid("primitive_id").references(() => primitiveUsersTable.id, { onDelete: "cascade" }),

    loginCount: integer("login_count").default(0).notNull(),
    weeklyChallengesScore: real("weekly_challenges_score").default(0).notNull(),
    flags: jsonb('flags').$type<Record<string, boolean>>().default({ is_verified: false, is_complete_user_info: false, is_complete_subjects: false }).notNull(),
  },
  (table) => [
    unique("users_email_idx").on(table.email),
    unique("users_name_idx").on(table.name),
    index("users_year_idx").on(table.year),
  ]
);

// ---------------- NextAuth Tables ----------------
export const accountsTable = pgTable(
  "accounts",
  {
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    index("accounts_user_id_idx").on(table.userId),
  ]
);

export const sessionsTable = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
  ]
);

export const verificationTokensTable = pgTable(
  "verification_tokens",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    token: text("token").notNull(),
    type: verificationEnum("type").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => [
    // Composite index for queries by user_id, type, expires
    index("verification_tokens_user_type_expires_idx").on(
      table.userId,
      table.type,
      table.expires
    ),

    // Optional: if you often search only by token + type
    index("verification_tokens_type_expires_idx").on(table.type, table.expires),
  ]
);


// ---------------- Custom Tables ----------------
export const messagesTable = pgTable(
  "messages",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    scope: scopeEnum("scope").notNull(),
    year: varchar("year", { length: 255 }),
    created_at: timestamp("created_at").defaultNow().notNull(),
    user_id: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("messages_user_id_idx").on(table.user_id),
    index("messages_created_at_idx").on(table.created_at),
  ]
);


export const primitiveSubjectsTable = pgTable(
  "primitive_subjects",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    qual: real("qual").array().default(sql`ARRAY[0,0]::real[]`),
    diff: real("diff").array().default(sql`ARRAY[0,0]::real[]`),
    year: integer("year"),
    quadri: integer("quadri").notNull(),
    credits: real("credits").notNull(),
    professors: varchar("professors", { length: 255 }).array().notNull().default(sql`'{}'`),
    emails: varchar("emails", { length: 255 }).array().notNull().default(sql`'{}'`),
    info: jsonb("info").$type<Record<string, string | string[]>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("primitive_subjects_name_idx").on(table.name),
  ]
);


export const primitiveSubjectsAuditTable = pgTable(
  "primitive_subjects_audit", 
    {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    subjectId: varchar("subject_id", { length: 255 }).notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    newData: jsonb("new_data").notNull(),
    changedBy: uuid("changed_by").notNull(),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
  },
    (table) => [
      // Index for all audits ordered by date
      index("primitive_subjects_audit_changed_at_idx").on(table.changedAt),

      // Index for audits filtered by subject_id and ordered by date
      index("primitive_subjects_audit_subject_id_changed_at_idx").on(
        table.subjectId,
        table.changedAt
      ),
    ]
);



export const subjectsTable = pgTable(
  "subjects",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    archived: boolean("archived").default(false),
    qual: real("qual"),
    diff: real("diff"),
    primitiveId: varchar("primitive_id", { length: 255 })
      .notNull()
      .references(() => primitiveSubjectsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("subjects_primitive_id_idx").on(table.primitiveId),
    index("subjects_user_id_idx").on(table.userId),
    index("subjects_user_primitive_idx").on(table.userId, table.primitiveId),

  ]
);


export const toolsAndSimulationsTable = pgTable(
  "tools_and_simulations",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    hrefName: varchar("href_name", { length: 255 }).unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: toolsAndSimulationsEnum("type").notNull(),
    link: text("link"),
    tags: varchar("tags", { length: 255 }).array().notNull().default(sql`'{}'`),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    anonymous: boolean("anonymous").default(false).notNull(),
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  }
)

// export const eventsTable = pgTable(
//   "events",
//   {
//     id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
//     name: varchar("name", { length: 255 }).notNull(),
//     description: text("description"),
//     date: date("date").notNull(),
//     time: varchar("time", { length: 255 }),
//     scope: scopeEnum("scope").notNull(),
//     user_id: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
//     subject_id: uuid("subject_id").references(() => subjectsTable.id, { onDelete: "cascade" }),
//     primitive_id: varchar("primitive_id", { length: 255 }).notNull(),
//   },
//   (table) => [
//     index("events_user_id_idx").on(table.user_id),
//     index("events_subject_id_idx").on(table.subject_id),
//     index("events_date_idx").on(table.date),
//     index("events_scope_idx").on(table.scope),
//     index("events_primitive_scope_idx").on(table.primitive_id, table.scope),
//     index("events_user_scope_idx").on(table.user_id, table.scope),
//   ]
// );

export const resourcesPostsTable = pgTable(
  "resources_posts",
  {
    id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    fileNames: text("filenames").array().notNull(),
    folderName: varchar("foldername", { length: 255 }).notNull(),
    links: text("links").array().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    anonymous: boolean("anonymous").default(false).notNull(),
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    subjectId: varchar("subject_id", { length: 255 }).notNull().default("11111111")
  },
  (table) => [
    index("main_posts_user_id_idx").on(table.userId),
  ]
);


export const resourcesPostsAuditTable = pgTable("resources_posts_audit", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  subjectId: varchar("subject_id", { length: 255 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  newData: jsonb("new_data").notNull(),
  changedBy: uuid("changed_by").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
},
  (table) => [
    // Index for all audits ordered by date
    index("resources_posts_audit_changed_at_idx").on(table.changedAt),

    // Index for audits filtered by subject_id and ordered by date
    index("resources_posts_audit_subject_id_changed_at_idx").on(
      table.subjectId,
      table.changedAt
    ),
  ]
);


// export const weeklyChallengesTable = pgTable(
//   "weekly_challenges",
//   {
//     id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
//     title: text("title").notNull(),
//     description: text("description"),
//     is_multiple_choice: boolean("is_multiple_choice").default(false).notNull(),
//     options: text("options").array(),
//     correct_answer: text("correct_answer").array().default(sql`ARRAY[]::text[]`),
//     suggested: boolean("suggested").default(false).notNull(),
//     difficulty: integer("difficulty").default(3).notNull(),
//     deadline: timestamp("deadline"),
//     created_at: timestamp("created_at").defaultNow().notNull(),
//     user_id: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
//   },
//   (table) => [
//     index("weekly_challenges_user_id_idx").on(table.user_id),
//     index("weekly_challenges_difficulty_idx").on(table.difficulty),
//     index("weekly_challenges_deadline_idx").on(table.deadline),
//   ]
// );

// export const weeklyChallengeAnswersTable = pgTable(
//   "weekly_challenge_answers",
//   {
//     challenge_id: uuid("challenge_id").notNull().references(() => weeklyChallengesTable.id, { onDelete: "cascade" }),
//     user_id: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
//     answer: text("answer").notNull(),
//     score: real("score"),
//     created_at: timestamp("created_at").defaultNow().notNull(),
//   },
//   (table) => [
//     primaryKey({ columns: [table.challenge_id, table.user_id] }),
//     index("weekly_answers_challenge_id_idx").on(table.challenge_id),
//     index("weekly_answers_user_id_idx").on(table.user_id),
//     sql`CHECK (${table.score} >= 0 AND ${table.score} <= 100)`,
//   ]
// );

// ---------------- Types ----------------
export type User = typeof usersTable.$inferSelect;
export type PrimitiveUser = typeof primitiveUsersTable.$inferSelect;
export type Subject = typeof subjectsTable.$inferSelect;
export type PrimitiveSubject = typeof primitiveSubjectsTable.$inferSelect;
export type primitiveSubjectsAuditTable = typeof primitiveSubjectsAuditTable.$inferSelect;
export type ToolOrSimulation = typeof toolsAndSimulationsTable.$inferSelect;
// export type Event = typeof eventsTable.$inferSelect;
export type ResourcesPost = typeof resourcesPostsTable.$inferSelect;
export type ResourcesPostsAudit = typeof resourcesPostsAuditTable.$inferSelect;
// export type WeeklyChallenge = typeof weeklyChallengesTable.$inferSelect;
// export type WeeklyChallengeAnswer = typeof weeklyChallengeAnswersTable.$inferSelect;
export type VerificationToken = typeof verificationTokensTable.$inferSelect;
export type Message = typeof messagesTable.$inferSelect;

// export type PrimitiveUserInsert = typeof primitiveUsersTable.$inferInsert;
// export type UserInsert = typeof usersTable.$inferInsert;
// export type EventInsert = typeof eventsTable.$inferInsert;
// export type MainPostInsert = typeof resourcesPostsTable.$inferInsert;
// export type WeeklyChallengeInsert = typeof weeklyChallengesTable.$inferInsert;
// export type WeeklyChallengeAnswerInsert = typeof weeklyChallengeAnswersTable.$inferInsert;
// export type VerificationTokenInsert = typeof verificationTokensTable.$inferInsert;
// export type MessageInsert = typeof messagesTable.$inferInsert;
// export type PrimitiveSubjectInsert = typeof primitiveSubjectsTable.$inferInsert;


// Re-export for convenience
export * from 'drizzle-orm';
