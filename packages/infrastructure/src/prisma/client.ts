import { PrismaClient } from '@prisma/client';

let client: PrismaClient | null = null;
let ready: Promise<void> | null = null;

/**
 * Instancia única de PrismaClient para el proceso `main` de Electron.
 * Nunca se importa desde el renderer.
 */
export function getPrismaClient(): PrismaClient {
  if (!client) {
    client = new PrismaClient();
  }
  return client;
}

/**
 * Configura SQLite para uso concurrente real (WAL + busy_timeout). Sin esto,
 * una operación con muchas escrituras seguidas (p.ej. confirmar una
 * importación de cientos de productos) puede chocar con cualquier otra
 * lectura/escritura simultánea y SQLite falla de inmediato con "database is
 * locked" o timeout, en vez de esperar. Debe llamarse una sola vez al
 * arrancar la app, antes de atender cualquier IPC.
 */
export function ensureDatabaseReady(): Promise<void> {
  if (!ready) {
    const prisma = getPrismaClient();
    ready = (async () => {
      // `PRAGMA ... = valor` en SQLite devuelve una fila con el valor
      // resultante — Prisma exige `$queryRawUnsafe` (no `$executeRawUnsafe`)
      // para cualquier statement que devuelva filas, aunque sea un PRAGMA.
      await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
      await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;');
    })();
  }
  return ready;
}
