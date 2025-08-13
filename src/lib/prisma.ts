// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';

// Этот трюк предотвращает создание множества подключений к БД в режиме разработки.
// Мы либо используем существующее подключение, либо создаем новое.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], // Включаем логирование запросов для отладки
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;