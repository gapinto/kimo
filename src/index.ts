import { createServer } from './infrastructure/http/server';
import { env } from './shared/utils/env';
import { logger } from './shared/utils/logger';

/**
 * Entry point da aplicação
 */
async function bootstrap(): Promise<void> {
  try {
    // Validar variáveis de ambiente
    logger.info('Starting KIMO API...', {
      env: env.nodeEnv,
      port: env.port,
    });

    // Criar servidor
    const app = createServer();

    // Iniciar servidor
    app.listen(env.port, () => {
      logger.info(`🚀 Server is running on port ${env.port}`);
      logger.info(`📋 Environment: ${env.nodeEnv}`);
      logger.info(`🏥 Health check: http://localhost:${env.port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Iniciar aplicação
bootstrap().catch((error) => {
  logger.error('Bootstrap failed', error);
  process.exit(1);
});

