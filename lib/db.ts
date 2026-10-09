// ipahaportfolio/lib/db.ts
//
// One Prisma client per server instance, tuned for Vercel + a shared remote MySQL
// (151 connections across ALL apps on the server):
//   • a small pool per instance, so many Vercel instances can't fill MySQL
//   • connections beyond one are closed after 60s idle
//   • MySQL itself drops our connections after 180s idle — covers frozen
//     Vercel instances that will never close their own sockets
//
// ⚠ minimumIdle MUST be ≥ 1. With minimumIdle: 0 the mariadb driver never opens
//   a connection on demand — every query hangs until acquireTimeout and fails
//   with "pool timeout … active=0 idle=0". (Found on JemaCards, 2026-10-09.)
import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@/lib/generated/prisma/client'

const adapter = new PrismaMariaDb({
  host:            process.env.DATABASE_HOST,
  port:            parseInt(process.env.DATABASE_PORT || '3306'),
  user:            process.env.DATABASE_USER,
  password:        process.env.DATABASE_PASSWORD,
  database:        process.env.DATABASE_NAME,
  connectionLimit: Number(process.env.DB_POOL ?? 3), // small pool per Vercel instance
  minimumIdle:     1,      // keep one connection; 0 breaks the driver (see above)
  idleTimeout:     60,     // close extra unused connections after 60s
  connectTimeout:  5_000,  // driver default (1s) is too tight for a remote DB
  acquireTimeout:  15_000, // must be well above connectTimeout
  // MySQL itself drops our connections after 3 min idle, even ones held
  // by frozen Vercel instances that will never close them
  sessionVariables: { wait_timeout: 180 },
  ssl:             { rejectUnauthorized: false },
})

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Cache in every environment, so each instance has exactly one pool
export const prismadb = globalForPrisma.prisma ?? new PrismaClient({ adapter })
globalForPrisma.prisma = prismadb


// // ipahaportfolio/lib/db.ts

// // lib/db.ts
// import 'dotenv/config'
// import { PrismaMariaDb } from '@prisma/adapter-mariadb'
// import { PrismaClient } from '@/lib/generated/prisma/client'

// const adapter = new PrismaMariaDb({
//   host: process.env.DATABASE_HOST,
//   port: parseInt(process.env.DATABASE_PORT || '3306'),
//   user: process.env.DATABASE_USER,
//   password: process.env.DATABASE_PASSWORD,
//   database: process.env.DATABASE_NAME,
//   connectionLimit: 5,
//   ssl: { rejectUnauthorized: false }, // ← MAKE SURE THIS IS HERE
// })

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined
// }

// export const prismadb = 
//   globalForPrisma.prisma ?? 
//   new PrismaClient({ 
//     adapter,
//     // log: ["query", "info", "warn", "error"] 
//   })

// if (process.env.NODE_ENV !== 'production') {
//   globalForPrisma.prisma = prismadb
// }