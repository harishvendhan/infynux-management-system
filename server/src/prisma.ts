import { PrismaClient } from '@prisma/client';
import { localDb } from './services/localDb';

let realPrisma: PrismaClient | null = null;
let isPostgresAvailable = false;

function isConnectionError(err: any): boolean {
  if (!err) return false;
  const msg = err.message || String(err);
  return (
    msg.includes("Can't reach database server") ||
    msg.includes('connection refused') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('P1001') ||
    msg.includes('P1002') ||
    msg.includes('ETIMEDOUT')
  );
}

try {
  realPrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  // Test connection asynchronously
  realPrisma
    .$connect()
    .then(() => {
      isPostgresAvailable = true;
      console.log('✅ Connected to PostgreSQL database');
    })
    .catch((err) => {
      isPostgresAvailable = false;
      console.log('ℹ️ Running in local persistent storage mode (PostgreSQL offline/unreachable)');
    });
} catch (e) {
  isPostgresAvailable = false;
}

export const getDbConnectionStatus = () => ({
  connected: isPostgresAvailable,
  mode: isPostgresAvailable ? 'PostgreSQL' : 'LocalPersistentStore',
});

export const prisma: any = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (prop === '$transaction') {
        return async (arg: any) => {
          if (isPostgresAvailable && realPrisma) {
            try {
              return await (realPrisma as any).$transaction(arg);
            } catch (err: any) {
              if (isConnectionError(err)) {
                isPostgresAvailable = false;
                return (localDb as any).$transaction(arg);
              }
              throw err;
            }
          }
          return (localDb as any).$transaction(arg);
        };
      }

      if (prop === '$queryRaw') {
        return async (...args: any[]) => {
          if (isPostgresAvailable && realPrisma) {
            try {
              return await (realPrisma as any).$queryRaw(...args);
            } catch (err: any) {
              if (isConnectionError(err)) {
                isPostgresAvailable = false;
                return (localDb as any).$queryRaw(...args);
              }
              throw err;
            }
          }
          return (localDb as any).$queryRaw(...args);
        };
      }

      if (prop === '$connect' || prop === '$disconnect') {
        return async () => {};
      }

      const localModel = (localDb as any)[prop];
      if (!localModel) {
        return (realPrisma as any)?.[prop];
      }

      return new Proxy(localModel, {
        get(targetModel, action: string) {
          return async (...args: any[]) => {
            if (isPostgresAvailable && realPrisma && (realPrisma as any)[prop]?.[action]) {
              try {
                return await (realPrisma as any)[prop][action](...args);
              } catch (err: any) {
                if (isConnectionError(err)) {
                  console.warn(`⚠️ PostgreSQL unavailable for ${prop}.${action}, using local store.`);
                  isPostgresAvailable = false;
                  if (typeof targetModel[action] === 'function') {
                    return targetModel[action](...args);
                  }
                }
                throw err;
              }
            }

            if (typeof targetModel[action] === 'function') {
              return targetModel[action](...args);
            }
            return null;
          };
        },
      });
    },
  }
);
