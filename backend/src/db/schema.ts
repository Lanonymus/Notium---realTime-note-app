import { pgTable, text, timestamp, serial, jsonb } from "drizzle-orm/pg-core"

// Tabela użytkowników
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull()
})

// Tabela projektów
export const project = pgTable("projects", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    editorContent: jsonb("editor_content").$type<Record<string, any>>().default({}),
    chatMessages: jsonb("chat_messages").default([]),
    userId: serial("user_id").references(() => users.id).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
})