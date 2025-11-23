import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/utils/logger';

/**
 * PrismaClient Singleton
 * Garante uma única instância do Prisma em toda a aplicação
 * Princípio: Singleton Pattern
 */

// Extend NodeJS global type para adicionar prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Criar instância única
const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
};

// Use global.prisma para evitar múltiplas instâncias em hot-reload (dev)
const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  logger.info('Disconnecting Prisma Client...');
  await prisma.$disconnect();
});

export { prisma };

