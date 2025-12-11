import { index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  clerkId: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  imageUrl: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const workspacesTable = pgTable("workspaces", {
  id: uuid().primaryKey().defaultRandom(),
  clerkId: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  content: jsonb("content")
    .$type<Record<string, unknown> | null>()
    .default(null),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
}, (table) => ({
  clerkIdIdx: index("clerk_id_idx").on(table.clerkId),
}));

export const usersRelations = relations(usersTable, ({ many }) => ({
  workspaces: many(workspacesTable),
}));

export const workspacesRelations = relations(workspacesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [workspacesTable.clerkId],
    references: [usersTable.clerkId],
  }),
}));

export type Workspace = InferSelectModel<typeof workspacesTable>;
export type NewWorkspace = InferInsertModel<typeof workspacesTable>;
