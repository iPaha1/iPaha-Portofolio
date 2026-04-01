
// lib/db.ts
import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@/lib/generated/prisma/client'

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
  ssl: { rejectUnauthorized: false }, // ← MAKE SURE THIS IS HERE
})

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prismadb = 
  globalForPrisma.prisma ?? 
  new PrismaClient({ 
    adapter,
    // log: ["query", "info", "warn", "error"] 
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismadb
}