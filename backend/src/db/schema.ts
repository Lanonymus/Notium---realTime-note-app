import { pgTable, text, timestamp, serial, jsonb, uuid } from "drizzle-orm/pg-core"

type ChatMessage = {
  id: string,
  role: "user" | "chat",
  content: string,
  context: string,
  timestamp?: string
}

// Tabela użytkowników
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull()
})

// Tabela projektów
export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    editorContent: jsonb("editor_content").$type<Record<string, any>>().default({}),
    chatMessages: jsonb("chat_messages").default([]),
    userId: uuid("user_id").references(() => users.id).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Tabela czatów
export const chats = pgTable("chats", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectID: uuid("project_id").references(() => projects.id, { onDelete: "cascade"}),
    title: text("title").notNull(),
    emoji: text("emoji").notNull(),
    messages: jsonb("messages").$type<ChatMessage[]>().default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
})