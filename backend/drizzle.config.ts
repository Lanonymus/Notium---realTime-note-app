import { defineConfig } from 'drizzle-kit';
import dotenv from "dotenv"

dotenv.config()

export default defineConfig({
    
    // Typ bazy danych
    dialect: "postgresql",

    // Plik z modelami tabel
    schema: "./src/db/schema.ts",

    // folder do którego drizzle wrzuca przekonwertowane pliki SQL
    out: "./drizzle",

    // Link do podłączenia się do bazy danych w Neon
    dbCredentials: {
        url: process.env.DATABASE_URL!
    },
})