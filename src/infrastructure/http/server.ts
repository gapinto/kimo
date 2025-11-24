import express, { Express, Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';
import { createWhatsAppRoutes } from './routes/whatsapp.routes';
import { SchedulerService } from '../../application/services/SchedulerService';
import { supabase } from '../database/supabase.client';
import { SupabaseUserRepository } from '../database/repositories/SupabaseUserRepository';
import { SupabaseDailySummaryRepository } from '../database/repositories/SupabaseDailySummaryRepository';
import { SupabasePendingTripRepository } from '../database/repositories/SupabasePendingTripRepository';
import { EvolutionAPIProvider } from '../messaging/EvolutionAPIProvider';
import { env } from '../../shared/utils/env';

/**
 * Cria e configura o servidor Express
 * Princípio: Single Responsibility
 */
export function createServer(): Express {
  const app = express();

  // Middlewares globais
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
    });
    next();
  });

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'kimo-api',
    });
  });

  // Rotas
  app.use('/api/whatsapp', createWhatsAppRoutes());

  // 404 handler
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError('Route not found', 404, 'NOT_FOUND'));
  });

  // Error handler global
  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          message: error.message,
          code: error.code,
        },
      });
    }

    // Erro desconhecido
    logger.error('Unhandled error', error);

    return res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    });
  });

  return app;
}

/**
 * Inicializa o serviço de agendamento
 */
export function initializeScheduler(): void {
  logger.info('Initializing scheduler...');
  
  const userRepository = new SupabaseUserRepository(supabase);
  const dailySummaryRepository = new SupabaseDailySummaryRepository(supabase);
  const pendingTripRepository = new SupabasePendingTripRepository(supabase);
  
  const messagingProvider = new EvolutionAPIProvider({
    apiUrl: env.whatsapp.evolutionApiUrl,
    apiKey: env.whatsapp.evolutionApiKey,
    instanceName: env.whatsapp.evolutionInstanceName,
  });

  const scheduler = new SchedulerService(
    userRepository,
    dailySummaryRepository,
    pendingTripRepository,
    messagingProvider
  );

  scheduler.start();
  
  logger.info('Scheduler initialized');
}

